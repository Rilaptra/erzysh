// src/components/Dashboard/CollectionDetailModal/index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Download,
  Edit,
  Trash2,
  Save,
  ExternalLink,
  Loader2,
  FileJson,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import Image from "next/image";
import type { ApiDbProcessedMessage, ApiDbGetMessageResponse } from "@/types";
import { getMimeType } from "@/lib/utils.client";
import {
  getCachedCollection,
  setCachedCollection,
  removeCachedCollection,
} from "../Helper/cache";
import { toast } from "sonner";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: ApiDbProcessedMessage;
  categoryId: string;
  channelId: string;
  onDataChanged: () => void;
}

export function CollectionDetailsModal({
  isOpen,
  onClose,
  collection,
  categoryId,
  channelId,
  onDataChanged,
}: ModalProps) {
  const [data, setData] = useState<ApiDbGetMessageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileType = useMemo(() => {
    const ext = collection.name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
      return "image";
    if (["mp4", "webm"].includes(ext || "")) return "video";
    return "text";
  }, [collection.name]);

  // Fetch Data
  useEffect(() => {
    if (!isOpen) return;
    const fetchDetail = async () => {
      setLoading(true);

      // Try Cache First
      const cached = getCachedCollection(collection.id);
      if (cached) {
        setData(cached);
        if (fileType === "text")
          setEditContent(JSON.stringify(cached.data, null, 2));
        setLoading(false);
        return;
      }

      // Fetch Network
      try {
        const res = await fetch(
          `/api/database/${categoryId}/${channelId}/${collection.id}`,
        );
        if (!res.ok) throw new Error("Failed fetch");
        const json = await res.json();
        setData(json);
        setCachedCollection(collection.id, json);
        if (fileType === "text")
          setEditContent(JSON.stringify(json.data, null, 2));
      } catch (e) {
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [isOpen, collection.id, categoryId, channelId, fileType]);

  // Handle Blob URL for Media
  useEffect(() => {
    if (data?.data && (fileType === "image" || fileType === "video")) {
      // Pastikan data.data adalah buffer array
      const buffer = data.data.data;
      if (buffer) {
        const blob = new Blob([new Uint8Array(buffer)], {
          type: getMimeType(collection.name),
        });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    }
  }, [data, fileType, collection.name]);

  // Actions
  const handleSave = async () => {
    try {
      const payload = { data: { name: collection.name, content: editContent } };
      await fetch(`/api/database/${categoryId}/${channelId}/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      removeCachedCollection(collection.id);
      toast.success("Saved!");
      setEditing(false);
      onDataChanged();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete permanently?")) return;
    await fetch(`/api/database/${categoryId}/${channelId}/${collection.id}`, {
      method: "DELETE",
    });
    removeCachedCollection(collection.id);
    onDataChanged(); // Close modal via callback
  };

  const handleDownload = () => {
    if (!data?.data) return;
    const content =
      fileType === "text"
        ? JSON.stringify(data.data, null, 2)
        : new Uint8Array(data.data.data);
    const blob = new Blob([content as any], {
      type: getMimeType(collection.name),
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = collection.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTogglePublic = async (val: boolean) => {
    try {
      await fetch(`/api/database/${categoryId}/${channelId}/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { isPublic: val } }),
      });
      setData((prev) => (prev ? { ...prev, isPublic: val } : null));
      toast.success(`Public access: ${val ? "ON" : "OFF"}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background/95 border-border/50 flex max-h-[90vh] flex-col overflow-hidden backdrop-blur-xl sm:max-w-4xl">
        <DialogHeader className="border-border/50 shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 truncate text-xl">
            {fileType === "image" ? (
              <ImageIcon className="h-5 w-5 text-purple-500" />
            ) : fileType === "video" ? (
              <Video className="h-5 w-5 text-red-500" />
            ) : (
              <FileJson className="h-5 w-5 text-blue-500" />
            )}
            <span className="truncate">{collection.name}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-[300px] flex-1 items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
            {/* === LEFT COLUMN: PREVIEW/EDITOR === */}
            <div className="bg-muted/20 border-border/50 relative flex flex-1 items-center justify-center overflow-hidden border-b p-4 md:border-r md:border-b-0 md:p-6">
              {editing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="bg-background/50 h-full w-full resize-none border-0 p-4 font-mono text-xs focus-visible:ring-0"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center overflow-auto">
                  {fileType === "image" && previewUrl ? (
                    <div className="relative h-full min-h-[300px] w-full">
                      <Image
                        src={previewUrl}
                        alt="preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : fileType === "video" && previewUrl ? (
                    <video
                      src={previewUrl}
                      controls
                      className="max-h-full max-w-full rounded-lg shadow-lg"
                    />
                  ) : (
                    <pre className="bg-card border-border/50 h-full w-full overflow-auto rounded-lg border p-4 font-mono text-xs">
                      {editContent ||
                        JSON.stringify(data?.data, null, 2) ||
                        "No content"}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* === RIGHT COLUMN: META & ACTIONS === */}
            <div className="bg-background flex w-full shrink-0 flex-col gap-6 overflow-y-auto p-6 md:w-80">
              {/* Metadata */}
              <div className="space-y-4">
                <h4 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                  Metadata
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="border-border/50 flex justify-between border-b py-1">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-mono font-medium">
                      {collection.size
                        ? (collection.size / 1024).toFixed(2)
                        : "unkown"}{" "}
                      KB
                    </span>
                  </div>
                  <div className="border-border/50 flex justify-between border-b py-1">
                    <span className="text-muted-foreground">Created</span>
                    <span>
                      {new Date(collection.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="border-border/50 flex justify-between border-b py-1">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium uppercase">{fileType}</span>
                  </div>
                </div>
              </div>

              {/* Public Access Toggle */}
              <div className="space-y-3">
                <div className="bg-muted/30 border-border/50 flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Public Access</span>
                    <span className="text-muted-foreground text-[10px]">
                      Anyone with link can view
                    </span>
                  </div>
                  <Switch
                    checked={data?.isPublic || false}
                    onCheckedChange={handleTogglePublic}
                  />
                </div>

                {data?.isPublic && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-dashed text-xs"
                    onClick={() => {
                      const url = `${window.location.origin}/api/database/${categoryId}/${channelId}/${collection.id}?raw=true&userID=${data.userID}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Public link copied!");
                    }}
                  >
                    <ExternalLink className="h-3 w-3" /> Copy Link
                  </Button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex flex-col gap-3">
                {editing ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-teal-600 text-white hover:bg-teal-700"
                    >
                      <Save className="mr-2 h-4 w-4" /> Save
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={handleDownload}
                    >
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      {fileType === "text" && (
                        <Button
                          variant="outline"
                          onClick={() => setEditing(true)}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        className={fileType !== "text" ? "col-span-2" : ""}
                        onClick={handleDelete}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
