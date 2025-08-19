// src/components/Tools/PhotoFormatter/MessageBox.tsx
import { CheckCircle, XCircle } from "lucide-react";
import type { MessageBox as MessageBoxType } from "@/types";

interface MessageBoxProps {
  messageBox: MessageBoxType;
  onClose: () => void;
}

export const MessageBox = ({ messageBox, onClose }: MessageBoxProps) => {
  if (!messageBox.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="dark:bg-dark-shale w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:ring-1 dark:ring-white/20">
        <div className="flex items-center">
          {messageBox.isError ? (
            <XCircle className="mr-3 h-8 w-8 text-red-500" />
          ) : (
            <CheckCircle className="mr-3 h-8 w-8 text-green-500" />
          )}
          <h3 className="dark:text-off-white text-lg font-bold text-gray-800">
            {messageBox.title}
          </h3>
        </div>
        <p className="dark:text-off-white/80 mt-2 text-sm text-gray-600">
          {messageBox.text}
        </p>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        >
          OK
        </button>
      </div>
    </div>
  );
};
