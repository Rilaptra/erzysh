// src/components/Tools/PhotoFormatter/hooks/useDocxGenerator.ts
"use client";

import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import imageCompression from "browser-image-compression";
import { arrayBufferToBase64, getMimeType } from "../utils/file-utils";
import {
  createContentTypes,
  createMainRels,
  createDocumentRels,
  createDocumentBody,
  appendImagesToBody,
  appendToRels,
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
    existingDocx: File | null,
  ) => {
    if (images.length === 0) {
      throw new Error("Tidak ada gambar yang dipilih untuk diproses.");
    }
    if (!userInfo.nama || !userInfo.npm || !userInfo.nomor_kelas) {
      throw new Error("Harap isi semua informasi: Nama, NPM, dan Nomor Kelas.");
    }

    setIsLoading(true);
    setProgress({ percentage: 0, message: "Memulai proses..." });

    try {
      setProgress({
        percentage: 5,
        message: "Mempersiapkan kompresi gambar...",
      });

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: quality,
      };

      // --- PERBAIKAN LOGIKA COUNTER DIMULAI DI SINI ---

      // 1. Inisialisasi counter di luar scope promise.
      let completedCount = 0;
      const totalImages = images.length;

      const compressionPromises = images.map((image) => {
        return (async () => {
          const mimeType = getMimeType(image.filename);
          const imageFile = new File([image.data], image.filename, {
            type: mimeType,
          });

          const compressedFile = await imageCompression(imageFile, options);
          const arrayBuffer = await compressedFile.arrayBuffer();
          const base64 = arrayBufferToBase64(arrayBuffer);

          // 2. Gunakan 'atomic' increment dan update progress.
          // Ini aman dari race condition di environment JavaScript.
          completedCount++;

          const currentProgress = 5 + (completedCount / totalImages) * 70;
          setProgress({
            percentage: currentProgress,
            message: `Kompresi selesai: ${completedCount} dari ${totalImages}`,
          });

          return { ...image, base64 };
        })();
      });

      const imagesWithBase64 = await Promise.all(compressionPromises);

      // --- AKHIR PERBAIKAN ---

      setProgress({ percentage: 80, message: "Membuat struktur dokumen..." });

      const docxZip = new JSZip();

      if (existingDocx) {
        // ... (Logika mode update tidak berubah)
        const loadedZip = await docxZip.loadAsync(existingDocx);
        const relsFile = loadedZip.file("word/_rels/document.xml.rels");
        const bodyFile = loadedZip.file("word/document.xml");
        if (!relsFile || !bodyFile) throw new Error("File DOCX tidak valid.");
        const originalRelsStr = await relsFile.async("string");
        const originalBodyStr = await bodyFile.async("string");
        const relIdMatches = [...originalRelsStr.matchAll(/rId(\d+)/g)];
        const lastRelId =
          relIdMatches.length > 0
            ? Math.max(...relIdMatches.map((m) => parseInt(m[1])))
            : 0;
        const pIdMatches = [
          ...originalBodyStr.matchAll(/<w:docPr id="(\d+)"/g),
        ];
        const lastPId =
          pIdMatches.length > 0
            ? Math.max(...pIdMatches.map((m) => parseInt(m[1])))
            : 0;
        const numMatches = [
          ...originalBodyStr.matchAll(/<w:t>(\d+)\.<\/w:t>/g),
        ];
        const lastNum =
          numMatches.length > 0
            ? Math.max(...numMatches.map((m) => parseInt(m[1])))
            : 0;
        const startingRId = lastRelId + 1;
        const startingPId = lastPId + 1;
        const startingNum = lastNum + 1;
        const updatedBody = appendImagesToBody(
          originalBodyStr,
          imagesWithBase64,
          { pId: startingPId, rId: startingRId, num: startingNum },
        );
        const updatedRels = appendToRels(
          originalRelsStr,
          imagesWithBase64,
          startingRId,
        );
        loadedZip.file("word/_rels/document.xml.rels", updatedRels);
        loadedZip.file("word/document.xml", updatedBody);
        const mediaFolder = loadedZip.folder("word/media");
        imagesWithBase64.forEach((image, i) => {
          if (image.base64) {
            const extension = image.filename.split(".").pop() || "png";
            mediaFolder?.file(
              `image${startingRId + i}.${extension}`,
              image.base64,
              { base64: true },
            );
          }
        });
      } else {
        // ... (Logika mode baru tidak berubah)
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
      }

      setProgress({ percentage: 95, message: "Menghasilkan file DOCX..." });
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
