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
  DiscordMessage, // Added for better type safety
} from "@/lib/utils";
import { DiscordPartialMessageResponse, RequestData } from "@/types"; // DiscordPartialMessageResponse might be less needed now
import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server";
import {
  createApiResponse,
  handleDiscordApiCall,
  loadBodyRequest,
  slugify,
  updateActivityLog,
  CHANNEL_TYPE,
  parseMessageContent, // Import this helper
} from "../helpers";

// --- Helper to get user info from headers ---
function getAuthInfo(req: NextRequest) {
  const userID = req.headers.get("x-user-id");
  const isAdmin = req.headers.get("x-user-is-admin") === "true";
  // Middleware should ensure userID is present, but good to have a fallback check or rely on middleware's strictness
  if (!userID) {
    console.error(chalk.red("Auth Error: User ID not found in request headers."));
    // This indicates a potential issue with middleware setup or request flow if reached.
    // Depending on strictness, could throw error or return a specific response.
    // For now, let API handlers proceed, they might have public access paths or specific error handling.
  }
  return { userID, isAdmin };
}


// --- Main HTTP Handlers ---

export async function GET(
  req: NextRequest, // Changed _req to req to access headers
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse> {
  try {
    const { userID, isAdmin } = getAuthInfo(req); // Get user info, userID might be null if public access is allowed by middleware for GET
    const slugParts = (await params).slug;
    const categoryId = slugParts[0];
    const channelId = slugParts[1];
    const messageId = slugParts[2];

    if (messageId && channelId) {
      const message = await discord.get<DiscordMessage>( // Use DiscordMessage for full structure
        `/channels/${channelId}/messages/${messageId}`
      );
      const sanitized = sanitizeMessage(message); // sanitizeMessage should be checked if it handles full DiscordMessage appropriately
      const messageMetadata = parseMessageContent(sanitized.content);

      // Authorization: Check if the user owns the message or is an admin
      if (!isAdmin && messageMetadata?.userID !== userID) {
        return createApiResponse({ message: "Forbidden: You do not own this message or are not an admin." }, 403);
      }

      const attachmentData = (await loadAttachmentsData(sanitized.attachments)); // Pass sanitized.attachments
      const dataToReturn = attachmentData || (messageMetadata ? "" : sanitized.content); // If no attachment, and no metadata, return raw content
                                                                                       // if metadata exists, usually data is in attachment.

      // Construct response, prioritize metadata
      const responseData = {
        ...(messageMetadata || {}), // Spread metadata like name, size, userID, lastUpdate
        id: sanitized.id,
        channel_id: sanitized.channel_id,
        timestamp: sanitized.timestamp,
        edited_timestamp: sanitized.edited_timestamp,
        // Only include 'data' if there's attachment data or if metadata implies content is elsewhere
        ...(attachmentData !== null && { data: attachmentData }),
      };

      return createApiResponse(responseData, 200);
    }

    if (channelId) { // Get all messages from a channel
      let messages = await getMessagesFromChannel(channelId); // This likely returns an array of DiscordMessage
      let processedMessages = messages.map(msg => {
        const meta = parseMessageContent(msg.content);
        return {
            id: msg.id,
            channel_id: msg.channel_id,
            timestamp: msg.timestamp,
            edited_timestamp: msg.edited_timestamp,
            name: meta?.name || msg.attachments?.[0]?.filename.replace(/\.json$/, '').replace(/^(chunk_\d+_)/, '') || "untitled",
            size: meta?.size,
            userID: meta?.userID,
            // attachments: msg.attachments // Decide if you want to return full attachment info
        };
      });

      if (!isAdmin) {
        processedMessages = processedMessages.filter(msg => msg.userID === userID);
      }
      return createApiResponse({ data: processedMessages }, 200);
    }

    if (categoryId) { // Get all messages from all channels in a category
      const data = await getMessagesFromCategory(categoryId, userID, isAdmin); // Pass userID and isAdmin
      return createApiResponse({ data }, 200);
    }

    return createApiResponse({ message: "Invalid request parameters" }, 400);
  } catch (error) {
    console.error(chalk.red("Error in GET handler:"), error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error or data not found";
    // Check if error is due to Discord API 404 or auth issue
    if (error instanceof Error && (error.message.includes("404") || (error as any).status === 404)) {
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
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const [categoryId, channelId, messageId] = (await params).slug;
    const data = await loadBodyRequest(req);

    if (!data)
      return createApiResponse({ message: "Invalid request body" }, 400);

    if (categoryId && !channelId) {
      return handleCreateChannel(categoryId, data);
    }

    if (channelId && !messageId) {
      return handleSendMessage(categoryId, channelId, data);
    }

    return createApiResponse(
      { message: "Invalid POST request or Message ID must not be provided" },
      400
    );
  } catch (error) {
    console.error(chalk.red("Error in POST handler:"), error);
    return createApiResponse({ error: "Internal Server Error" }, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const [categoryId, channelId, messageId] = (await params).slug;
    const data = await loadBodyRequest(req);

    if (!data || !data.name) {
      return createApiResponse(
        { message: "Invalid request body, name is required" },
        400
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
          400
        );
      }
      return handleDiscordApiCall(
        () =>
          discord.patch(
            `/channels/${channelId}`,
            { name: slugifiedName },
            true
          ),
        "Channel updated successfully"
      );
    }

    if (categoryId) {
      return handleDiscordApiCall(
        () =>
          discord.patch(
            `/channels/${categoryId}`,
            { name: slugifiedName, type: CHANNEL_TYPE.GUILD_CATEGORY },
            true
          ),
        "Category updated successfully"
      );
    }

    return createApiResponse({ message: "Invalid PATCH request" }, 400);
  } catch (error) {
    console.error(chalk.red("Error in PATCH handler:"), error);
    return createApiResponse({ error: "Internal Server Error" }, 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const [categoryId, channelId, messageId] = (await params).slug;

    if (messageId && channelId) {
      return handleDiscordApiCall(
        () => discord.delete(`/channels/${channelId}/messages/${messageId}`),
        "Message deleted successfully"
      );
    }

    if (channelId) {
      return handleDiscordApiCall(
        () => discord.delete(`/channels/${channelId}`),
        "Channel deleted successfully"
      );
    }

    if (categoryId) {
      console.log(
        chalk.yellow(`Deleting category ${categoryId} and its children...`)
      );
      const channelsToDelete = await getChannelsFromParentId(categoryId);
      console.log(
        chalk.blue(`Found ${channelsToDelete.length} channels to delete.`)
      );

      const deletePromises = channelsToDelete.map((ch) =>
        discord.delete(`/channels/${ch.id}`)
      );
      deletePromises.push(discord.delete(`/channels/${categoryId}`));

      await Promise.all(deletePromises);
      return createApiResponse(
        { message: "Category and all its channels deleted successfully" },
        200
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
      500
    );
  }
}

// --- Logic Handlers ---

async function handleCreateChannel(categoryId: string, data: RequestData) {
  if (!data.name || typeof data.name !== "string" || data.name.length > 100) {
    return createApiResponse({ message: "Invalid channel name" }, 400);
  }

  return handleDiscordApiCall(
    () =>
      discord.post(
        `/guilds/${GUILD_ID}/channels`,
        {
          name: slugify(data.name),
          parent_id: categoryId,
          type: CHANNEL_TYPE.GUILD_TEXT,
        },
        true
      ),
    "Channel created successfully",
    201
  );
}

async function handleSendMessage(
  categoryId: string,
  channelId: string,
  data: RequestData
) {
  if (
    !data.content ||
    !data.name ||
    !SUPPORTED_TYPES.includes(typeof data.content)
  ) {
    return createApiResponse({ message: "Invalid request body" }, 400);
  }

  const contentSize =
    data.size ??
    (typeof data.content === "string"
      ? data.content.length
      : JSON.stringify(data.content).length);
  const key = {
    lastUpdate: new Date().toISOString(),
    name: data.name,
    size: contentSize,
  };

  const messagePayload = {
    content: `\`\`\`\n${JSON.stringify(key, null, 2)}\n\`\`\``,
    files: fileAttachmentsBuilder({
      fileName: data.name,
      data: data.content,
      size: contentSize,
    }),
  };

  const response = await handleDiscordApiCall(
    async () => {
      const res = await sendMessage(channelId, messagePayload);
      if (!res) throw new Error("Failed to send message");
      return { id: res.id, content: res.content.replace(/`/g, "").trim() };
    },
    "Message sent successfully",
    201
  );

  updateActivityLog(data.name, contentSize, categoryId, channelId).catch(
    (err) => {
      console.error(chalk.yellow("Failed to update activity log:"), err);
    }
  );

  return response;
}

async function handleUpdateMessage(
  categoryId: string,
  channelId: string,
  messageId: string,
  data: RequestData
) {
  if (!SUPPORTED_TYPES.includes(typeof data.content)) {
    return createApiResponse({ message: "Invalid content type" }, 400);
  }

  const contentSize =
    data.size ??
    (typeof data.content === "string"
      ? data.content.length
      : JSON.stringify(data.content).length);
  const files = fileAttachmentsBuilder({
    fileName: data.name,
    data: data.content,
    size: contentSize,
  });

  const response = await handleDiscordApiCall(
    () => editMessage(channelId, messageId, { files }),
    "Message updated successfully"
  );

  updateActivityLog(data.name, contentSize, categoryId, channelId).catch(
    (err) => {
      console.error(chalk.yellow("Failed to update activity log:"), err);
    }
  );

  return response;
}

async function getMessagesFromCategory(categoryId: string) {
  const channels = await getChannelsFromParentId(categoryId);
  const channelPromises = channels.map(async (channel) => {
    const messages = await getMessagesFromChannel(channel.id);
    return messages ? [channel.id, messages] : null;
  });

  const settledChannels = await Promise.all(channelPromises);
  const filteredChannels = new Map(
    settledChannels.filter(Boolean) as [string, any][]
  );
  return Object.fromEntries(filteredChannels);
}

async function loadAttachmentsData(attachments: { url: string }[]) {
  const fetchPromises = attachments.map((att) =>
    fetch(att.url).then((res) => res.text())
  );
  const contents = await Promise.all(fetchPromises);
  const combinedContent = contents.join("");

  try {
    return JSON.parse(combinedContent);
  } catch {
    console.warn(
      chalk.yellow(
        "Warning: Attachment data is not valid JSON, returning as raw string."
      )
    );
    return combinedContent;
  }
}
