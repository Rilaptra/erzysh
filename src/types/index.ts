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
