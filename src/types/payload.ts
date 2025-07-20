import { DiscordEmbed, DiscordButtonComponents } from ".";

export interface RequestData {
  name: string;
  content: string;
  isPublic?: boolean;
  size?: number;
}

export interface DiscordMessagePayload {
  content?: string;
  embeds?: DiscordEmbed[]; // Import from discord.ts
  components?: {
    type: 1;
    components: DiscordButtonComponents[]; // Import from discord.ts
  }[];
  tts?: boolean;
  nonce?: string;
  flags?: number;
  allowed_mentions?: {
    parse?: ("users" | "roles" | "everyone")[];
    users?: string[];
    roles?: string[];
    replied_user?: boolean;
  };
  message_reference?: {
    message_id: string;
    channel_id?: string;
    guild_id?: string;
    fail_if_not_exists?: boolean;
  };
  sticker_ids?: string[];
  attachments?: {
    id: string;
    filename: string;
  }[];
}

export interface SendMessageOptions {
  content?: string;
  embeds?: DiscordEmbed[]; // Import from discord.ts
  files?: {
    name: string;
    buffer: Buffer<ArrayBuffer>;
    description?: string;
  }[];
  components?: DiscordButtonComponents[]; // Import from discord.ts
  tts?: boolean;
  nonce?: string;
  flags?: number;
  allowed_mentions?: {
    parse?: ("users" | "roles" | "everyone")[];
    users?: string[];
    roles?: string[];
    replied_user?: boolean;
  };
  message_reference?: {
    message_id: string;
    channel_id?: string;
    guild_id?: string;
    fail_if_not_exists?: boolean;
  };
  sticker_ids?: string[];
}

export interface UserPayload {
  userID: string;
  username: string;
  isAdmin: boolean;
  databases: Record<string, string[]>;
  messageId: string;
  iat: number;
  exp: number;
}

export interface UserData {
  userID: string;
  username: string;
  password_hash: string;
  is_admin: boolean;
  message_id: string;
  databases: { [categoryId: string]: string[] };
}
