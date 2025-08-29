// src/components/Tools/DocxExtractor/hooks/useDocxExtractor.ts
"use client";

import { useState, useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { formatFileSize } from "../../PhotoFormatter/utils/file-utils";
import type { SelectedImage, FileInfo } from "@/types";

export const useDocxExtractor = () => {
  const [docxFileInfo, setDocxFileInfo] = useState<FileInfo | null>(null);
  const [extractedImages, setExtractedImages] = useState<SelectedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalDocx, setOriginalDocx] = useState<File | null>(null);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      setExtractedImages([]);
      setDocxFileInfo({ name: file.name, size: formatFileSize(file.size) });
      setOriginalDocx(file);

      try {
        const zip = await JSZip.loadAsync(file);
        const imagePromises: Promise<SelectedImage | null>[] = [];
        const imageRegex = /word\/media\/(image|media)\d+\.\w+/;

        zip.forEach((relativePath, zipEntry) => {
          if (imageRegex.test(relativePath) && !zipEntry.dir) {
            const promise = zipEntry.async("blob").then((blob) => {
              // Dapatkan nama file asli dari path
              const filename = relativePath.split("/").pop() || "unknown-image";
              return {
                filename,
                url: URL.createObjectURL(blob),
                data: blob,
              };
            });
            imagePromises.push(promise);
          }
        });

        const images = (await Promise.all(imagePromises)).filter(
          (img): img is SelectedImage => img !== null,
        );

        if (images.length === 0) {
          toast.info("Tidak ada gambar yang ditemukan di dalam file DOCX ini.");
        }

        setExtractedImages(images);
      } catch (error) {
        toast.error("Gagal memproses file DOCX.", {
          description: "Pastikan file tidak rusak dan berformat .docx.",
        });
        console.error(error);
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const handleDownloadZip = useCallback(async () => {
    if (extractedImages.length === 0 || !originalDocx) return;

    setIsLoading(true);
    try {
      const zip = new JSZip();
      for (const image of extractedImages) {
        zip.file(image.filename, image.data);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const originalFileName = originalDocx.name.replace(/\.docx$/, "");
      saveAs(zipBlob, `${originalFileName}-images.zip`);
    } catch (error) {
      toast.error("Gagal membuat file ZIP.", {
        description: "Terjadi kesalahan saat mengompres gambar.",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [extractedImages, originalDocx]);

  return {
    docxFileInfo,
    extractedImages,
    isLoading,
    isProcessing,
    handleFileSelect,
    handleDownloadZip,
  };
};
