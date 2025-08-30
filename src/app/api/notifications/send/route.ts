// src/app/api/notifications/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import webPush from "@/lib/web-push";
import { getMessagesFromChannel } from "@/lib/utils";
import type { Tugas } from "@/types/tugas";

// ID Container dan Box tugas
const TUGAS_CONTAINER_ID = "1409908765074919585";
const TUGAS_BOX_ID = "1409908859971309681";
// ID Container dan Box subscription
// const SUB_CONTAINER_ID = "1409908765074919585";
const SUB_BOX_ID = "1411367472791158898";

export async function GET(req: NextRequest) {
  // Amankan endpoint ini agar tidak bisa diakses publik
  const authToken = req.headers.get("Authorization");
  if (authToken !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 1. Ambil semua tugas
    const tugasRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/database/${TUGAS_CONTAINER_ID}/${TUGAS_BOX_ID}?full=true`,
      {
        headers: req.headers, // Teruskan header auth
      },
    );
    if (!tugasRes.ok) throw new Error("Failed to fetch tasks");
    const { data: allTugas } = await tugasRes.json();

    // 2. Filter tugas yang deadline-nya besok
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const upcomingTugas = (allTugas as Tugas[]).filter((t) => {
      const deadline = new Date(t.deadline);
      return (
        !t.isCompleted &&
        deadline.getFullYear() === tomorrow.getFullYear() &&
        deadline.getMonth() === tomorrow.getMonth() &&
        deadline.getDate() === tomorrow.getDate()
      );
    });

    if (upcomingTugas.length === 0) {
      return NextResponse.json({ message: "No upcoming tasks for tomorrow." });
    }

    // 3. Ambil semua subscription
    const subsCollections = await getMessagesFromChannel(SUB_BOX_ID);
    // ... (Logika untuk fetch detail setiap subscription dan kirim notifikasi)
    // Ini bagian yang kompleks, butuh fetch detail setiap file subscription

    const notificationPromises = upcomingTugas.map((tugas) => {
      const payload = JSON.stringify({
        title: `‼️ Pengingat Deadline: ${tugas.judul}`,
        body: `Tugas "${tugas.mataKuliah}" akan jatuh tempo besok!`,
      });
      // Loop ke semua subscriber dan kirim
      subsCollections.forEach((sub) =>
        webPush.sendNotification((sub as any).subscription, payload),
      );
      console.log(`Menyiapkan notifikasi untuk: ${tugas.judul}`);
      return Promise.resolve(); // Placeholder
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({
      message: `Sent notifications for ${upcomingTugas.length} tasks.`,
    });
  } catch (error) {
    console.error("[API/SEND] Error:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 },
    );
  }
}
