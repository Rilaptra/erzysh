// ================================================
// FILE: src/app/api/notifications/send-test/route.ts
// ================================================
import { NextRequest, NextResponse } from "next/server";
import webPush from "@/lib/web-push";
import { validateAndGetUser } from "@/lib/authService";

export async function POST(req: NextRequest) {
  try {
    // 1. Pastikan user yang request sudah login (keamanan)
    await validateAndGetUser(req);

    // 2. Ambil subscription object dari body request
    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Subscription object is required" },
        { status: 400 },
      );
    }

    // 3. Siapkan payload notifikasi untuk testing
    const payload = JSON.stringify({
      title: "✅ Test Notifikasi Berhasil!",
      body: "Jika kamu melihat ini, notifikasi pengingat tugas sudah berfungsi dengan baik.",
    });

    // 4. Kirim notifikasi menggunakan web-push
    await webPush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Tangani jika user tidak terautentikasi
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Tangani error lain, misal subscription tidak valid
    console.error("[API/SEND-TEST] Error:", error);
    return NextResponse.json(
      { error: "Failed to send test notification", details: error.message },
      { status: 500 },
    );
  }
}