// /api/database/helpers.ts
import { discord } from "@/lib/discord-api-handler";
import {
  editMessage,
  sanitizeMessage,
  sendMessage,
} from "@/lib/utils"; // Added discord for direct use in activity log
import {
  DiscordCategory,
  DiscordChannel,
  DiscordMessage,
  DiscordPartialMessageResponse,
  RequestData,
  UserData,
} from "@/types";
import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server"; // NextRequest is used by loadBodyRequest

// --- Shared Constants ---
// Import MESSAGE_LAYOUT which contains the channelID for activity log
import { MESSAGE_LAYOUT, USERS_DATA_CHANNEL_ID } from "@/lib/constants";
import {
  ApiDbErrorResponse,
  ApiDbModifyMessageResponse,
  GetApiDatabaseCategoryMessagesResponse,
  GetApiDatabaseChannelMessagesResponse,
  GetApiDatabaseMessageResponse,
  GetApiDatabaseResponse,
} from "@/types/api-db-response";

// Use MESSAGE_LAYOUT.channelID where ACTIVITY_LOG_CHANNEL_ID was used
const ACTIVITY_LOG_CHANNEL_ID = MESSAGE_LAYOUT.channelID;

export enum CHANNEL_TYPE {
  GUILD_TEXT = 0,
  GUILD_CATEGORY = 4,
  // Add other types if necessary
}

// Define a type for the parsed metadata from message content
export interface MessageMetadata {
  lastUpdate?: string;
  name?: string;
  size?: number;
  userID?: string;
  isPublic?: boolean; // <-- TAMBAHKAN INI
  [key: string]: any;
}

// --- Shared Helper Functions ---

export function createApiResponse<
  T extends
    | ApiDbErrorResponse
    | GetApiDatabaseResponse
    | GetApiDatabaseCategoryMessagesResponse
    | GetApiDatabaseChannelMessagesResponse
    | GetApiDatabaseMessageResponse,
>(data: T, status: number): NextResponse<T> {
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
      error.response?.data?.errors || error.response?.data || "", // Log more details
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

export const getMimeType = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogg":
      return "video/ogg";
    case "json":
      return "application/json";
    case "txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
};

export async function loadBodyRequest(
  req: NextRequest, // Changed from Request to NextRequest for consistency if needed, or use global Request
): Promise<RequestData | null> {
  try {
    const body = await req.json();
    // Assuming body.data is not the structure, but body itself is RequestData or contains it.
    // If RequestData is the whole body:
    // return body as RequestData;
    // If RequestData is under a 'data' property:
    return (body.data as RequestData) || null;
  } catch (error) {
    console.error(chalk.yellow("Could not parse request body as JSON."), error);
    return null;
  }
}

export function slugify(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .toString() // Ensure it's a string
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

// Updated to use discord.post and include userID
export async function updateActivityLog(
  name: string,
  size: number,
  categoryId: string,
  channelId: string,
  userID?: string, // userID is now optional
) {
  if (!ACTIVITY_LOG_CHANNEL_ID) {
    // console.warn(chalk.yellow("ACTIVITY_LOG_CHANNEL_ID not set. Skipping activity log."));
    return;
  }

  let logEntryContent = `**[${new Date().toISOString()}]** Item \`${name}\` (Size: ${size} bytes) modified/accessed.`;
  if (userID) {
    logEntryContent += ` User: \`${userID}\`.`;
  }
  logEntryContent += ` Context: Cat:\`${categoryId}\`, Chan:\`${channelId}\`.`;

  try {
    // Instead of editing a single message, post a new log entry.
    // This is generally better for logging.
    await discord.post(`/channels/${ACTIVITY_LOG_CHANNEL_ID}/messages`, {
      content: logEntryContent,
    });
    // console.log(chalk.blue("Activity log updated with new entry."));
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error(
      chalk.red("CRITICAL: Failed to post to activity log channel!"),
      errorMessage,
    );
  }
}

// Example user data
// {
//     "userID": "7a9153a0-5a97-4671-a81b-9f25811516aa",
//     "username": "erzysh",
//     "password_hash": "$2b$10$f2Us6E.9X2GNecsle2j6xOgIrOWAkDLmG3zhHKWrgsKnGfPMj5Cnq",
//     "is_admin": true,
//     "databases": {"1393568988474376303": ["1393569017150836879"]},
// }

// Simple in-memory cache for user data
export let userCache: Map<string, UserData> | null = null;
export let updated = false;
let lastFetchTime: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // Cache for 5 minutes

export async function getUsersData(): Promise<Map<string, UserData>> {
  const now = Date.now();

  // Check if cache is valid
  if (
    userCache &&
    lastFetchTime &&
    now - lastFetchTime < CACHE_DURATION_MS &&
    !updated
  ) {
    // console.log(chalk.blue("Returning cached user data."));
    return userCache;
  }

  // Cache is invalid or doesn't exist, fetch data
  console.log(chalk.blue("Fetching user data from Discord..."));
  const users = new Map<string, UserData>();
  try {
    const res = await discord.get<DiscordMessage[]>(
      `/channels/${USERS_DATA_CHANNEL_ID}/messages`,
    );

    if (!res) {
      console.error(
        chalk.red("Failed to fetch user data from Discord (empty response)."),
      );
      // Return empty map, do not cache on failure
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

    // Update cache and timestamp on successful fetch
    userCache = users;
    lastFetchTime = now;
    updated = false;
    // console.log(chalk.blue("User data fetched and cached."));

    return users;
  } catch (error: any) {
    console.error(chalk.red("Error fetching user data:"), error.message);
    // Return empty map on error, do not update cache
    return new Map<string, UserData>();
  }
}

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
    updated = true;
    return message;
    // console.log(chalk.blue(`User data for ${user.username} saved successfully.`));
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

    // Update user properties
    Object.assign(user, updates);
    const content = JSON.stringify(user);
    editMessage(USERS_DATA_CHANNEL_ID, messageId, {
      content,
    });

    updated = true;

    // console.log(chalk.blue(`User data for ${user.username} updated successfully.`));
  } catch (error: any) {
    console.error(chalk.red("Error updating user data:"), error.message);
  }
}
