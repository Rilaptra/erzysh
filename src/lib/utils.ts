// file: src/lib/utils.ts
import {
  DiscordButtonComponents,
  DiscordMessagePayload,
  DiscordPartialChannelResponse,
  DiscordPartialMessageResponse,
  SendMessageOptions,
} from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  BOT_TOKEN,
  DISCORD_API_BASE,
  FILE_SIZE_LIMIT,
  GUILD_ID,
} from "./constants";
import chalk from "chalk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Fungsi untuk melakukan request ke Discord API.
 * @param route Bagian endpoint API Discord (misal: "/channels/123/messages").
 * @param method Metode HTTP (GET, POST, DELETE, PATCH).
 * @param body Objek data yang akan dikirim (untuk POST/PATCH).
 * @returns Promise yang resolve dengan data JSON dari respons API.
 * @throws Error jika request gagal.
 */
export async function discordFetch<T>(
  route: string,
  method: "GET" | "POST" | "DELETE" | "PATCH" = "GET",
  body?: Record<string, any>,
  contentType = true
): Promise<T> {
  const headers: HeadersInit = {
    Authorization: `Bot ${BOT_TOKEN}`,
  };
  if (body && (method === "POST" || method === "PATCH") && contentType) {
    headers["Content-Type"] = "application/json";
  }
  const options: RequestInit = {
    method,
    headers,
    body: !body
      ? undefined
      : contentType
      ? JSON.stringify(body)
      : (body as any),
  };
  const res = await fetch(`${DISCORD_API_BASE}${route}`, options);
  if (!res.ok) {
    const errorData = await res.json();
    console.error(`💥 Discord API Error [${res.status}]: ${errorData.message}`);
    throw new Error(`Error (${res.status}): ${errorData.message}`);
  }
  if (res.headers.get("content-type")?.includes("application/json"))
    return await res.json();
  return null as T;
}

export const discord = {
  /**
   * Melakukan request GET ke Discord API.
   * @param route Bagian endpoint API Discord.
   */
  get: <T>(route: string) => discordFetch<T>(route, "GET"),

  /**
   * Melakukan request POST ke Discord API.
   * @param route Bagian endpoint API Discord.
   * @param data Objek data yang akan dikirim sebagai body.
   */
  post: <T>(route: string, data: Record<string, any>, contentType?: boolean) =>
    discordFetch<T>(route, "POST", data, contentType),

  /**
   * Melakukan request DELETE ke Discord API.
   * @param route Bagian endpoint API Discord.
   */
  delete: <T>(route: string) => discordFetch<T>(route, "DELETE"),

  /**
   * Melakukan request PATCH ke Discord API.
   * @param route Bagian endpoint API Discord.
   * @param data Objek data yang akan dikirim sebagai body.
   */
  patch: <T>(route: string, data: Record<string, any>, contentType?: boolean) =>
    discordFetch<T>(route, "PATCH", data, contentType),
};

/**
 * Mengirim pesan ke channel Discord.
 * @param channelId ID channel tujuan.
 * @param options Opsi untuk pesan yang akan dikirim (konten, embed, file, dll.).
 * @returns Promise yang resolve dengan data JSON dari respons API.
 * @throws Error jika gagal mengirim pesan.
 */
export async function sendMessage(
  channelId: string,
  options: SendMessageOptions & { edit?: boolean; messageId?: string }
): Promise<DiscordPartialMessageResponse> {
  const route = `/channels/${channelId}/messages${
    options.edit ? `/${options.messageId}` : ""
  }`;
  const payload: DiscordMessagePayload = {};
  const formData = new FormData();
  let hasFiles = false;

  const { content, embeds, components, files, ...restOptions } = options;

  if (content) payload.content = content;
  if (embeds) payload.embeds = embeds;
  if (restOptions.tts !== undefined) payload.tts = restOptions.tts;
  if (restOptions.nonce !== undefined) payload.nonce = restOptions.nonce;
  if (restOptions.flags !== undefined) payload.flags = restOptions.flags;
  if (restOptions.allowed_mentions !== undefined)
    payload.allowed_mentions = restOptions.allowed_mentions;
  if (restOptions.message_reference !== undefined)
    payload.message_reference = restOptions.message_reference;
  if (restOptions.sticker_ids !== undefined)
    payload.sticker_ids = restOptions.sticker_ids;

  if (components && components.length > 0) {
    payload.components = [
      {
        type: 1,
        components: components.map(
          ({ label, url, disabled }: DiscordButtonComponents) => ({
            type: 2,
            style: 5,
            label,
            url,
            disabled,
          })
        ),
      },
    ];
  }

  if (files && files.length > 0) {
    hasFiles = true;
    payload.attachments = [];
    files.forEach((file, index) => {
      const blob = new Blob([file.buffer], {
        type: "application/octet-stream",
      });
      formData.append(`files[${index}]`, blob, file.name);
      payload.attachments!.push({
        id: index.toString(),
        filename: file.name,
      });
    });
    formData.append("payload_json", JSON.stringify(payload));
  }

  try {
    const result = await (options.edit
      ? hasFiles
        ? discord.patch<DiscordPartialMessageResponse>(route, formData, false)
        : discord.patch<DiscordPartialMessageResponse>(route, payload)
      : hasFiles
      ? discord.post<DiscordPartialMessageResponse>(route, formData, false) // `false` untuk contentType karena FormData otomatis
      : discord.post<DiscordPartialMessageResponse>(route, payload));

    return result;
  } catch (error) {
    console.error("[Runtime Error] Error sending message to Discord:", error);
    throw error;
  }
}

/**
 * Mengedit pesan di channel Discord.
 * @param channelId ID channel tujuan.
 * @param messageId ID pesan yang akan diedit.
 * @param options Opsi untuk pesan yang akan diedit.
 * @returns Respons dari Discord API jika berhasil.
 * @throws Error jika gagal mengedit pesan.
 */
export async function editMessage(
  channelId: string,
  messageId: string,
  options: SendMessageOptions
): Promise<DiscordPartialMessageResponse> {
  // Langsung pakai fungsi sendMessage dengan opsi edit
  return await sendMessage(channelId, {
    ...options,
    messageId,
    edit: true,
  });
}

/**
 * Mendapatkan daftar channel dari guild.
 * @returns Array of DiscordPartialChannelResponse.
 * @throws Error jika gagal mengambil channel.
 */
export async function getChannels(): Promise<DiscordPartialChannelResponse[]> {
  try {
    const channels = await discord.get<
      { parent_id: string; id: string; name: string; type: number }[]
    >(`/guilds/${GUILD_ID}/channels`);

    // Mapping channel biar lebih gampang dibaca
    const formattedChannels = channels.map((channel) => {
      let parentName = "No Category";
      if (channel.parent_id) {
        const parentChannel = channels.find((c) => c.id === channel.parent_id);
        if (parentChannel) {
          parentName = parentChannel.name;
        }
      }
      return {
        id: channel.id,
        name: channel.name,
        isCategory: channel.type === 4,
        type: channel.type,
        categoryId: channel.parent_id || null,
        category: parentName,
      };
    });

    return formattedChannels;
  } catch (error) {
    console.error("Error fetching channels:", error);
    throw error; // Propagate error
  }
}

/**
 * Mendapatkan semua channel yang berada di bawah satu kategori (parent).
 * Fungsi ini memanfaatkan `getChannels()` untuk efisiensi agar tidak melakukan API call berulang.
 * @param parentId ID dari channel kategori (parent).
 * @returns Promise yang resolve dengan array channel yang difilter.
 * @throws Error jika gagal mengambil data channel awal dari `getChannels()`.
 */
export async function getChannelsFromParentId(
  parentId: string
): Promise<DiscordPartialChannelResponse[]> {
  try {
    // 1. Panggil fungsi getChannels() yang sudah ada untuk mendapatkan semua channel di guild.
    //    Ini lebih efisien daripada melakukan API call baru.
    const allChannels = await getChannels();

    // 2. Filter hasil dari getChannels() berdasarkan parentId yang diberikan.
    //    Kita hanya ambil channel yang properti `categoryId`-nya cocok.
    const filteredChannels = allChannels.filter(
      (channel) => channel.categoryId === parentId && !channel.isCategory
    );

    // 3. Kembalikan array channel yang sudah difilter.
    //    Jika tidak ada channel di bawah parentId itu, ini akan mengembalikan array kosong [].
    return filteredChannels;
  } catch (error) {
    // Menangkap error yang mungkin dilempar oleh getChannels()
    console.error(
      chalk.red(
        `[Runtime Error] Gagal mengambil channel untuk parent ID: ${parentId}`
      ),
      error
    );
    // Melempar kembali error agar bisa ditangani oleh pemanggil fungsi ini.
    throw error;
  }
}

/**
 * Mendapatkan detail channel berdasarkan ID.
 * @param channelId ID channel.
 * @returns DiscordPartialChannelResponse atau undefined jika tidak ditemukan/error.
 * @throws Error jika gagal mengambil channel.
 */
export async function getChannel(
  channelId: string
): Promise<DiscordPartialChannelResponse> {
  try {
    const { id, name, parent_id, type } = await discord.get<{
      parent_id: string;
      id: string;
      name: string;
      type: number;
    }>(`/channels/${channelId}`);

    const formattedChannel = {
      id,
      name,
      isCategory: type === 4,
      type,
      categoryId: parent_id || null,
    } as DiscordPartialChannelResponse;

    return formattedChannel;
  } catch (error) {
    console.error(`Error fetching channel ${channelId}:`, error);
    throw error;
  }
}

/**
 * Mendapatkan pesan-pesan dari sebuah channel.
 * @param channelId ID channel.
 * @returns Array of DiscordPartialMessageResponse atau null jika error.
 * @throws Error jika gagal mengambil pesan.
 */
export async function getMessagesFromChannel(channelId: string): Promise<
  {
    attachments: {
      url: string;
      filename: string;
      size: number;
    }[];
    id: string;
    content: any;
    edited_timestamp: string | null;
    timestamp: string;
  }[]
> {
  try {
    const messages = await discord.get<DiscordPartialMessageResponse[]>(
      `/channels/${channelId}/messages`
    );

    return messages.map((msg) => sanitizeMessage(msg));
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

export function fileAttachmentsBuilder({
  fileName,
  data,
  size,
}: {
  fileName: string;
  data: string;
  size?: number;
}): SendMessageOptions["files"] {
  const attachments: SendMessageOptions["files"] = [];
  const dataSize = size ?? data.length;
  const isChunked = dataSize > FILE_SIZE_LIMIT;
  const totalChunks = Math.ceil(dataSize / FILE_SIZE_LIMIT);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * FILE_SIZE_LIMIT;
    const end = start + FILE_SIZE_LIMIT;
    const chunk = data.slice(start, end);

    attachments.push({
      name:
        (isChunked ? `chunk_${i + 1}_${fileName}` : fileName) +
        (/\.\w+$/.test(fileName) ? "" : ".json"),
      buffer: Buffer.from(chunk),
      ...(isChunked && { description: `Chunk ${i + 1} of ${totalChunks}` }),
    });
  }

  return attachments;
}

export function sanitizeMessage(data: DiscordPartialMessageResponse) {
  try {
    const parsedBody = JSON.parse(
      data.content.replace(/```(json)?/g, "").trim()
    );
    return {
      attachments: data.attachments.map(({ url, filename, size }) => ({
        url,
        filename,
        size,
      })),
      id: data.id,
      content: parsedBody,
      edited_timestamp: data.edited_timestamp,
      timestamp: data.timestamp,
    };
  } catch {
    console.warn(
      chalk.yellow(
        "Warning: Failed to parse message content, returning as string."
      )
    );
    return {
      attachments: data.attachments.map(({ url, filename, size }) => ({
        url,
        filename,
        size,
      })),
      id: data.id,
      content: data.content,
      edited_timestamp: data.edited_timestamp,
      timestamp: data.timestamp,
    };
  }
}
