// src/app/api/worker/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { QueueJob } from "@/types";
import { discord } from "@/lib/discord-api-handler";
import {
  sendMessage,
  editMessage,
  fileAttachmentsBuilder,
} from "@/lib/utils";
import { GUILD_ID } from "@/lib/constants";
import {
  CHANNEL_TYPE,
  slugify,
  updateUserData,
  getUsersData,
  MessageMetadata,
} from "../database/helpers";
import chalk from "chalk";
import { Receiver } from "@upstash/qstash";

// Inisialisasi Receiver untuk verifikasi
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

/**
 * Worker untuk memproses tugas dari antrean QStash.
 * Endpoint ini hanya boleh diakses oleh QStash.
 */
export async function POST(req: NextRequest) {
  // 1. Verifikasi signature dari QStash
  const body = await req.text(); // Baca body sebagai teks mentah
  const isValid = await receiver
    .verify({
      signature: req.headers.get("upstash-signature")!,
      body,
    })
    .catch((err) => {
      console.error("Signature verification error:", err);
      return false;
    });

  if (!isValid) {
    return new NextResponse("Unauthorized: Invalid signature", { status: 401 });
  }

  // 2. Jika valid, lanjutkan proses job
  const job = JSON.parse(body) as QueueJob;
  console.log(chalk.blue(`👷‍♂️ Worker received job: [${job.operation}]`));

  try {
    // Jalankan operasi berdasarkan tipe job
    switch (job.operation) {
      case "CREATE_CATEGORY": {
        const newCategory = await discord.post<any>(
          `/guilds/${GUILD_ID}/channels`,
          {
            name: slugify(job.payload.data.name),
            type: CHANNEL_TYPE.GUILD_CATEGORY,
          },
        );

        // Update data user setelah kategori dibuat
        const users = await getUsersData();
        const user = users.get(job.payload.userId!);
        if (user) {
          user.databases[newCategory.id] = [];
          await updateUserData(user.userID, user, user.message_id);
        }
        break;
      }
      case "CREATE_CHANNEL":
        await discord.post(`/guilds/${GUILD_ID}/channels`, {
          name: slugify(job.payload.data.name),
          parent_id: job.payload.parentId,
          type: CHANNEL_TYPE.GUILD_TEXT,
        });
        break;

      case "SEND_MESSAGE": {
        const { attachments, dataSize } =
          fileAttachmentsBuilder({
            fileName: job.payload.data.name,
            data: job.payload.data.content,
          }) || {};
        const metadata: MessageMetadata = {
          name: job.payload.data.name,
          size: dataSize,
          userID: job.payload.userId,
          isPublic: job.payload.data.isPublic || false,
          lastUpdate: new Date().toISOString(),
        };
        await sendMessage(job.payload.targetId!, {
          content: `\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``,
          files: attachments,
        });
        break;
      }

      case "UPDATE_MESSAGE": {
        // Fetch pesan original untuk mendapatkan metadata lama
        const originalMessage = await discord.get<any>(
          `/channels/${job.payload.parentId}/messages/${job.payload.targetId}`,
        );
        const oldMetadata: MessageMetadata = JSON.parse(
          originalMessage.content.replace(/```json\n|\n```/g, ""),
        );

        const { attachments, dataSize } =
          fileAttachmentsBuilder({
            fileName: job.payload.data.name,
            data: job.payload.data.content,
          }) || {};

        const metadata: MessageMetadata = {
          ...oldMetadata, // Pertahankan userID dan isPublic lama jika tidak di-override
          name: job.payload.data.name,
          size: dataSize,
          lastUpdate: new Date().toISOString(),
        };

        await editMessage(job.payload.parentId!, job.payload.targetId!, {
          content: `\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``,
          files: attachments,
        });
        break;
      }

      case "UPDATE_CHANNEL":
      case "UPDATE_CATEGORY":
        await discord.patch(`/channels/${job.payload.targetId}`, {
          name: slugify(job.payload.data.name),
        });
        break;

      case "TOGGLE_PUBLIC": {
        const originalMessage = await discord.get<any>(
          `/channels/${job.payload.parentId}/messages/${job.payload.targetId}`,
        );
        const metadata: MessageMetadata = JSON.parse(
          originalMessage.content.replace(/```json\n|\n```/g, ""),
        );
        metadata.isPublic = job.payload.isPublic;
        metadata.lastUpdate = new Date().toISOString();

        await editMessage(job.payload.parentId!, job.payload.targetId!, {
          content: `\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``,
        });
        break;
      }

      case "DELETE_MESSAGE":
      case "DELETE_CHANNEL":
      case "DELETE_CATEGORY":
        await discord.delete(`/channels/${job.payload.targetId}`);
        break;

      default:
        throw new Error(`Unknown operation: ${job.operation}`);
    }

    console.log(
      chalk.green(`✅ Job [${job.operation}] completed successfully.`),
    );
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error(
      chalk.red(`🔥 Worker failed on job [${job.operation}]:`),
      error,
    );
    return NextResponse.json(
      { error: "Job processing failed", details: error.message },
      { status: 500 },
    );
  }
}
