// src/components/Tools/PhotoFormatter/hooks/usePhotoFormatter.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDocxGenerator } from "./useDocxGenerator";
import { formatFileSize } from "../utils/file-utils";
import type {
  SelectedImage,
  FileInfo,
  UserInfo,
  MessageBox as MessageBoxType,
} from "@/types";

export const usePhotoFormatter = () => {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [zipFileInfo, setZipFileInfo] = useState<FileInfo | null>(null);
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [docxFileInfo, setDocxFileInfo] = useState<FileInfo | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    nama: "",
    npm: "",
    nomor_kelas: "",
  });
  const [quality, setQuality] = useState(0.8);
  const [messageBox, setMessageBox] = useState<MessageBoxType>({
    isOpen: false,
    title: "",
    text: "",
    isError: false,
  });
  const [isProcessingZip, setIsProcessingZip] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const { generateAndDownloadDocx, isLoading, progress } = useDocxGenerator();

  useEffect(() => {
    // --- THE FINAL FIX ---
    // Inisialisasi worker menggunakan new URL dengan path RELATIF ke file worker
    // yang sekarang ada di dalam `src`. Bundler Next.js akan memproses ini dengan benar.
    workerRef.current = new Worker(
      new URL("../workers/photoFormatter.worker.js", import.meta.url),
    );

    // Handler untuk menerima pesan dari worker
    workerRef.current.onmessage = (
      event: MessageEvent<{ type: string; payload: any }>,
    ) => {
      const { type, payload } = event.data;
      if (type === "SUCCESS") {
        setSelectedImages(payload);
        if (payload.length === 0) {
          showMessage(
            "Tidak Ada Gambar",
            "Tidak ada file gambar valid yang ditemukan di dalam ZIP.",
            false,
          );
        }
      } else if (type === "ERROR") {
        showMessage("Gagal Memproses ZIP", payload.message, true);
      }
      setIsProcessingZip(false); // Selesai processing
    };

    // Cleanup: Terminate worker saat komponen di-unmount
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const showMessage = (
    title: string,
    text: string,
    isError: boolean = false,
  ) => {
    setMessageBox({ isOpen: true, title, text, isError });
  };

  const closeMessageBox = () =>
    setMessageBox((prev) => ({ ...prev, isOpen: false }));

  const handleUserInfoChange = (field: keyof UserInfo, value: string) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleZipFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setZipFileInfo({ name: file.name, size: formatFileSize(file.size) });
      setSelectedImages([]); // Kosongkan preview lama
      setIsProcessingZip(true); // Mulai processing

      // Kirim file ke worker untuk diproses di background
      workerRef.current?.postMessage(file);
    },
    [],
  );

  const handleDocxFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        setDocxFile(null);
        setDocxFileInfo(null);
        return;
      }
      setDocxFile(file);
      setDocxFileInfo({ name: file.name, size: formatFileSize(file.size) });
    },
    [],
  );

  const handleGenerateClick = async () => {
    try {
      await generateAndDownloadDocx(
        selectedImages,
        userInfo,
        quality,
        docxFile,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan tidak diketahui.";
      showMessage("Gagal Membuat Dokumen", message, true);
    }
  };

  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [selectedImages]);

  return {
    selectedImages,
    zipFileInfo,
    docxFile,
    docxFileInfo,
    userInfo,
    quality,
    messageBox,
    isLoading: isLoading || isProcessingZip,
    progress,
    isProcessingZip,
    handleUserInfoChange,
    setQuality,
    handleZipFileSelect,
    handleDocxFileSelect,
    handleGenerateClick,
    closeMessageBox,
  };
};
