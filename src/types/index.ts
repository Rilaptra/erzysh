// src/types/index.ts
export * from "./discord";
export * from "./api-db-response";
export * from "./api-db-request";
export * from "./payload";

// Tipe baru untuk item antrean unggahan
export interface UploadQueueItem {
  id: string;
  file: File;
  status: "uploading" | "success" | "error";
  error?: string;
  startTime: number;
  containerName: string;
  boxName: string;
  categoryId: string;
  channelId: string;
}
