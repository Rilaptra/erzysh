// /api/database/[...slug]/route.ts
import {
  getMessagesFromChannel,
  sanitizeMessage,
  getChannelsFromParentId,
  processMessage,
  discord,
} from "@/lib/utils";
import type { DiscordMessage, QueueJob } from "@/types";
import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server";
import {
  createApiResponse,
  loadBodyRequest,
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
import { publishToQueue } from "@/lib/queue"; // <-- Import baru
// import { getAuthInfo } from "../helpers"; // <-- Pastikan getAuthInfo di-export dari helpers

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
  { params }: { params: { slug: string[] } },
) {
  try {
    const [categoryId, channelId] = params.slug;
    const data = await loadBodyRequest(req);
    const { userID } = getAuthInfo(req);

    if (!data)
      return createApiResponse({ message: "Invalid request body" }, 400);

    let job: QueueJob;

    if (categoryId && !channelId) {
      // Create Channel
      job = {
        operation: "CREATE_CHANNEL",
        payload: { parentId: categoryId, data, userId: userID },
      };
    } else if (channelId) {
      // Send Message
      job = {
        operation: "SEND_MESSAGE",
        payload: { targetId: channelId, data, userId: userID },
      };
    } else {
      return createApiResponse(
        { message: "Invalid POST request parameters." },
        400,
      );
    }

    await publishToQueue(job);
    return createApiResponse(
      { message: "Request has been accepted for processing." },
      202,
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
    const { userID } = getAuthInfo(req);

    if (!data)
      return createApiResponse({ message: "Invalid request body" }, 400);

    let job: QueueJob;

    if (messageId) {
      // Update Message or Toggle Public
      if (
        typeof data.isPublic === "boolean" &&
        Object.keys(data).length === 1
      ) {
        job = {
          operation: "TOGGLE_PUBLIC",
          payload: {
            targetId: messageId,
            parentId: channelId,
            isPublic: data.isPublic,
            userId: userID,
          },
        };
      } else {
        job = {
          operation: "UPDATE_MESSAGE",
          payload: {
            targetId: messageId,
            parentId: channelId,
            data,
            userId: userID,
          },
        };
      }
    } else if (channelId) {
      // Update Channel
      job = {
        operation: "UPDATE_CHANNEL",
        payload: { targetId: channelId, data, userId: userID },
      };
    } else if (categoryId) {
      // Update Category
      job = {
        operation: "UPDATE_CATEGORY",
        payload: { targetId: categoryId, data, userId: userID },
      };
    } else {
      return createApiResponse(
        { message: "Invalid PATCH request parameters." },
        400,
      );
    }

    await publishToQueue(job);
    return createApiResponse(
      { message: "Update request has been accepted." },
      202,
    );
  } catch (error) {
    console.error(chalk.red("Error in PATCH handler:"), error);
    return createApiResponse({ error: "Internal Server Error" }, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string[] } },
) {
  try {
    const [categoryId, channelId, messageId] = params.slug;
    const { userID } = getAuthInfo(req);

    let job: QueueJob;

    if (messageId) {
      // Delete Message
      job = {
        operation: "DELETE_MESSAGE",
        payload: { targetId: messageId, parentId: channelId, userId: userID },
      };
    } else if (channelId) {
      // Delete Channel
      job = {
        operation: "DELETE_CHANNEL",
        payload: { targetId: channelId, parentId: categoryId, userId: userID },
      };
    } else if (categoryId) {
      // Delete Category
      job = {
        operation: "DELETE_CATEGORY",
        payload: { targetId: categoryId, userId: userID },
      };
    } else {
      return createApiResponse(
        { message: "Invalid DELETE request parameters." },
        400,
      );
    }

    await publishToQueue(job);
    return createApiResponse(
      { message: "Deletion request has been accepted." },
      202,
    );
  } catch (error) {
    console.error(chalk.red("Error in DELETE handler:"), error);
    return createApiResponse({ error: "Internal Server Error" }, 500);
  }
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
