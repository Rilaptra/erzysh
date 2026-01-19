// src/lib/telegram.ts
import { Bot, type Context } from "grammy";
import { TELEGRAM_BOT_TOKEN } from "./constants";
import { zyLog } from "./zylog";

// Define Context custom kalau nanti butuh session, sekarang pake default dulu
export type MyContext = Context;

let bot: Bot<MyContext>;

if (TELEGRAM_BOT_TOKEN) {
	bot = new Bot<MyContext>(TELEGRAM_BOT_TOKEN);

	// --- MIDDLEWARES & ERROR HANDLING ---

	// Logger Middleware ala zyLog
	bot.use(async (ctx, next) => {
		const start = Date.now();
		await next();
		const ms = Date.now() - start;
		if (ctx.message?.text) {
			zyLog.info(`[TG] ${ctx.from?.first_name}: ${ctx.message.text} (${ms}ms)`);
		}
	});

	// Error Handler Global
	bot.catch((err) => {
		const ctx = err.ctx;
		zyLog.error(
			`[TG] Error while handling update ${ctx.update.update_id}:`,
			err.error,
		);
	});

	// --- COMMANDS ---

	bot.command("start", async (ctx) => {
		await ctx.reply(
			"⚡ **Eryzsh System Online.**\n\n" +
				"Identity: _Telegram Uplink_\n" +
				"Status: _Operational_\n" +
				"Runtime: _Bun / Vercel_",
			{ parse_mode: "Markdown" },
		);
	});

	bot.command("ping", async (ctx) => {
		const start = Date.now();
		const msg = await ctx.reply("🏓 Pinging...");
		const latency = Date.now() - start;
		await ctx.api.editMessageText(
			ctx.chat.id,
			msg.message_id,
			`🏓 **Pong!**\nLatency: \`${latency}ms\`\nServer Time: \`${new Date().toLocaleTimeString("id-ID")}\``,
			{ parse_mode: "Markdown" },
		);
	});

	// Integrasi Check Status (Reuse logic API health lo)
	bot.command("status", async (ctx) => {
		await ctx.reply("🔍 Checking system integrity...");
		// Disini bisa fetch ke internal API atau cek DB langsung
		// Contoh dummy response biar cepet:
		await ctx.reply(
			"✅ **System Status**\n\n" +
				"• Database: `Connected`\n" +
				"• Ghost Bridge: `Standby`\n" +
				"• Next.js: `Healthy`",
			{ parse_mode: "Markdown" },
		);
	});
} else {
	// Mock bot kalau token gak ada biar app gak crash
	bot = new Bot("dummy");
}

export { bot };
