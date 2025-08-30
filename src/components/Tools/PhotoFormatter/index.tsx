// src/components/Tools/PhotoFormatter/index.tsx
"use client";

import { FileText, Loader2 } from "lucide-react";
import { usePhotoFormatter } from "./hooks/usePhotoFormatter";

import { UserInfoForm } from "./UserInfoForm";
import { FileDropzone } from "./FileDropzone";
import { ImagePreview } from "./ImagePreview";
import { GenerationProgress } from "./GenerationProgress";
import { MessageBox } from "./MessageBox";
import { CompressionOptions } from "./CompressionOptions";

import { logSuspiciousActivity } from "@/lib/actions"; // Sesuaikan path jika perlu
import { toast } from "sonner";
import { useState } from "react";

const DocxGeneratorPage = ({ admin }: { admin: boolean }) => {
  const {
    selectedImages,
    zipFileInfo,
    docxFileInfo,
    userInfo, // <-- Kita butuh ini
    startNumber,
    quality,
    messageBox,
    isLoading,
    progress,
    isProcessingZip,
    handleUserInfoChange,
    setStartNumber,
    setQuality,
    handleZipFileSelect,
    handleDocxFileSelect,
    handleGenerateClick,
    closeMessageBox,
  } = usePhotoFormatter();

  const [isFaking, setIsFaking] = useState(false);

  // --- FUNGSI JEBAKAN YANG SUDAH DI-UPGRADE ---
  async function fakeHandleGenerateClick() {
    setIsFaking(true);

    // Siapkan data yang akan dikirim
    const userInput = {
      nama: userInfo.nama,
      npm: userInfo.npm,
      nomor_kelas: userInfo.nomor_kelas,
      zipFileName: zipFileInfo?.name || null, // Ambil nama file dari state
    };

    // Panggil Server Action dengan data lengkap
    await logSuspiciousActivity(userInput);

    // Beri feedback palsu
    setTimeout(() => {
      toast.error("Generation Failed", {
        description: "An unexpected error occurred. Please try again later.",
      });
      setIsFaking(false);
    }, 1500);
  }

  return (
    <>
      <div className="dark:to-dark-shale fixed inset-0 -z-10 bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 dark:from-gray-900" />

      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="ring-opacity-5 dark:bg-dark-shale/80 w-full max-w-2xl space-y-6 rounded-2xl bg-white/70 p-8 shadow-2xl ring-1 ring-black backdrop-blur-xl dark:ring-white/10">
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
              Photo to DOCX
            </h1>
            <p className="dark:text-off-white/70 mt-2 text-gray-600">
              Unggah file ZIP berisi gambar untuk dibuat atau ditambahkan ke
              dokumen DOCX.
            </p>
          </div>

          <UserInfoForm
            userInfo={userInfo}
            onUserInfoChange={handleUserInfoChange}
            startNumber={startNumber}
            onStartNumberChange={setStartNumber}
          />
          <FileDropzone
            onZipFileSelect={handleZipFileSelect}
            zipFileInfo={zipFileInfo}
            onDocxFileSelect={handleDocxFileSelect}
            docxFileInfo={docxFileInfo}
          />

          {isProcessingZip && (
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Memproses file ZIP di background...</span>
            </div>
          )}

          {selectedImages.length > 0 && (
            <div className="flex flex-col items-center">
              <CompressionOptions
                quality={quality}
                onQualityChange={setQuality}
              />
            </div>
          )}

          <ImagePreview images={selectedImages} />

          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={admin ? handleGenerateClick : fakeHandleGenerateClick}
              disabled={isLoading || selectedImages.length === 0 || isFaking}
              className="w-full rounded-full bg-purple-600 px-8 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-purple-700 disabled:scale-100 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto dark:disabled:bg-gray-600"
            >
              {isFaking ? (
                <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
              ) : (
                <FileText className="mr-2 inline h-5 w-5" />
              )}
              {isFaking
                ? "Processing..."
                : docxFileInfo
                  ? "Update & Download DOCX"
                  : "Generate & Download DOCX"}
            </button>
            <GenerationProgress
              isLoading={isLoading && !isProcessingZip}
              progress={progress}
            />
          </div>

          <div className="rounded-r-lg border-l-4 border-yellow-500 bg-yellow-100 p-4 text-sm text-yellow-800 dark:border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-300">
            <strong>Catatan:</strong> Jika file DOCX diunggah, gambar baru akan
            ditambahkan ke dalamnya. Jika tidak, file DOCX baru akan dibuat.
          </div>
        </div>

        <footer className="dark:text-off-white/60 mt-8 text-sm text-gray-600">
          <p>Created by Erzy.sh</p>
        </footer>
      </main>

      <MessageBox messageBox={messageBox} onClose={closeMessageBox} />
    </>
  );
};

export default DocxGeneratorPage;
