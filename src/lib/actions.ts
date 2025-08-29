// app/lib/actions.ts
"use server";

import { headers } from "next/headers";

// Definisikan tipe data untuk info yang dikirim dari frontend
interface UserInput {
  nama: string;
  npm: string;
  nomor_kelas: string;
  zipFileName: string | null;
}

/**
 * Mengambil informasi dari request dan input user, lalu mengirimkannya ke Discord.
 */
export async function logSuspiciousActivity(userInput: UserInput) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("DISCORD_WEBHOOK_URL is not set in .env.local!");
      return { success: false, error: "Webhook URL not configured." };
    }

    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip");
    const userAgent = headersList.get("user-agent");

    let geoData = null;
    if (ip) {
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}`);
      if (geoResponse.ok) {
        geoData = await geoResponse.json();
      }
    }

    // --- PENAMBAHAN INFO BARU DI SINI ---
    const embed = {
      title: "🚨🚨 HIGH-PRIORITY SUSPICIOUS CLICK 🚨🚨",
      description: "A user triggered the honeypot with form data.",
      color: 0xffa500, // Oranye
      fields: [
        {
          name: "👤 Nama Lengkap",
          value: `\`${userInput.nama || "Tidak diisi"}\``,
          inline: false,
        },
        {
          name: "🆔 NPM",
          value: `\`${userInput.npm || "Tidak diisi"}\``,
          inline: true,
        },
        {
          name: "🏫 Kelas",
          value: `\`${userInput.nomor_kelas || "Tidak diisi"}\``,
          inline: true,
        },
        {
          name: "📁 File ZIP Diupload",
          value: `\`${userInput.zipFileName || "Tidak ada"}\``,
          inline: false,
        },
        { name: "---", value: "---", inline: false }, // Pemisah
        { name: "🌐 IP Address", value: `\`${ip || "N/A"}\``, inline: true },
        {
          name: "📍 Lokasi",
          value: `\`${geoData?.city || "N/A"}, ${geoData?.country || "N/A"}\``,
          inline: true,
        },
        {
          name: "📡 ISP",
          value: `\`${geoData?.isp || "N/A"}\``,
          inline: false,
        },
        {
          name: "💻 User Agent",
          value: `\`\`\`${userAgent || "N/A"}\`\`\``,
          inline: false,
        },
      ],
      footer: { text: "Honeypot Security System" },
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    return { success: true };
  } catch (error) {
    console.error("Error in logSuspiciousActivity:", error);
    return { success: false, error: "An internal error occurred." };
  }
}
