// app/lib/actions.ts
"use server";

import { headers } from "next/headers";

// Definisikan tipe data untuk info yang dikirim dari frontend
interface UserInput {
  nama: string;
  npm: string;
  nomor_kelas: string;
  zipFileName: string | null;
}

/**
 * Mengambil informasi dari request dan input user, lalu mengirimkannya ke Discord.
 */
export async function logSuspiciousActivity(userInput: UserInput) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("DISCORD_WEBHOOK_URL is not set in .env.local!");
      return { success: false, error: "Webhook URL not configured." };
    }

    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip");
    const userAgent = headersList.get("user-agent");

    let geoData = null;
    if (ip) {
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}`);
      if (geoResponse.ok) {
        geoData = await geoResponse.json();
      }
    }

    // --- PENAMBAHAN INFO BARU DI SINI ---
    const embed = {
      title: "🚨🚨 HIGH-PRIORITY SUSPICIOUS CLICK 🚨🚨",
      description: "A user triggered the honeypot with form data.",
      color: 0xffa500, // Oranye
      fields: [
        {
          name: "👤 Nama Lengkap",
          value: `\`${userInput.nama || "Tidak diisi"}\``,
          inline: false,
        },
        {
          name: "🆔 NPM",
          value: `\`${userInput.npm || "Tidak diisi"}\``,
          inline: true,
        },
        {
          name: "🏫 Kelas",
          value: `\`${userInput.nomor_kelas || "Tidak diisi"}\``,
          inline: true,
        },
        {
          name: "📁 File ZIP Diupload",
          value: `\`${userInput.zipFileName || "Tidak ada"}\``,
          inline: false,
        },
        { name: "---", value: "---", inline: false }, // Pemisah
        { name: "🌐 IP Address", value: `\`${ip || "N/A"}\``, inline: true },
        {
          name: "📍 Lokasi",
          value: `\`${geoData?.city || "N/A"}, ${geoData?.country || "N/A"}\``,
          inline: true,
        },
        {
          name: "📡 ISP",
          value: `\`${geoData?.isp || "N/A"}\``,
          inline: false,
        },
        {
          name: "💻 User Agent",
          value: `\`\`\`${userAgent || "N/A"}\`\`\``,
          inline: false,
        },
      ],
      footer: { text: "Honeypot Security System" },
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    return { success: true };
  } catch (error) {
    console.error("Error in logSuspiciousActivity:", error);
    return { success: false, error: "An internal error occurred." };
  }
}

// ==============================
//       DASHBOARD SECTION
// ==============================

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { discord } from "@/lib/discord-api-handler";
import { GUILD_ID } from "@/lib/constants";
import { CHANNEL_TYPE } from "@/app/api/database/helpers";
import { verifyAuth } from "./authUtils";
import { getUsersData, updateUserData } from "@/app/api/database/helpers";
import { slugify } from "./utils";

// ✨ Helper internal untuk otentikasi di setiap action
async function getAuthenticatedUser() {
  const userPayload = verifyAuth({ cookies: cookies() } as any);
  if (!userPayload?.userID) {
    throw new Error("UNAUTHORIZED: You must be logged in.");
  }

  const users = await getUsersData();
  const user = users.get(userPayload.userID);

  if (!user) {
    throw new Error("UNAUTHORIZED: User not found.");
  }
  return user;
}

// --- CATEGORY (CONTAINER) ACTIONS ---

export async function createCategoryAction(name: string) {
  if (!name) throw new Error("Category name is required.");
  const user = await getAuthenticatedUser();

  const category = await discord.post<any>(`/guilds/${GUILD_ID}/channels`, {
    name: slugify(name),
    type: CHANNEL_TYPE.GUILD_CATEGORY,
  });

  if (!category) throw new Error("Failed to create category on Discord.");

  // Update data user dengan akses database baru
  user.databases[category.id] = [];
  await updateUserData(user.userID, user, user.message_id);

  revalidatePath("/database"); // ✨ MAGIC: Bersihkan cache untuk path ini
  revalidatePath("/dashboard");
  return { success: true, category };
}

export async function updateCategoryAction(id: string, name: string) {
  if (!id || !name) throw new Error("Category ID and name are required.");
  await getAuthenticatedUser(); // Cek otentikasi

  const updatedCategory = await discord.patch(`/channels/${id}`, {
    name: slugify(name),
  });

  revalidatePath("/database"); // ✨ MAGIC: Bersihkan cache
  return { success: true, updatedCategory };
}

export async function deleteCategoryAction(id: string) {
  if (!id) throw new Error("Category ID is required.");
  const user = await getAuthenticatedUser();

  // Di sini bisa ditambahkan logic untuk menghapus semua channel di dalamnya dulu
  await discord.delete(`/channels/${id}`);

  // Hapus dari data user
  delete user.databases[id];
  await updateUserData(user.userID, user, user.message_id);

  revalidatePath("/database"); // ✨ MAGIC: Bersihkan cache
  revalidatePath("/dashboard");
  return { success: true };
}

// --- CHANNEL (BOX) ACTIONS ---

export async function createChannelAction(categoryId: string, name: string) {
  if (!categoryId || !name)
    throw new Error("Category ID and name are required.");
  const user = await getAuthenticatedUser();

  const channel = await discord.post<any>(`/guilds/${GUILD_ID}/channels`, {
    name: slugify(name),
    parent_id: categoryId,
    type: CHANNEL_TYPE.GUILD_TEXT,
  });

  if (!channel) throw new Error("Failed to create channel on Discord.");

  if (user.databases[categoryId]) {
    user.databases[categoryId].push(channel.id);
    await updateUserData(user.userID, user, user.message_id);
  }

  revalidatePath("/database"); // ✨ MAGIC: Bersihkan cache
  return { success: true, channel };
}

// --- MESSAGE (COLLECTION) ACTIONS ---

export async function deleteMessageAction(
  channelId: string,
  messageId: string,
) {
  if (!channelId || !messageId)
    throw new Error("Channel and Message ID are required.");
  await getAuthenticatedUser(); // Auth check

  await discord.delete(`/channels/${channelId}/messages/${messageId}`);

  revalidatePath("/database"); // ✨ MAGIC: Bersihkan cache
  return { success: true };
}

// ... Tambahkan action-action lain yang kamu butuhkan (updateChannel, deleteChannel, sendMessage, updateMessage)
// dengan pola yang sama: Auth -> Aksi ke Discord -> Revalidate.
