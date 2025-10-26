// src/app/api/user-tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateAndGetUser } from "@/lib/authService";
import {
  getMessagesFromChannel,
  sendMessage,
  editMessage,
} from "@/lib/utils";
import { discord } from "@/lib/discord-api-handler";
import { USER_TASK_COMPLETIONS_BOX_ID } from "@/lib/constants";
import { sanitizeMessage } from "@/lib/utils";
import type { DiscordMessage } from "@/types";

// Helper untuk menemukan atau membuat dokumen penyelesaian tugas user
async function findOrCreateUserCompletionDoc(userId: string) {
  const messages = await getMessagesFromChannel(USER_TASK_COMPLETIONS_BOX_ID);
  const userMessage = messages.find((msg) => msg.name === `${userId}.json`);

  if (userMessage) {
    // Fetch detail message untuk mendapatkan URL attachment
    const fullMsg = await discord.get<DiscordMessage>(
      `/channels/${USER_TASK_COMPLETIONS_BOX_ID}/messages/${userMessage.id}`,
    );
    if (!fullMsg) throw new Error("Failed to fetch message from Discord.");
    const sanitized = sanitizeMessage(fullMsg);
    if (sanitized.attachments && sanitized.attachments.length > 0) {
      const attachmentUrl = sanitized.attachments[0].url;
      const res = await fetch(attachmentUrl);
      const data: { completedTasks: string[] } = await res.json();
      return { messageId: userMessage.id, data };
    }
  }
  // Jika tidak ada, kembalikan struktur kosong
  return { messageId: null, data: { completedTasks: [] } };
}

// GET: Mendapatkan daftar ID tugas yang sudah diselesaikan oleh user
export async function GET(req: NextRequest) {
  try {
    const user = await validateAndGetUser(req);
    const { data } = await findOrCreateUserCompletionDoc(user.userID);
    return NextResponse.json(data);
  } catch (error) {
    if ((error as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST: Menandai tugas sebagai selesai
export async function POST(req: NextRequest) {
  try {
    const user = await validateAndGetUser(req);
    const { taskId } = (await req.json()) as { taskId: never };
    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 },
      );
    }

    const { messageId, data } = await findOrCreateUserCompletionDoc(
      user.userID,
    );

    if (!data.completedTasks.includes(taskId)) {
      data.completedTasks.push(taskId);
    }

    const payloadContent = JSON.stringify(data, null, 2);
    const fileName = `${user.userID}.json`;

    if (messageId) {
      // Update message yang ada
      await editMessage(USER_TASK_COMPLETIONS_BOX_ID, messageId, {
        files: [{ name: fileName, buffer: Buffer.from(payloadContent) }],
      });
    } else {
      // Buat message baru
      await sendMessage(USER_TASK_COMPLETIONS_BOX_ID, {
        content: `Completion data for user ${user.userID}`,
        files: [{ name: fileName, buffer: Buffer.from(payloadContent) }],
      });
    }

    return NextResponse.json({
      success: true,
      completedTasks: data.completedTasks,
    });
  } catch (error) {
    if ((error as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// DELETE: Menandai tugas sebagai belum selesai
export async function DELETE(req: NextRequest) {
  try {
    const user = await validateAndGetUser(req);
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId query parameter is required" },
        { status: 400 },
      );
    }

    const { messageId, data } = await findOrCreateUserCompletionDoc(
      user.userID,
    );

    if (!messageId) {
      return NextResponse.json({ success: true, completedTasks: [] }); // Nothing to delete
    }

    data.completedTasks = data.completedTasks.filter((id) => id !== taskId);

    const payloadContent = JSON.stringify(data, null, 2);
    const fileName = `${user.userID}.json`;

    await editMessage(USER_TASK_COMPLETIONS_BOX_ID, messageId, {
      files: [{ name: fileName, buffer: Buffer.from(payloadContent) }],
    });

    return NextResponse.json({
      success: true,
      completedTasks: data.completedTasks,
    });
  } catch (error) {
    if ((error as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
