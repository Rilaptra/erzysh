// src/components/Tools/PhotoFormatter/hooks/useDocxGenerator.ts
import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import imageCompression from "browser-image-compression";
// Impor fungsi baru kita
import { arrayBufferToBase64, getMimeType } from "../utils/file-utils";
import {
  createContentTypes,
  createMainRels,
  createDocumentRels,
  createDocumentBody,
} from "../utils/docx-generator";
import type { SelectedImage, UserInfo, ProgressStatus } from "@/types";

export const useDocxGenerator = () => {
  const [progress, setProgress] = useState<ProgressStatus>({
    percentage: 0,
    message: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const generateAndDownloadDocx = async (
    images: SelectedImage[],
    userInfo: UserInfo,
    quality: number,
  ) => {
    // ... (kode di atas ini tidak berubah)
    if (images.length === 0) {
      throw new Error("Tidak ada gambar yang dipilih untuk diproses.");
    }
    if (!userInfo.nama || !userInfo.npm || !userInfo.nomor_kelas) {
      throw new Error("Harap isi semua informasi: Nama, NPM, dan Nomor Kelas.");
    }

    setIsLoading(true);
    setProgress({ percentage: 0, message: "Memulai proses..." });

    try {
      const imagesWithBase64: SelectedImage[] = [];

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: quality,
      };

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const percentage = ((i + 1) / images.length) * 50;
        setProgress({
          percentage,
          message: `Mengompres gambar ${i + 1} dari ${images.length}...`,
        });

        // -- PERBAIKAN FINAL DI SINI --
        // Dapatkan tipe MIME dari nama file, bukan dari data blob-nya
        const mimeType = getMimeType(image.filename);
        const imageFile = new File([image.data], image.filename, {
          type: mimeType,
        });

        const compressedFile = await imageCompression(imageFile, options);
        const arrayBuffer = await compressedFile.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);
        imagesWithBase64.push({ ...image, base64 });
      }

      // ... (sisa kode di bawah ini tidak berubah)
      setProgress({ percentage: 75, message: "Membuat struktur dokumen..." });
      const docxZip = new JSZip();

      docxZip.file("[Content_Types].xml", createContentTypes());
      docxZip.folder("_rels")?.file(".rels", createMainRels());

      const wordFolder = docxZip.folder("word");
      wordFolder?.file("document.xml", createDocumentBody(imagesWithBase64));
      wordFolder
        ?.folder("_rels")
        ?.file("document.xml.rels", createDocumentRels(imagesWithBase64));

      const mediaFolder = wordFolder?.folder("media");
      imagesWithBase64.forEach((image, i) => {
        if (image.base64) {
          const extension = image.filename.split(".").pop() || "png";
          mediaFolder?.file(`image${i + 1}.${extension}`, image.base64, {
            base64: true,
          });
        }
      });

      setProgress({ percentage: 90, message: "Menghasilkan file DOCX..." });
      const generatedBlob = await docxZip.generateAsync({ type: "blob" });

      const docxBlob = new Blob([generatedBlob], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const fileName = `${userInfo.nama}_${userInfo.npm}_${userInfo.nomor_kelas}.docx`;
      saveAs(docxBlob, fileName);

      setProgress({ percentage: 100, message: "Selesai! File telah diunduh." });
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Terjadi kesalahan saat membuat dokumen.");
    } finally {
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  return { generateAndDownloadDocx, isLoading, progress };
};
