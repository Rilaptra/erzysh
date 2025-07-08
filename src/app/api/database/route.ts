// /api/database/route.ts
import { discord, getChannels, getMessagesFromChannel } from "@/lib/utils";
import { RequestData } from "@/types";
import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server";
import {
  createApiResponse,
  handleDiscordApiCall,
  loadBodyRequest,
  slugify,
  CHANNEL_TYPE,
} from "./helpers";
import { GUILD_ID } from "@/lib/constants";

// --- Main HTTP Handlers ---

export async function GET(): Promise<NextResponse> {
  try {
    return await handleGetAllStructuredData();
  } catch (error) {
    console.error(chalk.red("Error in GET handler:"), error);
    return createApiResponse(
      { message: "Data not found or internal error" },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await loadBodyRequest(req);
    if (!data)
      return createApiResponse({ message: "Invalid request body" }, 400);
    return await handleCreateCategory(data);
  } catch (error) {
    console.error(chalk.red("Error in POST handler:"), error);
    return createApiResponse({ error: "Internal Server Error" }, 500);
  }
}

// --- Logic Handlers ---

async function handleGetAllStructuredData() {
  console.log(chalk.green("Fetching all structured data..."));
  const allChannels = await getChannels();

  const categories = new Map<string, any>();
  const textChannels = [];

  for (const channel of allChannels) {
    if (channel.isCategory) {
      categories.set(channel.id, { ...channel, channels: [] });
    } else if (channel.categoryId) {
      textChannels.push(channel);
    }
  }

  const messagePromises = textChannels.map((ch) =>
    getMessagesFromChannel(ch.id)
  );
  const allMessages = await Promise.all(messagePromises);

  textChannels.forEach((channel, index) => {
    const parentCategory = categories.get(channel.categoryId!);
    if (parentCategory) {
      parentCategory.channels.push({
        ...channel,
        messages: allMessages[index] || [],
      });
    }
  });

  const data = Object.fromEntries(categories);
  return createApiResponse({ data }, 200);
}

async function handleCreateCategory(data: RequestData) {
  if (!data.name || typeof data.name !== "string" || data.name.length > 100) {
    return createApiResponse({ message: "Invalid category name" }, 400);
  }

  return handleDiscordApiCall(
    () =>
      discord.post(
        `/guilds/${GUILD_ID}/channels`,
        {
          name: slugify(data.name),
          type: CHANNEL_TYPE.GUILD_CATEGORY,
        },
        true
      ),
    "Category created successfully",
    201
  );
}
