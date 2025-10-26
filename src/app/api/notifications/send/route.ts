// File: src/app/api/notifications/send/route.ts

import { NextRequest, NextResponse } from "next/server";
import webPush from "@/lib/web-push";
import { getMessagesFromChannel, sanitizeMessage } from "@/lib/utils";
import { discord } from "@/lib/discord-api-handler";
import type { Tugas } from "@/types/tugas";
import type { DiscordMessage } from "@/types";

const TUGAS_CONTAINER_ID = "1409908765074919585";
const TUGAS_BOX_ID = "1409908859971309681";
const SUB_BOX_ID = "1411367472791158898";

export async function GET(req: NextRequest) {
  // Amankan endpoint ini dengan secret
  const authToken = req.headers.get("Authorization");
  if (authToken !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 1. Ambil semua tugas
    const tugasRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/database/${TUGAS_CONTAINER_ID}/${TUGAS_BOX_ID}?full=true`,
      // PENTING: Cron job Vercel tidak punya cookie, jadi kita harus pake cara lain
      // untuk autentikasi jika endpoint ini dilindungi.
      // Di sini kita asumsikan tidak ada auth, atau pake secret lain jika perlu.
    );
    if (!tugasRes.ok) throw new Error(`Gagal mengambil tugas: ${tugasRes.statusText}`);
    const { data: allTugas } = (await tugasRes.json()) as { data: Tugas[] };

    // 2. Filter tugas yang deadline-nya besok
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const upcomingTugas = allTugas.filter((t) => {
      if (t.isCompleted) return false;
      const deadline = new Date(t.deadline);
      return (
        deadline.getFullYear() === tomorrow.getFullYear() &&
        deadline.getMonth() === tomorrow.getMonth() &&
        deadline.getDate() === tomorrow.getDate()
      );
    });

    if (upcomingTugas.length === 0) {
      console.log("No upcoming tasks for tomorrow.");
      return NextResponse.json({ message: "No upcoming tasks for tomorrow." });
    }

    // 3. Ambil SEMUA file subscription
    console.log("Fetching all subscriptions from Discord...");
    const subMessages = await getMessagesFromChannel(SUB_BOX_ID);
    if (!subMessages || subMessages.length === 0) {
      console.log("No subscribers to notify.");
      return NextResponse.json({ message: "No subscribers to notify." });
    }

    // 4. Buka isi file (attachment) dari setiap message secara paralel
    console.log(`Found ${subMessages.length} potential subscribers. Fetching details...`);
    const subscriptionPromises = subMessages.map(async (msg) => {
      try {
        const fullMsg = await discord.get<DiscordMessage>(`/channels/${SUB_BOX_ID}/messages/${msg.id}`);
        if (!fullMsg) return null;
        const sanitized = sanitizeMessage(fullMsg);
        if (sanitized.attachments && sanitized.attachments.length > 0) {
          const res = await fetch(sanitized.attachments[0].url);
          if (!res.ok) return null;
          const data = await res.json();
          if (data && data.subscription) {
            return { messageId: msg.id, subscription: data.subscription };
          }
        }
        return null;
      } catch (e) {
        console.warn(`Could not process subscription message ${msg.id}:`, e);
        return null;
      }
    });

    const validSubscriptions = (await Promise.all(subscriptionPromises)).filter(Boolean);

    if (validSubscriptions.length === 0) {
        console.log("No valid subscription data found after processing.");
        return NextResponse.json({ message: "No valid subscription data found." });
    }

    // 5. Kirim notifikasi ke setiap subscriber yang valid
    console.log(`Sending notifications for ${upcomingTugas.length} task(s) to ${validSubscriptions.length} subscriber(s).`);
    
    const notificationPayload = JSON.stringify({
        title: `‼️ Pengingat: ${upcomingTugas.length} Tugas Deadline Besok!`,
        body: `Jangan lupa, tugas ${upcomingTugas.map(t => t.judul).join(', ')} akan jatuh tempo besok!`,
    });

    const sendPromises = validSubscriptions.map(async (subData) => {
      try {
        if (!subData) return;
        await webPush.sendNotification(subData.subscription, notificationPayload);
      } catch (error: any) {
        // Jika subscription kadaluarsa, Push Service akan return error 410 (Gone)
        if (error.statusCode === 410) {
          console.log(`Subscription expired. Deleting from Discord: ${subData?.messageId}`);
          // Hapus message subscription yang udah nggak valid dari Discord
          await discord.delete(`/channels/${SUB_BOX_ID}/messages/${subData?.messageId}`);
        } else {
          console.error(`Failed to send notification:`, error.body);
        }
      }
    });
    
    await Promise.all(sendPromises);

    return NextResponse.json({
      message: `Successfully processed notifications for ${upcomingTugas.length} tasks.`,
    });
  } catch (error) {
    console.error("[CRON-JOB-ERROR]", error);
    return NextResponse.json(
      { error: "Failed to send notifications", details: (error as Error).message },
      { status: 500 }
    );
  }
}