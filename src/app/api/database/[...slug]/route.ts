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
} from "@/lib/utils";
import { DiscordPartialMessageResponse, RequestData } from "@/types";
import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server";
import {
  createApiResponse,
  handleDiscordApiCall,
  loadBodyRequest,
  slugify,
  updateActivityLog,
  CHANNEL_TYPE,
} from "../helpers";

// --- Main HTTP Handlers ---

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse> {
  try {
    const [categoryId, channelId, messageId] = (await params).slug;

    if (messageId && channelId) {
      const message = await discord.get<DiscordPartialMessageResponse>(
        `/channels/${channelId}/messages/${messageId}`
      );
      const sanitized = sanitizeMessage(message);
      const data =
        (await loadAttachmentsData(sanitized.attachments)) || sanitized.content;
      const parsedContent =
        typeof sanitized.content === "object"
          ? sanitized.content
          : {
              lastUpdate: sanitized.edited_timestamp,
              name:
                sanitized.attachments[0]?.filename.match(
                  /^(chunk_\d+_)([a-zA-Z0-9_-]+)(?:\.json|\.)?$/
                )?.[2] || "untitled",
              size: JSON.stringify(data).length,
            };

      return createApiResponse({ ...parsedContent, data }, 200);
    }

    if (channelId) {
      const data = await getMessagesFromChannel(channelId);
      return createApiResponse({ data }, 200);
    }

    if (categoryId) {
      const data = await getMessagesFromCategory(categoryId);
      return createApiResponse({ data }, 200);
    }

    return createApiResponse({ message: "Invalid request" }, 400);
  } catch (error) {
    console.error(chalk.red("Error in GET handler:"), error);
    return createApiResponse(
      { message: "Data not found or internal error" },
      404
    );
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
