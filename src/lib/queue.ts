// src/lib/queue.ts
import { Client } from "@upstash/qstash";
import type { QueueJob } from "@/types";

// Validasi environment variables saat inisialisasi
if (
  !process.env.QSTASH_URL ||
  !process.env.QSTASH_TOKEN ||
  !process.env.QSTASH_WORKER_URL
) {
  throw new Error("QStash environment variables are not configured properly.");
}

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN,
});

/**
 * Menerbitkan (publish) sebuah job ke antrean QStash.
 * @param job - Objek job yang berisi operasi dan payload.
 * @returns Promise yang resolve saat job berhasil dikirim ke antrean.
 */
export async function publishToQueue(job: QueueJob) {
  try {
    const response = await qstashClient.publishJSON({
      url: process.env.QSTASH_WORKER_URL!,
      // body dikirim sebagai payload utama
      body: job,
      // Menambahkan header untuk keamanan tambahan (opsional tapi direkomendasikan)
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(
      `🚀 Job [${job.operation}] published successfully with messageId: ${response.messageId}`,
    );
  } catch (error) {
    console.error(
      `🔥 Failed to publish job [${job.operation}] to QStash:`,
      error,
    );
    // Lemparkan error agar endpoint API bisa menangkapnya dan mengembalikan 500
    throw new Error("Failed to queue the operation.");
  }
}
