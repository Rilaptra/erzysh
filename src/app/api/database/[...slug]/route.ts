// /api/database/[...slug]/route.ts
import { GUILD_ID, SUPPORTED_TYPES } from "@/lib/constants";
import {
  editMessage,
  fileAttachmentsBuilder,
  getMessagesFromChannel,
  sendMessage,
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
  getMimeType,
  MessageMetadata,
} from "../helpers";
import {
  ApiDbGetCategoryMessagesResponse,
  GetApiDatabaseCategoryMessagesResponse,
  GetApiDatabaseChannelMessagesResponse,
  GetApiDatabaseMessageResponse,
} from "@/types/api-db-response";
import { verifyAuth } from "@/lib/authUtils";
import { discord } from "@/lib/discord-api-handler";
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
// --- Helper Baru: Cek apakah request datang dengan token valid ---
function isAuthenticated(req: NextRequest): boolean {
  return !!verifyAuth(req);
}

// --- Main HTTP Handlers ---

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
): Promise<NextResponse> {
  try {
    const [categoryId, channelId, messageId] = (await params).slug;
    const isRawRequest = req.nextUrl.searchParams.get("raw") === "true";
    const isFullRequest = req.nextUrl.searchParams.get("full") === "true";

    const isAuth = isAuthenticated(req);

    if (!isAuth && isRawRequest) {
      if (!messageId) {
        return createApiResponse(
          {
            error: "Data not found or access denied.",
          },
          400,
        );
      }

      const requestUserID = req.nextUrl.searchParams.get("userID");
      if (!requestUserID) {
        return createApiResponse(
          { error: "'userID' query parameter is required for public access." },
          400,
        );
      }

      try {
        const message = await discord.get<DiscordMessage>(
          `/channels/${channelId}/messages/${messageId}`,
        );
        if (!message) {
          return createApiResponse(
            { error: "Resource not found or access denied." },
            404,
          );
        }
        const sanitized = sanitizeMessage(message);
        const metadata = sanitized.content as MessageMetadata;

        if (!metadata.isPublic || metadata.userID !== requestUserID) {
          return createApiResponse(
            { error: "Resource not found or access denied." },
            404,
          );
        }

        const attachmentData = await loadAttachmentsData(sanitized.attachments);
        if (!attachmentData) {
          return createApiResponse(
            { error: "Attachment data not found." },
            404,
          );
        }

        const fileName = sanitized.attachments?.[0]?.filename || "file";
        const mimeType = getMimeType(fileName);
        const headers = new Headers();
        headers.set("Content-Type", mimeType);
        headers.set("Content-Disposition", `inline; filename="${fileName}"`);
        headers.set(
          "Cache-Control",
          "public, s-maxage=86400, stale-while-revalidate=59",
        );

        return new NextResponse(attachmentData, { status: 200, headers });
      } catch (error) {
        console.error(
          chalk.yellow("Public access error:"),
          (error as Error).message,
        );
        return createApiResponse({ error: "Resource not found." }, 404);
      }
    }

    // Auth required for all non-raw requests from here
    if (!isAuth) {
      return createApiResponse({ error: "Unauthorized" }, 401);
    }

    const { userID } = getAuthInfo(req);
    const users = await getUsersData();
    const user = users?.get(userID || "");
    const isAdmin = user?.is_admin ?? false;

    if (messageId && channelId) {
      const message = await discord.get<DiscordMessage>(
        `/channels/${channelId}/messages/${messageId}`,
      );
      if (!message) {
        return createApiResponse(
          { error: "Resource not found or access denied." },
          404,
        );
      }
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

      if (isRawRequest) {
        if (!attachmentData) {
          return createApiResponse(
            { error: "No attachment data found for this message." },
            404,
          );
        }

        const fileName = sanitized.attachments?.[0]?.filename || "file";
        const mimeType = getMimeType(fileName);

        const headers = new Headers();
        headers.set("Content-Type", mimeType);
        headers.set("Content-Disposition", `inline; filename="${fileName}"`);
        headers.set("Cache-Control", "private, max-age=3600");
        return new NextResponse(attachmentData, { status: 200, headers });
      }

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
      // --- PERBAIKAN UTAMA DI SINI ---
      if (isFullRequest) {
        // 1. Ambil daftar semua pesan dalam satu panggilan API.
        const messages = await discord.get<DiscordMessage[]>(
          `/channels/${channelId}/messages`,
        );
        if (!messages) {
          return createApiResponse(
            { error: "Resource not found or access denied." },
            404,
          );
        }

        // 2. Buat array promise untuk mengambil konten setiap attachment secara paralel.
        const attachmentPromises = messages.map(async (msg) => {
          const sanitized = sanitizeMessage(msg);
          if (!sanitized.attachments || sanitized.attachments.length === 0) {
            return null; // Lewati jika tidak ada attachment.
          }

          try {
            // Ambil konten dari URL CDN, bukan API Discord.
            const attachmentData = await loadAttachmentsData(
              sanitized.attachments,
            );
            if (typeof attachmentData !== "string") return null;

            const parsedData = JSON.parse(attachmentData);
            return { id: sanitized.id, ...parsedData };
          } catch (e) {
            console.warn(
              `Gagal memproses attachment untuk pesan ${msg.id}:`,
              (e as Error).message,
            );
            return null;
          }
        });

        // 3. Tunggu semua proses fetch paralel selesai.
        const fullData = (await Promise.all(attachmentPromises)).filter(
          Boolean,
        );

        return createApiResponse({ data: fullData }, 200);
      } else {
        // Logika lama (tanpa ?full=true) tetap sama.
        const messages = await getMessagesFromChannel(channelId);
        const filteredMessages = isAdmin
          ? messages
          : messages.filter((msg) => msg.userID === userID);

        return createApiResponse<GetApiDatabaseChannelMessagesResponse>(
          { data: filteredMessages },
          200,
        );
      }
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
    const { userID } = getAuthInfo(req); // PATCH harus selalu terautentikasi
    const isAdmin = (await getUsersData()).get(userID || "")?.is_admin;

    if (
      (!data || !data.name) &&
      (data?.isPublic === undefined || data?.isPublic === null)
    ) {
      return createApiResponse(
        { message: "Invalid request body, name is required" },
        400,
      );
    }

    const slugifiedName = slugify(data.name);

    if (messageId && channelId) {
      // --- BARU: Logika untuk toggle isPublic ---
      // Jika request hanya berisi 'isPublic', ini adalah operasi ringan.
      if (
        typeof data.isPublic === "boolean" &&
        Object.keys(data).length === 1
      ) {
        return handleTogglePublic(
          channelId,
          messageId,
          data.isPublic,
          userID,
          isAdmin,
        );
      }
      // Jika tidak, ini adalah update konten penuh (logika lama)
      return handleUpdateMessage(
        categoryId,
        channelId,
        messageId,
        data,
        userID,
      );
    }

    if (channelId) {
      if (data.content) {
        return createApiResponse(
          { message: "Cannot update content for a channel, only a message" },
          400,
        );
      }
      return handleDiscordApiCall<DiscordChannel>(async () => {
        const data = await discord.patch<DiscordChannel>(
          `/channels/${channelId}`,
          { name: slugifiedName },
          true,
        );
        if (!data) throw new Error("Failed to update channel");
        return data;
      }, "Channel updated successfully");
    }

    if (categoryId) {
      return handleDiscordApiCall<DiscordCategory>(async () => {
        const data = await discord.patch<DiscordCategory>(
          `/channels/${categoryId}`,
          { name: slugifiedName, type: CHANNEL_TYPE.GUILD_CATEGORY },
          true,
        );
        if (!data) throw new Error("Failed to update category");
        return data;
      }, "Category updated successfully");
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
        // () =>
        //   discord.delete<DiscordMessage>(
        //     `/channels/${channelId}/messages/${messageId}`,
        //   ),
        // "Message deleted successfully",
        async () => {
          const data = await discord.delete<DiscordMessage>(
            `/channels/${channelId}/messages/${messageId}`,
          );
          if (!data) throw new Error("Failed to delete message");
          return data;
        },
        "Message deleted successfully",
      );
    }

    if (channelId) {
      return handleDiscordApiCall<DiscordChannel>(async () => {
        const channel = await discord.delete<DiscordChannel>(
          `/channels/${channelId}`,
        );
        if (!channel) throw new Error("Failed to delete channel");
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
      if (!channel) throw new Error("Failed to create channel.");
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
    isPublic: data.isPublic || false, // Set default ke false
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
  userID: string,
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
        userID,
        isPublic: data.isPublic || false, // Set default ke false
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

// --- Helper Baru untuk PATCH (tambahkan di dalam file yang sama) ---
async function handleTogglePublic(
  channelId: string,
  messageId: string,
  isPublic: boolean,
  userID: string,
  isAdmin?: boolean,
) {
  const originalMessage = await discord.get<DiscordMessage>(
    `/channels/${channelId}/messages/${messageId}`,
  );
  if (!originalMessage) {
    return createApiResponse({ error: "Data not found." }, 404);
  }
  const sanitized = sanitizeMessage(originalMessage);
  const metadata = sanitized.content as MessageMetadata;

  // Pastikan hanya pemilik yang bisa mengubah status publik
  if (metadata.userID !== userID && !isAdmin) {
    return createApiResponse(
      { error: "Forbidden: You do not own this resource." },
      403,
    );
  }

  // Update metadata
  const updatedMetadata: MessageMetadata = { ...metadata, isPublic };

  const options = {
    content: `\`\`\`json\n${JSON.stringify(updatedMetadata, null, 2)}\n\`\`\``,
    // Tidak perlu menyertakan 'files' karena kita hanya mengedit teks metadata
  };

  return handleDiscordApiCall(
    () => editMessage(channelId, messageId, options),
    "Public status updated successfully",
  );
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

// --- MODIFIKASI: Fungsi ini diubah total untuk menangani biner ---
async function loadAttachmentsData(
  attachments: { url: string; filename: string; size: number }[] | undefined,
) {
  if (!attachments || attachments.length === 0) return null;

  // Asumsi kita hanya proses attachment pertama untuk preview
  const mainAttachment = attachments[0];
  const isJson = mainAttachment.filename.endsWith(".json");

  try {
    const response = await fetch(mainAttachment.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch attachment: ${response.statusText}`);
    }

    // Jika file adalah JSON, proses sebagai teks dan parse
    if (isJson) {
      const textContent = await response.text();
      return textContent;
    } else {
      // Jika file adalah biner (gambar/video), proses sebagai ArrayBuffer
      // dan kembalikan sebagai Buffer agar bisa di-serialize oleh Next.js
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (error) {
    console.error(chalk.red("Error loading attachment data:"), error);
    // Jika ada error (misal JSON tidak valid atau fetch gagal), kembalikan null
    return null;
  }
}
