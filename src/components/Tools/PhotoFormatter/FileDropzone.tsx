// src/components/Tools/PhotoFormatter/FileDropzone.tsx
import { useRef } from "react";
import { Upload } from "lucide-react";
import type { FileInfo } from "@/types";

interface FileDropzoneProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInfo: FileInfo | null;
}

export const FileDropzone = ({ onFileSelect, fileInfo }: FileDropzoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        accept=".zip"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
      >
        <Upload className="mr-2 h-5 w-5" />
        Pilih File ZIP
      </button>
      {fileInfo && (
        <div className="dark:text-off-white w-full rounded-lg border-l-4 border-indigo-500 bg-gray-100 p-4 text-left text-sm dark:border-indigo-400 dark:bg-gray-800/50">
          <p>
            <strong>File:</strong> {fileInfo.name}
          </p>
          <p>
            <strong>Ukuran:</strong> {fileInfo.size}
          </p>
        </div>
      )}
    </div>
  );
};
