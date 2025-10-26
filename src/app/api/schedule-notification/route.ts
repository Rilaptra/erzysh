// ================================================
// FILE: src/app/api/schedule-notification/route.ts
// ================================================
import { NextRequest, NextResponse } from "next/server";
import { validateAndGetUser } from "@/lib/authService";

// URL dan Token QStash yang aman (hanya bisa diakses di server)
const QSTASH_URL = process.env.QSTASH_URL!;
const QSTASH_TOKEN = process.env.QSTASH_TOKEN!;

/**
 * Endpoint untuk MENJADWALKAN notifikasi baru di QStash.
 * Dipanggil dari client-side.
 */
export async function POST(req: NextRequest) {
  try {
    // Pastikan user login sebelum bisa menjadwalkan notifikasi
    await validateAndGetUser(req);

    const { taskId, deadline } = await req.json();
    console.log(
      `[API/SCHEDULE] Received schedule request for taskId: ${taskId} with deadline: ${deadline}`,
    ); // Debugging log

    if (!taskId || !deadline) {
      return NextResponse.json(
        { error: "taskId and deadline are required" },
        { status: 400 },
      );
    }

    const deadlineDate = new Date(deadline);
    // Jadwalkan 1 jam sebelum deadline
    const notifyAt = new Date(deadlineDate.getTime() - 60 * 60 * 1000);

    // Jangan jadwalkan jika waktunya sudah lewat
    if (notifyAt.getTime() < Date.now()) {
      return NextResponse.json({
        message: "Notification time has passed, not scheduled.",
      });
    }

    // --- PERBAIKAN DI SINI ---
    // 'body' harus berisi string JSON, bukan string yang di-stringify dua kali.
    const qstashPayload = {
      destination: `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send-specific`,
      body: JSON.stringify({ taskId }), // Cukup stringify payload bagian dalam saja
    };
    // --- AKHIR PERBAIKAN ---

    const res = await fetch(QSTASH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${QSTASH_TOKEN}`,
        "Content-Type": "application/json",
        "Upstash-Not-Before": Math.floor(notifyAt.getTime() / 1000).toString(),
      },
      // Kirim payload yang sudah benar
      body: JSON.stringify(qstashPayload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`QStash scheduling failed: ${JSON.stringify(error)}`);
    }

    const { messageId } = await res.json();
    return NextResponse.json({ messageId });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/schedule-notification:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * Endpoint untuk MEMBATALKAN notifikasi terjadwal di QStash.
 * Dipanggil dari client-side.
 */
export async function DELETE(req: NextRequest) {
  try {
    await validateAndGetUser(req);

    const { qstashMessageId } = await req.json();
    if (!qstashMessageId) {
      return NextResponse.json(
        { error: "qstashMessageId is required" },
        { status: 400 },
      );
    }

    const res = await fetch(`${QSTASH_URL}/messages/${qstashMessageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${QSTASH_TOKEN}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `Failed to cancel QStash message ${qstashMessageId}:`,
        errorText,
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/schedule-notification:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
