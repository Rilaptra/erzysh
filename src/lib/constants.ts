export const DISCORD_API_BASE = "https://discord.com/api/v10";
export const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
export const ACCESS_TOKEN = process.env.DISCORD_BOT_ACCESS_TOKEN;
export const GUILD_ID = "1391398629943545866";
export const CLIENT_ID = "1391399488475889845";
export const FILE_SIZE_LIMIT = 10 * 1024 * 1024;
export const SUPPORTED_TYPES = ["string", "number", "object", "array"];
export const DISCORD_INVITE_URL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;
export const MESSAGE_LAYOUT = {
  id: "1391581829361827961",
  channelID: "1391571208973189181",
};

if (!BOT_TOKEN) {
  throw new Error(
    "Discord Bot Token (DISCORD_BOT_TOKEN) is not configured in environment variables."
  );
}

if (!GUILD_ID) {
  throw new Error(
    "Discord Guild ID (GUILD_ID) is not configured in constants.ts."
  );
}

if (!CLIENT_ID) {
  throw new Error(
    "Discord Client ID (CLIENT_ID) is not configured in constants.ts."
  );
}
