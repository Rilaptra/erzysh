// ================================================
// FILE: src/app/api/notifications/send-specific/route.ts
// ================================================
import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import webPush from "@/lib/web-push";
import { discord } from "@/lib/discord-api-handler";
import { getMessagesFromChannel } from "@/lib/utils";
import type { Tugas } from "@/types/tugas";
import type { DiscordMessage } from "@/types";

const TUGAS_BOX_ID = "1409908859971309681";
const SUB_BOX_ID = "1411367472791158898";

// Verifikasi request dari QStash
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const isValid = await receiver.verify({
    signature: req.headers.get("upstash-signature")!,
    body,
  });

  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { taskId } = JSON.parse(body) as { taskId: string };

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    // 1. Ambil detail tugas spesifik dari Discord
    const message = await discord.get<DiscordMessage>(`/channels/${TUGAS_BOX_ID}/messages/${taskId}`);
    if (!message || !message.attachments || message.attachments.length === 0) {
      console.warn(`Tugas dengan ID ${taskId} tidak ditemukan atau tidak memiliki data.`);
      return NextResponse.json({ message: "Tugas tidak ditemukan." });
    }
    
    const attachmentUrl = message.attachments[0].url;
    const tugasRes = await fetch(attachmentUrl);
    if (!tugasRes.ok) throw new Error("Gagal mengambil data lampiran tugas.");
    
    const tugasData: Omit<Tugas, "id"> = await tugasRes.json();
    
    // Jangan kirim notif jika tugas sudah selesai
    if (tugasData.isCompleted) {
        console.log(`Tugas ${taskId} sudah selesai, notifikasi dibatalkan.`);
        return NextResponse.json({ message: "Tugas sudah selesai." });
    }

    // 2. Ambil semua subscriber (logika ini sama seperti di /send)
    const subMessages = await getMessagesFromChannel(SUB_BOX_ID);
    if (!subMessages || subMessages.length === 0) {
      return NextResponse.json({ message: "Tidak ada subscriber." });
    }

    const subscriptionPromises = subMessages.map(async (msg) => {
      try {
        const fullMsg = await discord.get<DiscordMessage>(`/channels/${SUB_BOX_ID}/messages/${msg.id}`);
        if (!fullMsg || !fullMsg.attachments || fullMsg.attachments.length === 0) return null;
        const res = await fetch(fullMsg.attachments[0].url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.subscription ? { messageId: msg.id, subscription: data.subscription } : null;
      } catch {
        return null;
      }
    });
    
    const validSubscriptions = (await Promise.all(subscriptionPromises)).filter(Boolean);

    // 3. Kirim notifikasi spesifik
    const notificationPayload = JSON.stringify({
      title: `🔔 Pengingat Deadline: ${tugasData.judul}`,
      body: `Tugas ini akan jatuh tempo sekitar 1 jam lagi. Segera selesaikan!`,
    });

    const sendPromises = validSubscriptions.map(async (subData) => {
      if (!subData) return;
      try {
        await webPush.sendNotification(subData.subscription, notificationPayload);
      } catch (error: any) {
        if (error.statusCode === 410) {
          await discord.delete(`/channels/${SUB_BOX_ID}/messages/${subData.messageId}`);
        }
      }
    });
    
    await Promise.all(sendPromises);

    return NextResponse.json({ message: `Notifikasi untuk tugas ${taskId} berhasil dikirim.` });

  } catch (error) {
    console.error("[QSTASH-WORKER-ERROR]", error);
    return NextResponse.json({ error: "Failed to send specific notification" }, { status: 500 });
  }
}