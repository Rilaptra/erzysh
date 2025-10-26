// File: src/lib/discord-api-handler.ts

import { BOT_TOKEN, DISCORD_API_BASE } from "./constants";
import { setTimeout as timeoutPromise } from "timers/promises";
import chalk from "chalk";

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000; // 1 detik

/**
 * Pintu gerbang utama untuk semua request ke Discord API.
 * Fungsi ini mengelola rate limits, retries, dan error handling secara terpusat.
 *
 * @param route Endpoint API Discord (e.g., "/channels/123/messages").
 * @param options Opsi `fetch` standar (method, headers, body).
 * @param retries Jumlah percobaan yang sudah dilakukan (untuk internal).
 * @returns Promise yang resolve dengan objek `Response` dari `fetch`.
 * @throws Error jika request gagal setelah semua percobaan.
 */
async function apiRequest(
  route: string,
  options: RequestInit,
  retries = 0,
): Promise<Response> {
  const url = `${DISCORD_API_BASE}${route}`;

  // Tambahkan header Authorization secara otomatis
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bot ${BOT_TOKEN}`);

  const finalOptions: RequestInit = { ...options, headers };

  const res = await fetch(url, finalOptions);

  if (res.ok) {
    return res;
  }

  // --- Di sinilah keajaiban Rate Limit Handling dimulai ---
  if (res.status === 429) {
    if (retries >= MAX_RETRIES) {
      console.error(chalk.red(`[RATE LIMIT] Max retries (${MAX_RETRIES}) reached for ${route}. Aborting.`));
      throw new Error("Discord API rate limit exceeded after multiple retries.");
    }

    try {
      const errorData = await res.json();
      const retryAfter = (errorData.retry_after || 0) * 1000; // Konversi ke ms
      const isGlobal = errorData.global || false;

      // Exponential backoff jika retry_after tidak ada
      const waitTime = retryAfter > 0 ? retryAfter : INITIAL_BACKOFF_MS * Math.pow(2, retries);
      
      const waitColor = waitTime > 3000 ? chalk.red : chalk.yellow;
      console.warn(
        chalk.yellow(`[RATE LIMIT] Hit for ${route}. Global: ${isGlobal}. Retrying after ${waitColor(waitTime + 'ms')}... (Attempt ${retries + 1}/${MAX_RETRIES})`)
      );

      await timeoutPromise(waitTime);

      // Panggil ulang dengan increment retries
      return apiRequest(route, options, retries + 1);

    } catch {
      // Gagal parsing JSON dari error 429, fallback ke backoff standar
      const waitTime = INITIAL_BACKOFF_MS * Math.pow(2, retries);
      console.warn(chalk.yellow(`[RATE LIMIT] Hit for ${route}. Could not parse error. Retrying after ${waitTime}ms...`));
      await timeoutPromise(waitTime);
      return apiRequest(route, options, retries + 1);
    }
  }

  // Handle error lain (404, 403, 500, dll)
  try {
    const errorData = await res.json();
    console.error(chalk.red(`💥 Discord API Error [${res.status}] on ${route}: ${errorData.message || JSON.stringify(errorData)}`));
    throw new Error(`Error (${res.status}): ${errorData.message || "Unknown Discord API Error"}`);
  } catch {
     console.error(chalk.red(`💥 Discord API Error [${res.status}] on ${route}. Could not parse error response.`));
     throw new Error(`Error (${res.status}): Failed to fetch from Discord API.`);
  }
}

// Wrapper object yang akan kita gunakan di seluruh aplikasi
export const discord = {
  get: async <T>(route: string): Promise<T | null> => {
    const res = await apiRequest(route, { method: "GET" });
    if (res.status === 204) return null; // Handle No Content
    return res.json();
  },

  post: async <T>(route: string, body: any, isFormData: boolean = false): Promise<T | null> => {
    const options: RequestInit = { method: "POST" };
    if (isFormData) {
      options.body = body; // FormData akan set Content-Type sendiri
    } else {
      options.body = JSON.stringify(body);
      options.headers = { "Content-Type": "application/json" };
    }
    const res = await apiRequest(route, options);
    if (res.status === 204) return null;
    return res.json();
  },

  patch: async <T>(route: string, body: any, isFormData: boolean = false): Promise<T | null> => {
    const options: RequestInit = { method: "PATCH" };
    if (isFormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
      options.headers = { "Content-Type": "application/json" };
    }
    const res = await apiRequest(route, options);
    if (res.status === 204) return null;
    return res.json();
  },

  delete: async <T>(route: string): Promise<T | null> => {
    const res = await apiRequest(route, { method: "DELETE" });
    if (res.status === 204) return null; // DELETE sering return 204 No Content
    return res.json();
  },
};