// src/components/Tools/PhotoFormatter/utils/file-utils.ts
import JSZip from "jszip";
import type { SelectedImage } from "@/types";

/**
 * Converts an ArrayBuffer to a Base64 string.
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Formats file size from bytes to a more readable format.
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Processes a ZIP file and extracts all images within it.
 * @param file - The ZIP file to process.
 * @returns A promise that resolves to an array of extracted images.
 */
export const processZipFile = async (file: File): Promise<SelectedImage[]> => {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  const imagePromises: Promise<SelectedImage | null>[] = [];
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

  zipContent.forEach((relativePath: string, zipEntry: any) => {
    if (zipEntry.dir) return;

    const extension = relativePath
      .toLowerCase()
      .substring(relativePath.lastIndexOf("."));
    if (!imageExtensions.includes(extension)) return;

    const imagePromise = async (): Promise<SelectedImage | null> => {
      try {
        const imageData = await zipEntry.async("blob");
        return {
          filename: relativePath,
          data: imageData,
          url: URL.createObjectURL(imageData),
        };
      } catch (error) {
        console.error("Error processing image:", relativePath, error);
        return null;
      }
    };
    imagePromises.push(imagePromise());
  });

  const processedImages = (await Promise.all(imagePromises)).filter(
    (img): img is SelectedImage => img !== null,
  );

  return processedImages;
};

/**
 * Mendapatkan tipe MIME dari ekstensi nama file.
 */
export const getMimeType = (filename: string): string => {
  const extension = filename.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "webp":
      return "image/webp";
    default:
      // Fallback jika tipe tidak diketahui
      return "application/octet-stream";
  }
};
