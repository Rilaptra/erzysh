// src/lib/discord-api-handler.ts

import { BOT_TOKEN, DISCORD_API_BASE } from "./constants";
import chalk from "chalk";

const MAX_RETRIES = 5;
const BASE_DELAY = 2000; // Naikkan delay jadi 2 detik
const MAX_CONCURRENT_REQUESTS = 2; // 🚦 HANYA BOLEH 2 REQUEST JALAN BARENGAN

// --- SEMAPHORE / QUEUE SYSTEM ---
// Ini yang bikin request antri rapi, nggak tawuran.
class RequestQueue {
  private running = 0;
  private queue: Array<() => void> = [];

  async add<T>(fn: () => Promise<T>): Promise<T> {
    // Kalau slot penuh, tunggu di antrian
    if (this.running >= MAX_CONCURRENT_REQUESTS) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      // Panggil orang berikutnya di antrian
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next?.();
      }
    }
  }
}

const requestQueue = new RequestQueue();

// Helper: Sleep dengan Jitter
const sleep = (ms: number) => {
  const jitter = Math.floor(Math.random() * 500);
  return new Promise((resolve) => setTimeout(resolve, ms + jitter));
};

async function apiRequestCore<T>(
  route: string,
  options: RequestInit,
  retries = 0,
): Promise<T | null> {
  const url = `${DISCORD_API_BASE}${route}`;
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bot ${BOT_TOKEN}`);
  headers.set("User-Agent", "Erzysh/2.0 (Bun; +https://github.com/Rilaptra)");

  const finalOptions: RequestInit = { ...options, headers };

  try {
    const res = await fetch(url, finalOptions);

    if (res.ok) {
      if (res.status === 204) return null;
      return (await res.json()) as T;
    }

    // HANDLE RATE LIMIT (429)
    if (res.status === 429) {
      if (retries >= MAX_RETRIES) {
        console.error(chalk.red(`💀 [FATAL] Max retries reached for ${route}`));
        throw new Error("Discord API Rate Limit Exceeded");
      }

      const errorData = (await res.json()) as {
        retry_after?: number;
        global?: boolean;
      };

      // Hitung waktu tunggu + Backoff
      let waitTime = errorData.retry_after
        ? errorData.retry_after * 1000 + 500 // Tambah buffer 500ms
        : BASE_DELAY * Math.pow(2, retries);

      const isGlobal = errorData.global ? "🌍 GLOBAL" : "⚠️ ROUTE";

      console.warn(
        chalk.yellow(
          `⏳ [RATE LIMIT] ${isGlobal} on ${route}. Waiting ${(waitTime / 1000).toFixed(2)}s...`,
        ),
      );

      await sleep(waitTime);
      return apiRequestCore<T>(route, options, retries + 1); // Retry
    }

    // Error Lainnya
    let errorMessage = `Discord API Error ${res.status}`;
    try {
      const errorBody = await res.json();
      errorMessage = `Error (${res.status}): ${JSON.stringify(errorBody.message || errorBody)}`;
    } catch {
      errorMessage = `Error (${res.status}): ${res.statusText}`;
    }

    if (res.status === 404) {
      // 404 kita anggap null, bukan error fatal
      // console.warn(chalk.yellow(`🔍 [404] Not Found: ${route}`));
      return null;
    }

    console.error(chalk.red(`💥 [API ERROR] ${errorMessage}`));
    throw new Error(errorMessage);
  } catch (error: any) {
    if (error.message.includes("Rate Limit")) throw error;
    console.error(chalk.red(`🔌 [SYSTEM ERROR] ${route} : ${error.message}`));
    throw error;
  }
}

// Wrapper yang masukin request ke dalam Queue
async function apiRequest<T>(
  route: string,
  options: RequestInit,
): Promise<T | null> {
  return requestQueue.add(() => apiRequestCore<T>(route, options));
}

export const discord = {
  get: async <T>(route: string): Promise<T | null> => {
    return apiRequest<T>(route, { method: "GET" });
  },

  post: async <T>(
    route: string,
    body: any,
    isFormData: boolean = false,
  ): Promise<T | null> => {
    const options: RequestInit = { method: "POST" };
    if (isFormData) options.body = body;
    else {
      options.body = JSON.stringify(body);
      options.headers = { "Content-Type": "application/json" };
    }
    return apiRequest<T>(route, options);
  },

  patch: async <T>(
    route: string,
    body: any,
    isFormData: boolean = false,
  ): Promise<T | null> => {
    const options: RequestInit = { method: "PATCH" };
    if (isFormData) options.body = body;
    else {
      options.body = JSON.stringify(body);
      options.headers = { "Content-Type": "application/json" };
    }
    return apiRequest<T>(route, options);
  },

  delete: async <T>(route: string): Promise<T | null> => {
    return apiRequest<T>(route, { method: "DELETE" });
  },
};
