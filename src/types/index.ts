export interface DiscordEmbed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
    icon_url?: string;
    proxy_icon_url?: string;
  };
  image?: {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
  };
  thumbnail?: {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
  };
  video?: {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
  };
  provider?: {
    name: string;
    url?: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
    proxy_icon_url?: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  bot?: boolean;
  system?: boolean;
}

export interface DiscordButtonComponents {
  type?: 2;
  style?: 5;
  label: string;
  url: string;
  disabled?: boolean;
}

export interface DiscordMessagePayload {
  content?: string;
  embeds?: DiscordEmbed[] | Record<string, any>[];
  components?: {
    type: 1;
    components: DiscordButtonComponents[];
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

export interface DiscordPartialMessageResponse {
  content: string; // Isi pesan, bisa berupa string biasa atau markdown
  embeds: DiscordEmbed[]; // Array of embed objects (untuk contoh ini, bisa dikosongkan)
  timestamp: string; // ISO8601 timestamp saat pesan dikirim
  edited_timestamp: string | null; // ISO8601 timestamp saat pesan diedit, atau null
  id: string; // Snowflake ID dari pesan
  channel_id: string; // Snowflake ID dari channel tempat pesan dikirim
  author: DiscordUser; // User object (bisa merujuk ke DiscordUser jika didefinisikan)
  attachments: {
    id: string;
    filename: string;
    size: number;
    url: string;
  }[];
}

export interface SendMessageOptions {
  content?: string;
  embeds?: DiscordEmbed[] | Record<string, any>[];
  files?: {
    name: string;
    buffer: Buffer<ArrayBuffer>;
    description?: string;
  }[];
  components?: DiscordButtonComponents[];
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

export interface DiscordPartialChannelResponse {
  // id: channel.id,
  // name: channel.name,
  // isCategory: channel.type === 4,
  // type: channel.type, // 0: text, 2: voice, 4: category, etc.
  // categoryId: channel.parent_id || null,
  // category: parentName,
  // channel,
  id: string;
  name: string;
  isCategory: boolean;
  type: number;
  categoryId: string | null;
  category: string | null;
  channel: Record<string, any>;
}
