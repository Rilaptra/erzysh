// src/components/Tools/DocxExtractor/FileDropzone.tsx
import { useRef } from "react";
import { Upload } from "lucide-react";
import type { FileInfo } from "@/types";

interface FileDropzoneProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  docxFileInfo: FileInfo | null;
}

export const FileDropzone = ({
  onFileSelect,
  docxFileInfo,
}: FileDropzoneProps) => {
  const docxInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center space-y-4">
      <input
        type="file"
        ref={docxInputRef}
        onChange={onFileSelect}
        accept=".docx"
        className="hidden"
      />
      <button
        onClick={() => docxInputRef.current?.click()}
        className="inline-flex w-full items-center justify-center rounded-full bg-teal-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:outline-none"
      >
        <Upload className="mr-2 h-5 w-5" />
        Pilih File DOCX
      </button>
      {docxFileInfo && (
        <div className="dark:text-off-white w-full rounded-lg border-l-4 border-teal-500 bg-gray-100 p-4 text-left text-sm dark:border-teal-400 dark:bg-gray-800/50">
          <p>
            <strong>File Terpilih:</strong> {docxFileInfo.name}
          </p>
          <p>
            <strong>Ukuran:</strong> {docxFileInfo.size}
          </p>
        </div>
      )}
    </div>
  );
};
