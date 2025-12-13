// src/lib/validators/index.ts
import { z } from "zod";

// --- AUTH SCHEMAS ---
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(32, "Username maksimal 32 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = loginSchema; // Sama aturan mainnya

// --- DATABASE SCHEMAS ---

// Validasi nama category/channel (Discord rules: lowercase, no spaces, hyphens usually)
const discordNameSchema = z
  .string()
  .min(1, "Nama tidak boleh kosong")
  .max(100, "Nama maksimal 100 karakter")
  .transform((val) => val.trim()); // Auto trim whitespace

export const createCategorySchema = z.object({
  data: z.object({
    name: discordNameSchema,
  }),
});

export const createChannelSchema = z.object({
  data: z.object({
    name: discordNameSchema,
  }),
});

// Schema untuk Payload pesan/file
export const sendMessageSchema = z.object({
  data: z.object({
    name: z.string().min(1, "Nama file/data diperlukan"),
    content: z.union([z.string(), z.record(z.any(), z.any())]), // Bisa string raw atau JSON object
    isPublic: z.boolean().optional().default(false),
    size: z.number().optional(),
  }),
});

// Schema untuk Update (PATCH) - semua field optional tapi minimal satu harus ada
export const updateMessageSchema = z.object({
  data: z
    .object({
      name: z.string().max(100).optional(),
      content: z.union([z.string(), z.record(z.any(), z.any())]).optional(),
      isPublic: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message:
        "Minimal satu field harus diupdate (name, content, atau isPublic)",
    }),
});

// --- NOTIFICATION SCHEMAS ---
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// --- TUGAS SCHEMAS ---
export const tugasSchema = z.object({
  judul: z.string().min(3),
  mataKuliah: z.string().min(3),
  kategori: z.enum(["Kuliah", "Tugas Prodi", "Lainnya"]),
  deadline: z.string().datetime(), // Validasi format ISO 8601
  deskripsi: z.string().optional(),
  isCompleted: z.boolean().optional(),
});
