// src/types/index.ts
export * from "./discord";
export * from "./api-db-response";
export * from "./api-db-request";
export * from "./payload";

// Tipe baru untuk item antrean unggahan
export interface UploadQueueItem {
  id: string;
  file: File & { isPublic?: boolean };
  status: "uploading" | "success" | "error";
  error?: string;
  startTime: number;
  containerName: string;
  boxName: string;
  categoryId: string;
  channelId: string;
}

// src/types/index.ts

export interface SelectedImage {
  filename: string;
  url: string; // URL.createObjectURL for preview
  data: Blob; // Raw blob data for processing
  base64?: string | null; // Optional, will be populated on generation
}

export interface FileInfo {
  name: string;
  size: string;
}

export interface UserInfo {
  nama: string;
  npm: string;
  nomor_kelas: string;
}

export interface ProgressStatus {
  percentage: number;
  message: string;
}

export interface MessageBox {
  isOpen: boolean;
  title: string;
  text: string;
  isError: boolean;
}

export interface GeneratedDoc {
  blob: Blob;
  fileName: string;
}

/**
 * Tipe untuk operasi yang didukung oleh worker.
 */
export type QueueOperation =
  | "CREATE_CATEGORY"
  | "CREATE_CHANNEL"
  | "SEND_MESSAGE"
  | "UPDATE_MESSAGE"
  | "UPDATE_CHANNEL"
  | "UPDATE_CATEGORY"
  | "DELETE_MESSAGE"
  | "DELETE_CHANNEL"
  | "DELETE_CATEGORY"
  | "TOGGLE_PUBLIC";

/**
 * Struktur job yang akan dikirim ke QStash.
 */
export interface QueueJob {
  operation: QueueOperation;
  payload: {
    // ID bisa berupa categoryId, channelId, atau messageId tergantung operasi
    targetId?: string;
    parentId?: string; // Digunakan untuk create/delete channel (categoryId)
    data?: any; // Konten untuk create/update
    userId?: string; // Untuk validasi & logging
    isPublic?: boolean; // Untuk toggle public
  };
}
