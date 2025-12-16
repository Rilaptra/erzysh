import { NextRequest, NextResponse } from "next/server";
import { discord } from "@/lib/discord-api-handler";
import { sendMessage } from "@/lib/utils";
import { GHOST_CHANNEL_ID } from "@/lib/constants";
import { sanitizeMessage } from "@/lib/utils";

export const dynamic = "force-dynamic"; // Penting buat Vercel biar gak di-cache statis

// 1. GET: Dipanggil sama RUST Agent buat ngecek "Ada perintah gak?"
export async function GET() {
  try {
    // Ambil pesan terakhir dari channel
    const messages = await discord.get<any[]>(
      `/channels/${GHOST_CHANNEL_ID}/messages?limit=1`,
    );

    if (!messages || messages.length === 0) {
      return NextResponse.json({ command: null });
    }

    const latestMsg = messages[0];
    const sanitized = sanitizeMessage(latestMsg);

    // Cek apakah ini command yang belum dieksekusi (Status: PENDING)
    // Kita pakai format JSON di content: { "status": "PENDING", "cmd": "GET_FILE:..." }
    let content: any = sanitized.content;

    // Safety check kalau content masih string (belum diparsing sanitizeMessage)
    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch {
        return NextResponse.json({ command: null });
      }
    }

    if (content && content.status === "PENDING") {
      // Tandai pesan sebagai PROCESSING biar gak diambil berkali-kali (opsional, atau Rust yang delete nanti)
      // Disini kita kirim aja ke Rust
      return NextResponse.json({
        messageId: latestMsg.id,
        command: content.cmd,
      });
    }

    // Cek apakah ini RESULT dari Rust? (Link download)
    if (content && content.status === "DONE") {
      return NextResponse.json({
        result: content.data, // Link download atau pesan error
      });
    }

    return NextResponse.json({ command: null });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch commands" },
      { status: 500 },
    );
  }
}

// 2. POST: Dipanggil sama WEB UI buat naruh perintah ATAU Rust buat lapor hasil
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Skenario A: Web UI kirim perintah baru
    if (body.action === "queue_command") {
      const payload = {
        status: "PENDING",
        cmd: body.command, // Contoh: "GET_FILE:D:\Tugas.zip"
        timestamp: Date.now(),
      };

      await sendMessage(GHOST_CHANNEL_ID, {
        content: `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
      });

      return NextResponse.json({ success: true, status: "queued" });
    }

    // Skenario B: Rust Agent lapor tugas selesai (Kirim Link)
    if (body.action === "report_result") {
      // Hapus pesan perintah lama (opsional, biar bersih)
      if (body.replyToId) {
        await discord.delete(
          `/channels/${GHOST_CHANNEL_ID}/messages/${body.replyToId}`,
        );
      }

      const payload = {
        status: "DONE",
        data: body.data, // Link GoFile / Discord Attachment URL
      };

      await sendMessage(GHOST_CHANNEL_ID, {
        content: `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
