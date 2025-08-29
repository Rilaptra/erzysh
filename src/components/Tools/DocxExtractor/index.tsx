// src/components/Tools/DocxExtractor/index.tsx
"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useDocxExtractor } from "./hooks/useDocxExtractor";
import { FileDropzone } from "./FileDropzone";
import { ImagePreview } from "./ImagePreview";

export function DocxExtractor() {
  const {
    docxFileInfo,
    extractedImages,
    isLoading,
    isProcessing,
    handleFileSelect,
    handleDownloadZip,
  } = useDocxExtractor();

  return (
    <>
      <div className="dark:to-dark-shale fixed inset-0 -z-10 bg-gradient-to-br from-teal-100 via-cyan-100 to-sky-200 dark:from-gray-900" />

      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="ring-opacity-5 dark:bg-dark-shale/80 w-full max-w-2xl space-y-6 rounded-2xl bg-white/70 p-8 shadow-2xl ring-1 ring-black backdrop-blur-xl dark:ring-white/10">
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-cyan-500 to-teal-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
              DOCX Image Extractor
            </h1>
            <p className="dark:text-off-white/70 mt-2 text-gray-600">
              Unggah file DOCX untuk mengambil semua gambar di dalamnya.
            </p>
          </div>

          <FileDropzone
            onFileSelect={handleFileSelect}
            docxFileInfo={docxFileInfo}
          />

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Mengekstrak gambar dari dokumen...</span>
            </div>
          )}

          <ImagePreview images={extractedImages} />

          {extractedImages.length > 0 && (
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={handleDownloadZip}
                disabled={isLoading}
                className="w-full rounded-full bg-cyan-600 px-8 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-cyan-700 disabled:scale-100 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto dark:disabled:bg-gray-600"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
                ) : (
                  <FileDown className="mr-2 inline h-5 w-5" />
                )}
                {isLoading
                  ? "Membuat ZIP..."
                  : `Download ${extractedImages.length} Gambar (.zip)`}
              </button>
            </div>
          )}
        </div>
        <footer className="dark:text-off-white/60 mt-8 text-sm text-gray-600">
          <p>Created by Erzy.sh</p>
        </footer>
      </main>
    </>
  );
}
