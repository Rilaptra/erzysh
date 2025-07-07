// file: src/lib/utils.ts
import crypto from "crypto";
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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Mengirim pesan ke channel Discord.
 * @param channelId ID channel tujuan.
 * @param options Opsi untuk pesan yang akan dikirim (konten, embed, file, dll.).
 * @returns Respons dari Discord API jika berhasil.
 * @throws Error jika gagal mengirim pesan.
 */
export async function sendMessage(
  channelId: string,
  options: SendMessageOptions & { edit?: boolean; messageID?: string }
): Promise<DiscordPartialMessageResponse> {
  const url = `${DISCORD_API_BASE}/channels/${channelId}/messages${
    options.edit ? `/${options.messageID}` : ""
  }`;
  const payload: DiscordMessagePayload = {};
  const formData = new FormData();
  let hasFiles = false;

  // --- 1. Persiapan Payload JSON ---
  // Kita bisa pakai destructuring dan spread operator biar lebih ringkas
  const {
    content,
    embeds,
    components,
    files,
    ...restOptions // Mengambil semua opsi lain yang ada di SendMessageOptions
  } = options;

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

  // Transformasi components agar sesuai format Discord API
  if (components && components.length > 0) {
    payload.components = [
      {
        type: 1, // Action Row
        components: components.map(
          ({ label, url, disabled }: DiscordButtonComponents) => ({
            type: 2, // Button
            style: 5, // Link button style
            label,
            url,
            disabled,
          })
        ),
      },
    ];
  }

  // --- 2. Penanganan File dan FormData ---
  if (files && files.length > 0) {
    hasFiles = true;
    payload.attachments = []; // Inisialisasi attachments di payload
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
    // Append payload JSON ke FormData hanya jika ada file
    formData.append("payload_json", JSON.stringify(payload));
  }

  // --- 3. Konfigurasi Fetch Request ---
  const fetchOptions: RequestInit = {
    method: options.edit ? "PATCH" : "POST",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      // Content-Type tidak perlu diatur manual untuk FormData, fetch akan otomatis menambahkannya
      // Tapi untuk JSON biasa, perlu diset
      ...(hasFiles ? {} : { "Content-Type": "application/json" }),
    },
    body: hasFiles ? formData : JSON.stringify(payload),
  };

  // --- 4. Eksekusi dan Penanganan Error ---
  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `[Discord API Error] Failed to send message: ${response.status} - ${errorData.message}`
      );
      throw new Error(
        `Failed to send message to Discord: ${errorData.message}`
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error("[Runtime Error] Error sending message to Discord:", error);
    throw error;
  }
}

export async function editMessage(
  channelId: string,
  messageId: string,
  options: SendMessageOptions
): Promise<DiscordPartialMessageResponse> {
  return await sendMessage(channelId, {
    ...options,
    messageID: messageId,
    edit: true,
  });
}

export async function getChannels(): Promise<DiscordPartialChannelResponse[]> {
  const url = `${DISCORD_API_BASE}/guilds/${GUILD_ID}/channels`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `Discord API Error: ${response.status} - ${errorData.message}`
      );
      return errorData.message;
    }

    const channels = await response.json();

    // Mapping channel biar lebih gampang dibaca
    const formattedChannels = channels.map((channel: any) => {
      let parentName = "No Category";
      if (channel.parent_id) {
        const parentChannel = channels.find(
          (c: any) => c.id === channel.parent_id
        );
        if (parentChannel) {
          parentName = parentChannel.name;
        }
      }
      return {
        id: channel.id,
        name: channel.name,
        isCategory: channel.type === 4,
        type: channel.type, // 0: text, 2: voice, 4: category, etc.
        categoryId: channel.parent_id || null,
        category: parentName,
        channel,
      };
    });

    return formattedChannels;
  } catch (error) {
    console.error("Error fetching channels:", error);
    return [];
  }
}

export async function getChannel(
  channelId: string
): Promise<DiscordPartialChannelResponse | void> {
  const url = `${DISCORD_API_BASE}/channels/${channelId}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `Discord API Error: ${response.status} - ${errorData.message}`
      );
      // Mengembalikan pesan error agar bisa ditangani di bagian pemanggil
      console.error({ error: errorData.message, status: response.status });
      return;
    }

    const channel = await response.json();

    // Untuk memastikan formatnya mirip dengan getChannels, kita tambahkan parentName jika ada
    let formattedChannel = {
      id: channel.id,
      name: channel.name,
      isCategory: channel.type === 4,
      type: channel.type,
      categoryId: channel.parent_id || null,
      channel: channel, // Mengembalikan object channel asli juga
    } as DiscordPartialChannelResponse;

    return formattedChannel;
  } catch (error) {
    console.error(`Error fetching channel ${channelId}:`, error);
    return;
  }
}

export async function getMessagesFromChannel(
  channelId: string
): Promise<DiscordPartialMessageResponse[] | null> {
  const url = `${DISCORD_API_BASE}/channels/${channelId}/messages`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `Discord API Error: ${response.status} - ${errorData.message}`
      );
      return null;
    }

    const messages = (
      (await response.json()) as DiscordPartialMessageResponse[]
    ).map(
      ({
        author,
        channel_id,
        content,
        embeds,
        attachments,
        timestamp,
        edited_timestamp,
        id,
      }) => ({
        author: {
          username: author.username,
          discriminator: author.discriminator,
          id: author.id,
          global_name: author.global_name,
          bot: author.bot,
          system: author.system,
        },
        channel_id,
        content,
        embeds,
        attachments: attachments.map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          size: attachment.size,
          url: attachment.url,
        })),
        timestamp,
        edited_timestamp,
        id,
      })
    );
    return messages;
    // return await response.json();
  } catch (error) {
    console.error("Error fetching messages:", error);
    return null;
  }
}

/**
 * Encrypts a string using AES-256-CBC.
 *
 * @param content The string to encrypt.
 * @param key The 32-character key used for encryption.
 * @returns The encrypted string, formatted as a concatenation of the initialization vector (hex) and the encrypted content (hex).
 * @throws Error if the key is invalid.
 */
export function encData(content: string, key: string): string {
  if (!key || key.length !== 32) {
    throw new Error("Encryption key must be 32 characters for AES-256.");
  }

  const IV_LENGTH = 16; // For AES-256-CBC
  const encryptionKey = Buffer.from(key, "utf8");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);

  let encrypted = cipher.update(content, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypts a string that was previously encrypted by encData.
 *
 * @param encryptedContent The string to decrypt.
 * @param key The 32-character key used for encryption.
 * @returns The decrypted string.
 * @throws Error if the key is invalid or if the encrypted string is malformed.
 */

export function decData(encryptedContent: string, key: string): string {
  if (!key || key.length !== 32) {
    throw new Error("Decryption key must be 32 characters for AES-256.");
  }

  const parts = encryptedContent.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted string format.");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];

  const decryptionKey = Buffer.from(key, "utf8");
  const decipher = crypto.createDecipheriv("aes-256-cbc", decryptionKey, iv);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
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
      // Tambahkan properti 'description' hanya jika file dipecah (isChunked)
      ...(isChunked && { description: `Chunk ${i + 1} of ${totalChunks}` }),
    });
  }

  return attachments;
}
