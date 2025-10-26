// /api/database/route.ts
import { getChannels, getMessagesFromChannel } from "@/lib/utils";
import { DiscordPartialChannelResponse, UserData } from "@/types";
import chalk from "chalk";
import { NextRequest } from "next/server";
import { createApiResponse } from "./helpers";
import {
  ApiDbCategory,
  ApiDbCategoryChannel,
  GetApiDatabaseResponse,
} from "@/types/api-db-response";
import { publishToQueue } from "@/lib/queue"; // <-- Import baru
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

export async function POST(req: NextRequest) {
  try {
    const userData = await validateAndGetUser(req);
    const { data } = await req.json();

    if (
      !data?.name ||
      typeof data.name !== "string" ||
      data.name.length > 100
    ) {
      return createApiResponse({ message: "Invalid category name" }, 400);
    }

    // Mengirim job ke antrean
    await publishToQueue({
      operation: "CREATE_CATEGORY",
      payload: {
        data: { name: data.name },
        userId: userData.userID,
      },
    });

    // Langsung kembalikan 202 Accepted
    return createApiResponse(
      { message: "Category creation has been queued." },
      202,
    );
  } catch (error) {
    console.error(chalk.red("Error in POST /api/database:"), error);
    const errMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return createApiResponse({ error: errMessage }, 500);
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
