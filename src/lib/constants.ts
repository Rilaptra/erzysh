export const DISCORD_API_BASE = "https://discord.com/api/v10";
export const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
export const GUILD_ID = "1391398629943545866";
export const CLIENT_ID = "1391399488475889845";
export const FILE_SIZE_LIMIT = 10 * 1024 * 1024;
export const SUPPORTED_TYPES = "string";
export const DISCORD_INVITE_URL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;
export const MESSAGE_LAYOUT = {
  id: "1391581829361827961",
  channelID: "1391571208973189181",
};
export const USERS_DATA_CHANNEL_ID = "1393565314960064522";

// --- TAMBAHKAN INI ---
export const KULIAH_DATA_CONTAINER_ID = "1409908765074919585"; // ID dari tugas.api.ts
export const TUGAS_BOX_ID = "1409908859971309681"; // ID dari tugas.api.ts
export const USER_TASK_COMPLETIONS_BOX_ID = "1411948551428116630"; // <-- GANTI DENGAN ID YANG ANDA SALIN
export const GHOST_CHANNEL_ID = "1450372158470750282";

if (!BOT_TOKEN) {
  // console.log(BOT_TOKEN);
  throw new Error(
    "Discord Bot Token (DISCORD_BOT_TOKEN) is not configured in environment variables.",
  );
}

if (!GUILD_ID) {
  throw new Error(
    "Discord Guild ID (GUILD_ID) is not configured in constants.ts.",
  );
}

if (!CLIENT_ID) {
  throw new Error(
    "Discord Client ID (CLIENT_ID) is not configured in constants.ts.",
  );
}

if (!MESSAGE_LAYOUT.id || !MESSAGE_LAYOUT.channelID) {
  throw new Error("MESSAGE_LAYOUT is not properly configured in constants.ts.");
}

if (!USERS_DATA_CHANNEL_ID) {
  throw new Error("USERS_DATA_CHANNEL_ID is not configured in constants.ts.");
}

if (!GHOST_CHANNEL_ID) {
  throw new Error("GHOST_CHANNEL_ID is not configured in constants.ts.");
}
