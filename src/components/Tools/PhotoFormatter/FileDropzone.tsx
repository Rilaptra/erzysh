// src/components/Tools/PhotoFormatter/FileDropzone.tsx
import { useRef } from "react";
import { Upload, FileUp } from "lucide-react";
import type { FileInfo } from "@/types";

interface FileDropzoneProps {
  onZipFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  zipFileInfo: FileInfo | null;
  onDocxFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  docxFileInfo: FileInfo | null;
}

export const FileDropzone = ({
  onZipFileSelect,
  zipFileInfo,
  onDocxFileSelect,
  docxFileInfo,
}: FileDropzoneProps) => {
  const zipInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* ZIP File Dropzone */}
      <div className="flex flex-col items-center space-y-4">
        <input
          type="file"
          ref={zipInputRef}
          onChange={onZipFileSelect}
          accept=".zip"
          className="hidden"
        />
        <button
          onClick={() => zipInputRef.current?.click()}
          className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        >
          <Upload className="mr-2 h-5 w-5" />
          Pilih File ZIP (Wajib)
        </button>
        {zipFileInfo && (
          <div className="dark:text-off-white w-full rounded-lg border-l-4 border-indigo-500 bg-gray-100 p-4 text-left text-sm dark:border-indigo-400 dark:bg-gray-800/50">
            <p>
              <strong>File ZIP:</strong> {zipFileInfo.name}
            </p>
            <p>
              <strong>Ukuran:</strong> {zipFileInfo.size}
            </p>
          </div>
        )}
      </div>

      {/* DOCX File Dropzone */}
      <div className="flex flex-col items-center space-y-4">
        <input
          type="file"
          ref={docxInputRef}
          onChange={onDocxFileSelect}
          accept=".docx"
          className="hidden"
        />
        <button
          onClick={() => docxInputRef.current?.click()}
          className="inline-flex w-full items-center justify-center rounded-full bg-gray-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
        >
          <FileUp className="mr-2 h-5 w-5" />
          Pilih DOCX (Opsional)
        </button>
        {docxFileInfo && (
          <div className="dark:text-off-white w-full rounded-lg border-l-4 border-gray-500 bg-gray-100 p-4 text-left text-sm dark:border-gray-400 dark:bg-gray-800/50">
            <p>
              <strong>File DOCX:</strong> {docxFileInfo.name}
            </p>
            <p>
              <strong>Ukuran:</strong> {docxFileInfo.size}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
