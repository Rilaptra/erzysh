// /api/database/helpers.ts
import { discord, editMessage } from "@/lib/utils"; // Added discord for direct use in activity log
import { RequestData } from "@/types";
import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server"; // NextRequest is used by loadBodyRequest

// --- Shared Constants ---
// Assuming ACTIVITY_LOG_CHANNEL_ID is still from constants if not defined here
import { ACTIVITY_LOG_CHANNEL_ID } from "@/lib/constants";

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
  userID?: string; // Added userID
  [key: string]: any; // Allow other properties if necessary
}


// --- Shared Helper Functions ---

export function createApiResponse(data: object, status: number): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleDiscordApiCall(
  apiCall: () => Promise<any>,
  successMessage: string,
  successStatus: number = 200
): Promise<NextResponse> {
  try {
    const result = await apiCall();
    const responseBody = result && typeof result === 'object' ? result : { message: successMessage, details: result };
    return createApiResponse(responseBody, successStatus);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Discord API Error";
    const errorStatus = error.response?.status || 500;
    console.error(
      chalk.red(`Discord API Call Failed (Status: ${errorStatus}):`),
      errorMessage,
      error.response?.data?.errors || error.response?.data || "" // Log more details
    );
    return createApiResponse(
      {
        message: "An error occurred while communicating with Discord.",
        error: errorMessage,
        details: error.response?.data?.errors || error.response?.data,
      },
      errorStatus
    );
  }
}

export async function loadBodyRequest(
  req: NextRequest // Changed from Request to NextRequest for consistency if needed, or use global Request
): Promise<RequestData | null> {
  try {
    const body = await req.json();
    // Assuming body.data is not the structure, but body itself is RequestData or contains it.
    // If RequestData is the whole body:
    return body as RequestData;
    // If RequestData is under a 'data' property:
    // return (body.data as RequestData) || null;
  } catch (error) {
    console.error(chalk.yellow("Could not parse request body as JSON."), error);
    return null;
  }
}

export function slugify(text: string): string {
  if (typeof text !== 'string') return '';
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
  userID?: string // userID is now optional
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
    console.error(chalk.red("CRITICAL: Failed to post to activity log channel!"), errorMessage);
  }
}


/**
 * Parses the string content of a Discord message to extract structured metadata.
 * Expects metadata to be in a JSON code block.
 * E.g., ```json
 * {
 *   "lastUpdate": "2023-10-27T10:00:00.000Z",
 *   "name": "my-data-file",
 *   "size": 1024,
 *   "userID": "user123"
 * }
 * ```
 * @param content The string content of the Discord message.
 * @returns The parsed metadata object, or null if parsing fails or no block is found.
 */
export function parseMessageContent(content: string | undefined | null): MessageMetadata | null {
  if (!content) {
    return null;
  }

  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/; // Regex to find JSON code blocks
  const match = content.match(jsonBlockRegex);

  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1].trim());
      return parsed as MessageMetadata;
    } catch (error) {
      console.warn(chalk.yellow("Failed to parse JSON from message content:"), match[1], error);
      return null;
    }
  }
  // Fallback for content that might be just the JSON string without backticks (less ideal)
  // try {
  //   const parsed = JSON.parse(content);
  //   // Basic check if it looks like our metadata
  //   if (parsed && (parsed.name || parsed.userID || parsed.lastUpdate)) {
  //       return parsed as MessageMetadata;
  //   }
  // } catch (e) {
  //   // Not a simple JSON string
  // }
  return null;
}
