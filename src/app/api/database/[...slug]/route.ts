// /api/database/route.ts
import { getChannels, getMessagesFromChannel } from "@/lib/utils";
import { discord } from "@/lib/discord-api-handler";
import {
  DiscordCategory,
  DiscordPartialChannelResponse,
  RequestData,
  UserData,
} from "@/types";
import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server";
import {
  createApiResponse,
  handleDiscordApiCall,
  slugify,
  CHANNEL_TYPE,
  updateUserData,
  getUsersData,
} from "../helpers";
import { GUILD_ID } from "@/lib/constants";
import {
  ApiDbCategory,
  ApiDbCategoryChannel,
  ApiDbCreateCategoryResponse,
  GetApiDatabaseResponse,
} from "@/types/api-db-response";
import { validateAndGetUser } from "@/lib/authService";
// --- Main HTTP Handlers ---

export async function GET(req: NextRequest) {
  try {
    const userData = await validateAndGetUser(req);
    return await handleGetAllStructuredData(userData);
  } catch (error) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return createApiResponse({ message: "Unauthorized" }, 401);
    }
    console.error("GET /api/database error:", err);
    return createApiResponse({ error: "Internal Server Error" }, 500);
  }
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiDbCreateCategoryResponse>> {
  try {
    const userData = await validateAndGetUser(req);
    const data = (await req.json())?.data;

    return await handleCreateCategory(data, userData);
  } catch (error) {
    console.error(chalk.red("Error in POST handler:"), error);
    return createApiResponse<ApiDbCreateCategoryResponse>(
      { error: "Internal Server Error" },
      500,
    );
  }
}

// --- Logic Handlers ---

async function handleGetAllStructuredData(userData: UserData) {
  const { databases } = userData;
  console.log(chalk.green("Fetching all structured data..."));
  const allChannels = await getChannels();
  const userCategories = Object.keys(databases);
  const categories = new Map<string, ApiDbCategory>();
  const textChannels: DiscordPartialChannelResponse[] = [];

  for (const channel of allChannels) {
    if (
      channel.isCategory &&
      (userCategories.includes(channel.id) || userData.is_admin)
    ) {
      categories.set(channel.id, {
        ...channel,
        boxes: [] as unknown as ApiDbCategoryChannel[],
      });
    } else if (channel.categoryId) {
      textChannels.push(channel);
    }
  }

  const messagePromises = textChannels.map((ch) =>
    getMessagesFromChannel(ch.id),
  );
  const allMessages = await Promise.all(messagePromises);

  textChannels.forEach((channel, index) => {
    const parentCategory = categories.get(channel.categoryId!);
    if (parentCategory) {
      parentCategory.boxes.push({
        ...channel,
        collections: allMessages[index] || [],
      });
    }
  });

  const data = Object.fromEntries(categories);
  return createApiResponse<GetApiDatabaseResponse>({ data }, 200);
}

async function handleCreateCategory(data: RequestData, userData: UserData) {
  if (!data.name || typeof data.name !== "string" || data.name.length > 100) {
    return createApiResponse<ApiDbCreateCategoryResponse>(
      { message: "Invalid category name" },
      400,
    );
  }

  return handleDiscordApiCall<DiscordCategory>(
    async () => {
      const category = await discord.post<DiscordCategory>(
        `/guilds/${GUILD_ID}/channels`,
        {
          name: slugify(data.name),
          type: CHANNEL_TYPE.GUILD_CATEGORY,
        },
      );
      if (!category) throw new Error("Failed to create category.");
      const users = await getUsersData();
      if (!users) return category;
      const user = users.get(userData.userID) || users.get(userData.username);
      if (!user) return category;
      user.databases[category.id] = [];
      updateUserData(userData.userID, user, userData.message_id);
      return category;
    },
    "Category created successfully",
    201,
  );
}
