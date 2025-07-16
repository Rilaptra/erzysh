// src/components/Dashboard/UploadQueueItem.tsx
"use client";

import { useState, useEffect } from "react";
import { File, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { UploadQueueItem } from "@/types";

interface UploadQueueItemProps {
  item: UploadQueueItem;
}

export function UploadQueueItem({ item }: UploadQueueItemProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (item.status === "uploading") {
      const timer = setInterval(() => {
        setElapsedTime((Date.now() - item.startTime) / 1000);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [item.status, item.startTime]);

  const getStatusIcon = () => {
    switch (item.status) {
      case "uploading":
        return <Loader2 className="text-teal-muted h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="text-off-white/50 h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-start space-x-3 text-sm">
      <div className="mt-1">{getStatusIcon()}</div>
      <div className="flex-1 space-y-1">
        <p
          className="text-off-white truncate font-medium"
          title={item.file.name}
        >
          {item.file.name}
        </p>
        <p className="text-off-white/70 text-xs">
          To: {item.containerName} / {item.boxName}
        </p>
        <div className="flex items-center space-x-2">
          <Progress
            value={item.status === "uploading" ? undefined : 100}
            className="h-1 animate-pulse"
          />
          {item.status === "uploading" && (
            <span className="text-teal-muted w-12 text-right font-mono text-xs">
              {elapsedTime.toFixed(1)}s
            </span>
          )}
        </div>
        {item.status === "error" && item.error && (
          <p className="text-xs text-red-500">{item.error}</p>
        )}
      </div>
    </div>
  );
}
