// scripts/set-webhook.ts

import { Bot } from "grammy";

// Hardcode token sementara atau ambil dari process.env (pastikan load .env dulu)
// Karena ini script terpisah, mending paste token atau pake dotenv
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "PASTE_TOKEN_TELEGRAM_LO_DISINI_KALAU_ENV_GAK_KEBACA";

const DOMAIN = false ? "https://38a2f86a3dff.ngrok-free.app" : "https://erzysh.vercel.app";
const SECRET = process.env.TELEGRAM_SECRET_TOKEN; // Samain sama TELEGRAM_SECRET_TOKEN di .env
async function main() {
  if (!TOKEN || TOKEN.length < 10 || TOKEN === "PASTE_TOKEN_TELEGRAM_LO_DISINI_KALAU_ENV_GAK_KEBACA") {
    console.error("❌ Token not set inside script.");
    process.exit(1);
  }

  const bot = new Bot(TOKEN);
  console.log("📡 Setting webhook to:", `${DOMAIN}/api/bot`);

  try {
    await bot.api.setWebhook(`${DOMAIN}/api/bot`, {
      secret_token: SECRET,
      drop_pending_updates: true, // Skip pesan lama biar gak spam pas deploy
    });
    console.log("✅ Webhook successfully set!");
    console.log(`🔑 Secret Token: ${SECRET} (Jangan lupa taruh di .env: TELEGRAM_SECRET_TOKEN)`);
  } catch (e) {
    console.error("❌ Failed:", e);
  }
}

main();
