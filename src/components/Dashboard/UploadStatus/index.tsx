// src/components/Dashboard/UploadStatus.tsx
"use client";

import { UploadCloud } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { UploadQueueItem } from "../UploadQueueItem";
import type { UploadQueueItem as UploadQueueItemType } from "@/types";

interface UploadStatusProps {
  queue: UploadQueueItemType[];
}

export function UploadStatus({ queue }: UploadStatusProps) {
  const activeUploads = queue.filter((item) => item.status === "uploading");

  if (activeUploads.length === 0) {
    return null; // Jangan tampilkan apa-apa jika tidak ada unggahan
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-off-white/70 hover:bg-gunmetal hover:text-off-white relative"
        >
          <UploadCloud className="h-5 w-5 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {activeUploads.length}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-gunmetal border-teal-muted/30 text-off-white w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Uploading Files</h4>
            <p className="text-off-white/70 text-sm">
              Your files are being uploaded in the background.
            </p>
          </div>
          <div className="grid max-h-64 gap-4 overflow-y-auto pr-2">
            {activeUploads.map((item) => (
              <UploadQueueItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
