// /api/database/helpers.ts

// 🗑️ HAPUS 'use server' DARI SINI. File ini adalah utility biasa, bukan Server Action Module.

import { discord } from "@/lib/discord-api-handler";
import {
  editMessage,
  sanitizeMessage,
  sendMessage,
} from "@/lib/utils";
import {
  DiscordCategory,
  DiscordChannel,
  DiscordMessage,
  DiscordPartialMessageResponse,
  RequestData,
  UserData,
} from "@/types";
import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server";

import { MESSAGE_LAYOUT, USERS_DATA_CHANNEL_ID } from "@/lib/constants";
import {
  ApiDbErrorResponse,
  ApiDbModifyMessageResponse,
} from "@/types/api-db-response";
import { cache } from "react";

// ✨ Semua fungsi di sini adalah helper server-side biasa,
// bukan actions yang dipanggil dari client.

const ACTIVITY_LOG_CHANNEL_ID = MESSAGE_LAYOUT.channelID;

export enum CHANNEL_TYPE {
  GUILD_TEXT = 0,
  GUILD_CATEGORY = 4,
}

export interface MessageMetadata {
  lastUpdate?: string;
  name?: string;
  size?: number;
  userID?: string;
  isPublic?: boolean;
  [key: string]: any;
}

// ✨ FUNGSI INI MASIH DIPERLUKAN OLEH API ROUTES YANG LAMA, JADI BIARKAN SAJA
export function createApiResponse<T>(data: T, status: number): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleDiscordApiCall<
  T extends
    | DiscordMessage
    | DiscordChannel
    | DiscordCategory
    | DiscordPartialMessageResponse
    | null,
>(
  apiCall: () => Promise<T>,
  successMessage: string,
  successStatus: number = 200,
) {
  try {
    const result = await apiCall();
    const responseBody = result && {
      message: successMessage,
      details: {
        id: result?.id,
        name: "name" in result ? result.name : undefined,
      },
    };
    return createApiResponse<ApiDbModifyMessageResponse>(
      responseBody,
      successStatus,
    );
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || "Discord API Error";
    const errorStatus = error.response?.status || 500;
    console.error(
      chalk.red(`Discord API Call Failed (Status: ${errorStatus}):`),
      errorMessage,
      error.response?.data?.errors || error.response?.data || "",
    );
    return createApiResponse<ApiDbErrorResponse | ApiDbModifyMessageResponse>(
      {
        message: "An error occurred while communicating with Discord.",
        error: errorMessage,
        details: error.response?.data?.errors || error.response?.data,
      },
      errorStatus,
    );
  }
}

export async function loadBodyRequest(
  req: NextRequest,
): Promise<RequestData | null> {
  try {
    const body = await req.json();
    return (body.data as RequestData) || null;
  } catch (error) {
    console.error(chalk.yellow("Could not parse request body as JSON."), error);
    return null;
  }
}

export async function updateActivityLog(
  name: string,
  size: number,
  categoryId: string,
  channelId: string,
  userID?: string,
) {
  if (!ACTIVITY_LOG_CHANNEL_ID) return;

  let logEntryContent = `**[${new Date().toISOString()}]** Item \`${name}\` (Size: ${size} bytes) modified/accessed.`;
  if (userID) logEntryContent += ` User: \`${userID}\`.`;
  logEntryContent += ` Context: Cat:\`${categoryId}\`, Chan:\`${channelId}\`.`;

  try {
    await discord.post(`/channels/${ACTIVITY_LOG_CHANNEL_ID}/messages`, {
      content: logEntryContent,
    });
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error(
      chalk.red("CRITICAL: Failed to post to activity log channel!"),
      errorMessage,
    );
  }
}

// 🗑️ Hapus variabel `updated` karena sudah tidak relevan
// export let updated = false;

// ✨ Fungsi `getUsersData` dengan `cache` sudah benar.
// Fungsi ini bisa diimpor dan digunakan di mana saja di sisi server.
export const getUsersData = cache(async (): Promise<Map<string, UserData>> => {
  console.log(chalk.blue("Fetching user data from Discord (will be cached)..."));
  const users = new Map<string, UserData>();
  try {
    const res = await discord.get<DiscordMessage[]>(
      `/channels/${USERS_DATA_CHANNEL_ID}/messages`,
    );

    if (!res) {
      console.error(chalk.red("Failed to fetch user data from Discord (empty response)."));
      return users;
    }

    const messages = res.map((msg) => sanitizeMessage(msg, true));
    const parsedContent = messages.map((msg) => msg.content as UserData);

    parsedContent.forEach((user) => {
      if (!user) return;
      if (user.userID) users.set(user.userID, user);
      if (user.username && !users.has(user.username))
        users.set(user.username, user);
    });

    console.log(chalk.green("User data fetched and memoized."));
    return users;
  } catch (error: any) {
    console.error(chalk.red("Error fetching user data:"), error.message);
    return new Map<string, UserData>();
  }
});

// save user data to Discord channel
export async function addUserData(
  user: UserData,
): Promise<DiscordPartialMessageResponse | void> {
  if (!USERS_DATA_CHANNEL_ID) {
    console.error(
      chalk.red("USERS_DATA_CHANNEL_ID not set. Cannot save user data."),
    );
    return;
  }

  try {
    const content = JSON.stringify(user);
    const message = await sendMessage(USERS_DATA_CHANNEL_ID, { content });
    if (!message || !message.id) {
      throw new Error("Failed to save user data: No message ID returned.");
    }
    // Tidak perlu `updated = true` lagi, karena kita akan pakai revalidation
    return message;
  } catch (error: any) {
    console.error(
      chalk.red("Error saving user data to Discord:"),
      error.message,
    );
  }
}

// update user data in Discord channel
export async function updateUserData(
  userID: string,
  updates: Partial<UserData>,
  messageId: DiscordMessage["id"],
): Promise<void> {
  if (!USERS_DATA_CHANNEL_ID) {
    console.error(
      chalk.red("USERS_DATA_CHANNEL_ID not set. Cannot update user data."),
    );
    return;
  }

  try {
    const users = await getUsersData();
    const user = users.get(userID);
    if (!user) {
      console.error(chalk.red(`User with ID ${userID} not found.`));
      return;
    }

    Object.assign(user, updates);
    const content = JSON.stringify(user);
    await editMessage(USERS_DATA_CHANNEL_ID, messageId, {
      content,
    });
    // Tidak perlu `updated = true` lagi
  } catch (error: any) {
    console.error(chalk.red("Error updating user data:"), error.message);
  }
}