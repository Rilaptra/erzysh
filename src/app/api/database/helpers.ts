// /api/database/helpers.ts
import { editMessage } from "@/lib/utils";
import { RequestData } from "@/types";
import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server";

// --- Shared Constants ---
export const ACTIVITY_LOG_CHANNEL_ID = "1391571208973189181";
export const ACTIVITY_LOG_MESSAGE_ID = "1391581829361827961";

export enum CHANNEL_TYPE {
  GUILD_TEXT = 0,
  GUILD_CATEGORY = 4,
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
    const data = await apiCall();
    return createApiResponse(
      { message: successMessage, data: { id: data?.id } },
      successStatus
    );
  } catch (error: any) {
    console.error(
      chalk.red(`Discord API Error:`),
      error.response?.data || error.message
    );
    const message = error.message || "An internal server error occurred.";
    const status = error.response?.status || 500;
    return createApiResponse({ message }, status);
  }
}

export async function loadBodyRequest(
  req: NextRequest
): Promise<RequestData | null> {
  try {
    const body = await req.json();
    return (body.data as RequestData) || null;
  } catch (error) {
    console.error(chalk.yellow("Could not parse request body as JSON."), error);
    return null;
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

function createActivityLogPayload(
  fileName: string,
  size: number,
  categoryId: string,
  channelId: string
) {
  return JSON.stringify(
    {
      lastUpdate: new Date().toISOString(),
      recent: {
        fileName,
        size,
        timestamp: Date.now(),
        location: {
          category: { id: categoryId },
          channel: { id: channelId },
        },
      },
    },
    null,
    2
  );
}

export async function updateActivityLog(
  fileName: string,
  size: number,
  categoryId: string,
  channelId: string
) {
  console.log(chalk.green(" Updating activity log..."));
  const layout = createActivityLogPayload(
    fileName,
    size,
    categoryId,
    channelId
  );
  try {
    await editMessage(ACTIVITY_LOG_CHANNEL_ID, ACTIVITY_LOG_MESSAGE_ID, {
      content: `\`\`\`json\n${layout}\n\`\`\``,
    });
    console.log(chalk.green(" Activity log updated successfully."));
  } catch (error) {
    console.error(
      chalk.red("CRITICAL: Failed to update activity log message!"),
      error
    );
  }
}
