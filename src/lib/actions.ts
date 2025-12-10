// src/lib/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers"; // Import headers
import { discord } from "@/lib/discord-api-handler";
import { GUILD_ID } from "@/lib/constants";
import {
  CHANNEL_TYPE,
  getUsersData,
  updateUserData,
} from "@/app/api/database/helpers";
import { slugify } from "./utils";
import jwt from "jsonwebtoken";
import type { UserPayload } from "@/types";

// --- AUTH HELPER KHUSUS SERVER ACTION ---
async function getAuthenticatedUser() {
  const cookieStore = await cookies(); // HARUS DI-AWAIT DI NEXT.JS 15
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("UNAUTHORIZED: No token found.");
  }

  try {
    // Verifikasi manual di sini karena kita tidak punya object 'Request'
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;

    const users = await getUsersData();
    const user = users.get(decoded.userID);

    if (!user) {
      throw new Error("UNAUTHORIZED: User not found in database.");
    }
    return user;
  } catch (error) {
    console.error("Auth Action Error:", error);
    throw new Error("UNAUTHORIZED: Invalid token.");
  }
}

// --- HONEYPOT LOGGING ---
interface UserInput {
  nama: string;
  npm: string;
  nomor_kelas: string;
  zipFileName: string | null;
}

export async function logSuspiciousActivity(userInput: UserInput) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl)
      return { success: false, error: "Webhook URL not configured." };

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") ?? "Unknown IP";
    const userAgent = headersList.get("user-agent") ?? "Unknown UA";

    const embed = {
      title: "🚨 SUSPICIOUS ACTIVITY LOG",
      description: "User triggered honeypot form.",
      color: 0xffa500,
      fields: [
        {
          name: "User Info",
          value: `${userInput.nama} (${userInput.npm}) - ${userInput.nomor_kelas}`,
          inline: false,
        },
        { name: "File", value: userInput.zipFileName || "None", inline: true },
        { name: "IP Address", value: ip, inline: true },
        { name: "User Agent", value: userAgent, inline: false },
      ],
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Internal error." };
  }
}

// --- DATABASE ACTIONS ---

export async function createCategoryAction(name: string) {
  if (!name) throw new Error("Category name is required.");

  const user = await getAuthenticatedUser(); // Auth Check

  const category = await discord.post<any>(`/guilds/${GUILD_ID}/channels`, {
    name: slugify(name),
    type: CHANNEL_TYPE.GUILD_CATEGORY,
  });

  if (!category) throw new Error("Failed to create category on Discord.");

  // Init empty array for new category
  user.databases[category.id] = [];
  await updateUserData(user.userID, user, user.message_id);

  revalidatePath("/database");
  return { success: true, category };
}

export async function updateCategoryAction(id: string, name: string) {
  if (!id || !name) throw new Error("Invalid parameters.");
  await getAuthenticatedUser();

  const updatedCategory = await discord.patch(`/channels/${id}`, {
    name: slugify(name),
  });

  revalidatePath("/database");
  return { success: true, updatedCategory };
}

export async function deleteCategoryAction(id: string) {
  if (!id) throw new Error("ID required.");
  const user = await getAuthenticatedUser();

  await discord.delete(`/channels/${id}`);

  delete user.databases[id];
  await updateUserData(user.userID, user, user.message_id);

  revalidatePath("/database");
  return { success: true };
}

// --- BOX (CHANNEL) ACTIONS ---
// Tambahkan ini jika sebelumnya error saat create box lewat client component gagal
// Tapi biasanya create box lewat API Route. Pastikan API Route juga aman.

export async function deleteMessageAction(
  channelId: string,
  messageId: string,
) {
  if (!channelId || !messageId) throw new Error("IDs required.");
  await getAuthenticatedUser();

  await discord.delete(`/channels/${channelId}/messages/${messageId}`);

  revalidatePath("/database");
  return { success: true };
}
