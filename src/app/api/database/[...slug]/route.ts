// /api/database/[...slug]/route.ts
import { GUILD_ID, SUPPORTED_TYPES } from "@/lib/constants";
import {
  editMessage,
  fileAttachmentsBuilder,
  getMessagesFromChannel,
  sendMessage,
  discord,
  sanitizeMessage,
  getChannelsFromParentId,
  processMessage,
} from "@/lib/utils";
import type {
  RequestData,
  DiscordMessage,
  DiscordChannel,
  UserData,
  DiscordCategory,
  DiscordPartialMessageResponse,
} from "@/types";
import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server";
import {
  createApiResponse,
  handleDiscordApiCall,
  loadBodyRequest,
  slugify,
  updateActivityLog,
  CHANNEL_TYPE,
  updateUserData,
  getUsersData,
} from "../helpers";
import {
  ApiDbGetCategoryMessagesResponse,
  GetApiDatabaseCategoryMessagesResponse,
  GetApiDatabaseChannelMessagesResponse,
  GetApiDatabaseMessageResponse,
} from "@/types/api-db-response";

// --- Helper to get user info from headers ---
function getAuthInfo(req: NextRequest) {
  const userID = req.cookies.get("x-user-id")?.value;
  if (!userID) {
    console.error(
      chalk.red("Auth Error: User ID not found in request headers."),
    );
    throw new Error("Auth Error: User ID not found in request headers.");
  }
  return { userID };
}

// --- Main HTTP Handlers ---

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
): Promise<NextResponse> {
  try {
    const { userID } = getAuthInfo(req);
    const [categoryId, channelId, messageId] = (await params).slug;
    const users = await getUsersData();
    const user = users?.get(userID || "");
    const isAdmin = user?.is_admin ?? false;

    if (messageId && channelId) {
      const message = await discord.get<DiscordMessage>(
        `/channels/${channelId}/messages/${messageId}`,
      );
      const sanitized = sanitizeMessage(message);
      const processedMessages = processMessage(sanitized);

      if (!isAdmin && processedMessages.userID !== userID) {
        return createApiResponse(
          {
            message:
              "Forbidden: You do not own this message or are not an admin.",
          },
          403,
        );
      }

      const attachmentData = await loadAttachmentsData(sanitized.attachments);
      // const dataToReturn =
      //   attachmentData || (sanitized.content ? "" : sanitized.content);

      const responseData: GetApiDatabaseMessageResponse = {
        ...((typeof sanitized.content === "object" && sanitized.content) || {}),
        id: sanitized.id,
        timestamp: sanitized.timestamp,
        edited_timestamp: sanitized.edited_timestamp,
        ...(attachmentData !== null && { data: attachmentData }),
      };

      return createApiResponse<GetApiDatabaseMessageResponse>(
        responseData,
        200,
      );
    }

    if (channelId) {
      const messages = await getMessagesFromChannel(channelId);
      const filteredMessages = isAdmin
        ? messages
        : messages.filter((msg) => msg.userID === userID);

      return createApiResponse<GetApiDatabaseChannelMessagesResponse>(
        { data: filteredMessages },
        200,
      );
    }

    if (categoryId) {
      const data = await getMessagesFromCategory(categoryId, userID, isAdmin);

      return createApiResponse<GetApiDatabaseCategoryMessagesResponse>(
        data,
        200,
      );
    }

    return createApiResponse({ message: "Invalid request parameters" }, 400);
  } catch (error) {
    console.error(chalk.red("Error in GET handler:"), error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Internal Server Error or data not found";
    if (
      error instanceof Error &&
      (error.message.includes("404") || (error as any).status === 404)
    ) {
      return createApiResponse({ error: "Resource not found." }, 404);
    }
    if (error instanceof Error && error.message.includes("User ID not found")) {
      return createApiResponse({ error: "Authentication error." }, 401);
    }
    return createApiResponse({ error: errorMessage }, 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  try {
    const [categoryId, channelId, messageId] = (await params).slug;
    const data = await loadBodyRequest(req);
    const { userID } = getAuthInfo(req);
    const users = await getUsersData();

    if (!data)
      return createApiResponse({ message: "Invalid request body" }, 400);

    if (!userID) {
      return createApiResponse({ message: "User ID not found" }, 401);
    }

    if (!users) {
      return createApiResponse(
        { message: "Data not found or internal error" },
        500,
      );
    }

    const user = users.get(userID);
    if (!user) {
      return createApiResponse(
        { message: "Data not found or internal error" },
        500,
      );
    }

    if (categoryId && !channelId) {
      return handleCreateChannel(categoryId, data, user);
    }

    if (channelId && !messageId) {
      return handleSendMessage(categoryId, channelId, data, userID);
    }

    return createApiResponse(
      { message: "Invalid POST request or Message ID must not be provided" },
      400,
    );
  } catch (error) {
    console.error(chalk.red("Error in POST handler:"), error);
    return createApiResponse({ error: "Internal Server Error" }, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  try {
    const [categoryId, channelId, messageId] = (await params).slug;
    const data = await loadBodyRequest(req);

    if (!data || !data.name) {
      return createApiResponse(
        { message: "Invalid request body, name is required" },
        400,
      );
    }

    const slugifiedName = slugify(data.name);

    if (messageId && channelId) {
      return handleUpdateMessage(categoryId, channelId, messageId, data);
    }

    if (channelId) {
      if (data.content) {
        return createApiResponse(
          { message: "Cannot update content for a channel, only a message" },
          400,
        );
      }
      return handleDiscordApiCall<DiscordChannel>(
        () =>
          discord.patch<DiscordChannel>(
            `/channels/${channelId}`,
            { name: slugifiedName },
            true,
          ),
        "Channel updated successfully",
      );
    }

    if (categoryId) {
      return handleDiscordApiCall<DiscordCategory>(
        () =>
          discord.patch<DiscordCategory>(
            `/channels/${categoryId}`,
            { name: slugifiedName, type: CHANNEL_TYPE.GUILD_CATEGORY },
            true,
          ),
        "Category updated successfully",
      );
    }

    return createApiResponse({ message: "Invalid PATCH request" }, 400);
  } catch (error) {
    console.error(chalk.red("Error in PATCH handler:"), error);
    return createApiResponse({ error: "Internal Server Error" }, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  try {
    const [categoryId, channelId, messageId] = (await params).slug;
    const { userID } = getAuthInfo(req);
    const users = await getUsersData();

    if (!userID) {
      return createApiResponse({ message: "User ID not found" }, 401);
    }

    if (!users) {
      return createApiResponse(
        { message: "Data not found or internal error" },
        500,
      );
    }

    const user = users.get(userID);
    if (!user) {
      return createApiResponse(
        { message: "Data not found or internal error" },
        500,
      );
    }

    if (messageId && channelId) {
      return handleDiscordApiCall<DiscordMessage>(
        () =>
          discord.delete<DiscordMessage>(
            `/channels/${channelId}/messages/${messageId}`,
          ),
        "Message deleted successfully",
      );
    }

    if (channelId) {
      return handleDiscordApiCall<DiscordChannel>(async () => {
        const channel = await discord.delete<DiscordChannel>(
          `/channels/${channelId}`,
        );
        user.databases[categoryId] = user.databases[categoryId].filter(
          (channelID) => channelID !== channelId,
        );

        await updateUserData(userID, user, user.message_id);
        return channel;
      }, "Channel deleted successfully");
    }

    if (categoryId) {
      console.log(
        chalk.yellow(`Deleting category ${categoryId} and its children...`),
      );
      const channelsToDelete = await getChannelsFromParentId(categoryId);
      console.log(
        chalk.blue(`Found ${channelsToDelete.length} channels to delete.`),
      );

      const deletePromises = channelsToDelete.map((ch) =>
        discord.delete(`/channels/${ch.id}`),
      );
      deletePromises.push(discord.delete(`/channels/${categoryId}`));

      await Promise.all(deletePromises);
      delete user.databases[categoryId];
      await updateUserData(userID, user, user.message_id);

      return createApiResponse(
        { message: "Category and all its channels deleted successfully" },
        200,
      );
    }

    return createApiResponse({ message: "Invalid DELETE request" }, 400);
  } catch (error) {
    console.error(chalk.red("Error in DELETE handler:"), error);
    return createApiResponse(
      {
        message: "Failed to delete resources.",
        error: (error as Error).message,
      },
      500,
    );
  }
}

// --- Logic Handlers ---

async function handleCreateChannel(
  categoryId: string,
  data: RequestData,
  userData: UserData,
) {
  if (!data.name || typeof data.name !== "string" || data.name.length > 100) {
    return createApiResponse({ message: "Invalid channel name" }, 400);
  }

  return handleDiscordApiCall<DiscordChannel>(
    async () => {
      const channel = await discord.post<DiscordChannel>(
        `/guilds/${GUILD_ID}/channels`,
        {
          name: slugify(data.name),
          parent_id: categoryId,
          type: CHANNEL_TYPE.GUILD_TEXT,
        },
        true,
      );
      userData.databases[categoryId].push(channel.id);
      updateUserData(userData.userID, userData, userData.message_id);
      return channel;
    },
    "Channel created successfully",
    201,
  );
}

async function handleSendMessage(
  categoryId: string,
  channelId: string,
  data: RequestData,
  userID: string,
) {
  if (
    !data.content ||
    !data.name ||
    !SUPPORTED_TYPES.includes(typeof data.content)
  ) {
    return createApiResponse({ message: "Invalid request body" }, 400);
  }

  const { attachments, dataSize } = fileAttachmentsBuilder({
    fileName: data.name,
    data: data.content,
  }) || { attachments: [], dataSize: null };

  const collectionMetadata = {
    lastUpdate: new Date().toISOString(),
    name: data.name,
    size: dataSize,
    userID,
  };

  if (!attachments)
    return createApiResponse({ message: "Invalid attachments" }, 400);

  const messagePayload = {
    content: `\`\`\`json\n${JSON.stringify(collectionMetadata, null, 2)}\n\`\`\``,
    files: attachments,
  };

  const response = await handleDiscordApiCall<DiscordMessage>(
    async () => {
      const res = await sendMessage(channelId, messagePayload);
      if (!res) throw new Error("Failed to send message");
      return {
        id: res.id,
        content: res.content.replace(/`/g, "").trim(),
      } as DiscordMessage;
    },
    "Message sent successfully",
    201,
  );

  updateActivityLog(data.name, dataSize || 0, categoryId, channelId).catch(
    (err) => {
      console.error(chalk.yellow("Failed to update activity log:"), err);
    },
  );

  return response;
}

async function handleUpdateMessage(
  categoryId: string,
  channelId: string,
  messageId: string,
  data: RequestData,
) {
  if (
    typeof data.content !== "undefined" &&
    !SUPPORTED_TYPES.includes(typeof data.content)
  ) {
    return createApiResponse({ message: "Invalid content type" }, 400);
  }

  const { attachments, dataSize } = fileAttachmentsBuilder({
    fileName: data.name,
    data: data.content,
  }) || { attachments: [], dataSize: null };

  if (!attachments)
    return createApiResponse({ message: "Invalid attachments" }, 400);

  const dataExtension = data.name.match(/.*\.([^.]+)$/)?.[1];
  const dataName = dataExtension ? data.name : `${data.name}.json`;
  const options = {
    content: `\`\`\`json\n${JSON.stringify(
      {
        lastUpdate: new Date().toISOString(),
        name: dataName,
        size: dataSize,
      },
      null,
      2,
    )}\n\`\`\``,
    files: attachments,
  };

  const response = await handleDiscordApiCall<DiscordPartialMessageResponse>(
    async () => {
      const message = await editMessage(channelId, messageId, options);
      if (!message) throw new Error("Failed to update message");
      return message;
    },
    "Message updated successfully",
  );

  updateActivityLog(data.name, dataSize || 0, categoryId, channelId).catch(
    (err) => {
      console.error(chalk.yellow("Failed to update activity log:"), err);
    },
  );

  return response;
}

/**
 * Mendapatkan pesan-pesan dari semua channel di dalam kategori tertentu.
 * Jika bukan admin, filter pesan berdasarkan userID.
 * @param categoryId ID kategori yang ingin diambil pesannya.
 * @param userID ID user yang ingin diambil pesannya jika bukan admin.
 * @param isAdmin True jika pengguna yang mengakses adalah admin.
 * @returns Objek yang berisi pesan-pesan dari setiap channel di dalam kategori.
 *          Setiap key di dalam objek ini adalah ID channel, dan valuenya adalah
 *          array pesan yang difilter berdasarkan userID.
 */
async function getMessagesFromCategory(
  categoryId: string,
  userID: string | null,
  isAdmin: boolean,
): Promise<ApiDbGetCategoryMessagesResponse> {
  const channels = await getChannelsFromParentId(categoryId);

  const channelDataPromises = channels.map(async (channel) => {
    const messages = await getMessagesFromChannel(channel.id);

    // Kalau tidak ada pesan, langsung return null.
    // Ini membantu Promise.all nanti untuk filter.
    if (!messages) {
      return null;
    }

    // Filter pesan berdasarkan userID jika bukan admin
    const filteredMessages = isAdmin
      ? messages // Kalau admin, semua pesan diambil
      : messages.filter((msg) => msg.userID === userID); // Kalau bukan admin, filter berdasarkan userID

    // Jika ada pesan setelah difilter, kembalikan [channelId, pesan].
    // Kalau tidak ada, kembalikan null untuk channel ini.
    return filteredMessages.length > 0 ? [channel.id, filteredMessages] : null;
  });

  // Tunggu semua Promise selesai dan saring hasil yang null
  const validChannelData = (await Promise.all(channelDataPromises)).filter(
    (item): item is [string, any] => item !== null, // Type guard biar TypeScript pinter
  );

  // Ubah array hasil ke dalam Map untuk kemudahan akses
  const resultMessagesMap = new Map(validChannelData);

  // Kembalikan sebagai objek biasa
  const data = Object.fromEntries(resultMessagesMap);
  return { data };
}

async function loadAttachmentsData(
  attachments:
    | {
        url: string;
        filename: string;
        size: number;
      }[]
    | undefined,
) {
  if (!attachments || attachments.length === 0) return null;

  const fetchPromises = attachments.map((att) =>
    fetch(att.url).then((res) => {
      if (!res.ok)
        throw new Error(`Failed to fetch attachment: ${res.statusText}`);
      return res.text();
    }),
  );

  const contents = await Promise.all(fetchPromises);
  const combinedContent = contents.join("");

  try {
    return JSON.parse(combinedContent);
  } catch {
    console.warn(
      chalk.yellow(
        "Warning: Attachment data is not valid JSON, returning as raw string.",
      ),
    );
    return combinedContent;
  }
}
