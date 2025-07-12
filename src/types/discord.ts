export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  bot?: boolean;
  system?: boolean;
  // Menambahkan properti dari definisi User object yang kamu berikan sebelumnya
  avatar?: string;
  mfa_enabled?: boolean;
  banner?: string;
  accent_color?: number; // integer representation of hexadecimal color code
  locale?: string;
  verified?: boolean;
  email?: string;
  flags?: number; // integer
  premium_type?: number; // integer
  public_flags?: number; // integer
}

export interface DiscordChannelMention {
  id: string; // snowflake
  guild_id: string; // snowflake
  type: number; // integer (channel type)
  name: string;
}

export interface DiscordAttachment {
  id: string; // snowflake
  filename: string;
  title?: string;
  description?: string;
  content_type?: string; // media type
  size: number; // integer (bytes)
  url: string;
  proxy_url: string;
  height?: number; // integer
  width?: number; // integer
  ephemeral?: boolean;
  duration_secs?: number; // float (currently for voice messages)
  waveform?: string; // base64 encoded bytearray (currently for voice messages)
  flags?: number; // integer (attachment flags)
}

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

export interface DiscordButtonComponents {
  type?: 2;
  style?: 5;
  label: string;
  url: string;
  disabled?: boolean;
}

export interface DiscordMessage {
  id: string; // snowflake
  channel_id: string; // snowflake
  author: DiscordUser;
  content?: string;
  timestamp: string; // ISO8601 timestamp
  edited_timestamp?: string | null;
  tts: boolean;
  mention_everyone: boolean;
  mentions: DiscordUser[];
  mention_roles: string[];
  mention_channels?: DiscordChannelMention[];
  attachments?: DiscordAttachment[];
  embeds?: DiscordEmbed[];
  nonce?: number | string;
  pinned: boolean;
  webhook_id?: string; // snowflake
  type: number; // integer
  application_id?: string; // snowflake
  flags?: number; // integer (bitfield)
  referenced_message?: DiscordMessage | null;
  position?: number; // integer
}

export interface DiscordPartialMessageResponse {
  content: string;
  embeds: DiscordEmbed[];
  timestamp: string;
  edited_timestamp: string | null;
  id: string;
  channel_id: string;
  author: DiscordUser;
  attachments: {
    id: string;
    filename: string;
    size: number;
    url: string;
  }[];
}

export interface DiscordPartialChannelResponse {
  id: string;
  name: string;
  isCategory: boolean;
  type: number;
  categoryId: string | null;
  category: string | null;
}

export interface DiscordCategory {
  id: string;
  name: string;
  type: 4; // Tipe 4 menandakan sebuah KATEGORI
  guild_id: string;
  position: number;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number; // Tipe 0 adalah Text Channel
  guild_id: string;
  position: number;
  parent_id: string | null; // ID dari kategori tempat channel ini berada
}
