// /api/database/route.ts
import { discord, getChannels, getMessagesFromChannel } from "@/lib/utils";
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
  loadBodyRequest,
  slugify,
  CHANNEL_TYPE,
  updateUserData,
  getUsersData,
} from "./helpers";
import { GUILD_ID } from "@/lib/constants";
import {
  ApiDbCategory,
  ApiDbCategoryChannel,
  ApiDbCreateCategoryResponse,
  ApiDbErrorResponse,
  GetApiDatabaseResponse,
} from "@/types/api-db-response";
import { verifyAuth } from "@/lib/authUtils";

// --- Main HTTP Handlers ---

export async function GET(
  req: NextRequest,
): Promise<NextResponse<GetApiDatabaseResponse>> {
  try {
    const userData = verifyAuth(req);
    if (!userData) {
      return createApiResponse<ApiDbErrorResponse>(
        { message: "Unauthorized: Invalid or missing token." },
        401,
      );
    }
    const users = await getUsersData();
    if (!users)
      return createApiResponse<ApiDbErrorResponse>(
        {
          message: "Data not found or internal error",
        },
        500,
      );

    const user = users.get(userData.userID) || users.get(userData.username);
    if (!user)
      return createApiResponse<ApiDbErrorResponse>(
        {
          message: "Data not found or internal error",
        },
        500,
      );

    // return await handleGetAllStructuredData();
    const data = await handleGetAllStructuredData(user);
    return data;
  } catch (error) {
    console.error(chalk.red("Error in GET handler:"), error);
    return createApiResponse<ApiDbErrorResponse>(
      {
        message: "Data not found or internal error",
        error: (error as Error).message,
      },
      500,
    );
  }
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiDbCreateCategoryResponse>> {
  try {
    const userData = verifyAuth(req);
    if (!userData) {
      return createApiResponse<ApiDbCreateCategoryResponse>(
        {
          message: "Unauthorized: Invalid or missing token.",
        },
        401,
      );
    }
    const users = await getUsersData();
    if (!users)
      return createApiResponse<ApiDbCreateCategoryResponse>(
        {
          message: "Data not found or internal error",
        },
        500,
      );

    const user = users.get(userData.userID) || users.get(userData.username);
    if (!user)
      return createApiResponse<ApiDbCreateCategoryResponse>(
        {
          message: "Data not found or internal error",
        },
        500,
      );

    const data = await loadBodyRequest(req);
    if (!data)
      return createApiResponse<ApiDbCreateCategoryResponse>(
        { message: "Invalid request body" },
        400,
      );
    return await handleCreateCategory(data, user);
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
  // console.log(userData, databases);
  // databases: {
  //   "categoryId": ["channelId1", "channelId2", ...],
  //   "categoryId": ["channelId1", "channelId2", ...],
  //   "categoryId": ["channelId1", "channelId2", ...],
  // }
  console.log(chalk.green(" Fetching all structured data..."));
  const allChannels = await getChannels();
  const userCategories = Object.keys(databases);
  const categories = new Map<string, ApiDbCategory>();
  const textChannels: DiscordPartialChannelResponse[] = [];
  // console.log(userCategories);

  for (const channel of allChannels) {
    if (
      channel.isCategory &&
      (userCategories.includes(channel.id) || userData.is_admin)
    ) {
      categories.set(channel.id, {
        ...channel,
        channels: [] as unknown as ApiDbCategoryChannel[],
      });
    } else if (channel.categoryId) {
      console.log(
        userData.databases[channel.categoryId],
        channel.id,
        channel.categoryId,
      );
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
      parentCategory.channels.push({
        ...channel,
        messages: allMessages[index] || [],
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
