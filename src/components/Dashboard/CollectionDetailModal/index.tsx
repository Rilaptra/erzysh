// src/components/Dashboard/CollectionDetailModal/index.tsx
"use client";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Download,
  Edit,
  Trash2,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import type { ApiDbProcessedMessage, ApiDbUpdateMessageRequest } from "@/types";
import Image from "next/image";

interface CollectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: ApiDbProcessedMessage;
  categoryId: string;
  channelId: string;
  onDataChanged: () => void;
}

const getFileType = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return "string";
  if (["json", "txt"].includes(extension)) return "string";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) return "image";
  if (["mp4", "webm", "ogg"].includes(extension)) return "video";
  return "other";
};

export function CollectionDetailsModal({
  isOpen,
  onClose,
  collection,
  categoryId,
  channelId,
  onDataChanged,
}: CollectionDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // State untuk data preview (lazy loading)
  const [collectionData, setCollectionData] = useState<any>(null); // Cache untuk data
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [editContent, setEditContent] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const fileType = useMemo(
    () => getFileType(collection.name),
    [collection.name],
  );
  const isStringOrJson = fileType === "string";

  // Fungsi untuk mengambil data saat preview diklik
  const handleTogglePreview = async () => {
    const shouldShow = !showPreview;
    setShowPreview(shouldShow);

    // Fetch data hanya jika akan ditampilkan & belum ada di cache
    if ((shouldShow && !collectionData) || previewError) {
      setIsPreviewLoading(true);
      try {
        const res = await fetch(
          `/api/database/${categoryId}/${channelId}/${collection.id}`,
        );
        if (!res.ok) throw new Error("Failed to fetch collection data.");
        const data = await res.json();
        setCollectionData(data); // Simpan ke cache
        if (isStringOrJson) {
          setEditContent(JSON.stringify(data.data, null, 2));
        }
        setPreviewError(null);
      } catch (error: any) {
        console.error(error);
        setPreviewError(error.message);
      } finally {
        setIsPreviewLoading(false);
      }
    }
  };

  const handleStartEdit = () => {
    if (!collectionData) return; // Seharusnya tidak terjadi karena tombol dinonaktifkan
    setIsEditing(true);
  };

  const handleDownload = () => {
    // Jika data belum di-load, download dari URL jika ada
    const dataUrl = collectionData?.url;
    if (!collectionData && dataUrl) {
      window.open(dataUrl, "_blank");
      return;
    }
    // Jika data sudah di-load, buat blob
    if (!collectionData?.data) return;
    const blob = new Blob(
      [
        isStringOrJson
          ? JSON.stringify(collectionData.data)
          : collectionData.data,
      ],
      { type: "application/octet-stream" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = collection.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    try {
      if (!confirm("Are you sure you want to delete this collection?")) return;
      setIsProcessing(true);
      await fetch(`/api/database/${categoryId}/${channelId}/${collection.id}`, {
        method: "DELETE",
      });
      setIsProcessing(false);
      setCollectionData(null);
      onDataChanged();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditFile(e.target.files[0]);
      if (isStringOrJson) {
        setEditContent("");
        setJsonError(null);
      }
    }
  };

  const handleUpdate = async () => {
    try {
      if (
        (isStringOrJson && !editContent && !editFile) ||
        (!isStringOrJson && !editFile)
      )
        return;

      let contentToUpdate: string | object;
      if (editFile) {
        contentToUpdate = await editFile.text();
      } else {
        try {
          contentToUpdate = JSON.parse(editContent);
          setJsonError(null);
        } catch {
          setJsonError("Invalid JSON format.");
          return;
        }
      }

      setIsProcessing(true);
      const payload: ApiDbUpdateMessageRequest = {
        data: {
          name: editFile ? editFile.name : collection.name,
          content:
            typeof contentToUpdate === "string"
              ? contentToUpdate
              : JSON.stringify(contentToUpdate),
        },
      };

      await fetch(`/api/database/${categoryId}/${channelId}/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setIsProcessing(false);
      setIsEditing(false);
      setCollectionData(null);
      onDataChanged();
    } catch (error) {
      console.error(error);
    }
  };

  const renderPreviewArea = () => {
    if (!showPreview) return null;

    if (isPreviewLoading) {
      return (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="text-teal-muted animate-spin" />
        </div>
      );
    }
    if (previewError) {
      return (
        <p className="p-4 text-center text-sm text-red-500">{previewError}</p>
      );
    }
    if (collectionData) {
      const dataUrl = collectionData.url || collectionData.data?.url; // Menangani berbagai kemungkinan struktur data

      if (fileType === "image" && dataUrl) {
        return (
          <Image
            src={dataUrl}
            alt={collection.name}
            className="mt-2 max-h-64 w-full rounded-md object-contain"
          />
        );
      }
      if (fileType === "video" && dataUrl) {
        return (
          <video
            src={dataUrl}
            controls
            className="mt-2 max-h-64 w-full rounded-md"
          />
        );
      }
      if (isStringOrJson) {
        return (
          <pre className="bg-dark-shale/50 mt-2 max-h-48 overflow-auto rounded-md p-2 font-mono text-xs whitespace-pre-wrap">
            {JSON.stringify(collectionData.data, null, 2)}
          </pre>
        );
      }
      return (
        <p className="text-off-white/70 mt-2 text-sm">
          Preview not available for this file type.
        </p>
      );
    }
    return null;
  };

  const renderEditForm = () => {
    if (!isEditing) return null;

    if (isStringOrJson) {
      return (
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-file-json">
              Upload New File (JSON or TXT)
            </Label>
            <Input
              id="edit-file-json"
              type="file"
              onChange={handleFileChange}
              className="bg-dark-shale border-teal-muted/50"
            />
          </div>
          <div className="relative space-y-2">
            <div className="text-off-white/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs">
              OR
            </div>
            <hr className="border-gunmetal" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-content">Content (JSON)</Label>
            <Textarea
              id="edit-content"
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                setEditFile(null);
              }}
              disabled={!!editFile}
              className="bg-dark-shale border-teal-muted/50 min-h-[200px] font-mono"
            />
            {jsonError && <p className="text-sm text-red-500">{jsonError}</p>}
          </div>
        </div>
      );
    }
    return (
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="edit-file">Upload Replacement File</Label>
          <Input
            id="edit-file"
            type="file"
            onChange={handleFileChange}
            className="bg-dark-shale border-teal-muted/50"
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gunmetal border-teal-muted/30 text-off-white max-h-[90vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editing: ${collection.name}` : collection.name}
          </DialogTitle>
          <DialogDescription className="text-off-white/70">
            {isEditing
              ? "Modify the content below."
              : "View details, download, edit, or delete."}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          renderEditForm()
        ) : (
          <div className="text-off-white/80 space-y-2 text-sm">
            <p>
              <strong>ID:</strong> {collection.id}
            </p>
            <p>
              <strong>Timestamp:</strong>{" "}
              {new Date(collection.timestamp).toLocaleString()}
            </p>
            <p>
              <strong>Size:</strong> {collection.size} bytes
            </p>
            {renderPreviewArea()}
          </div>
        )}

        <DialogFooter className="w-full flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-red-500/50 text-red-500 hover:bg-red-900/30 hover:text-red-500"
              onClick={handleDelete}
              disabled={isProcessing}
            >
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-teal-muted text-dark-shale hover:bg-teal-muted/80"
                  onClick={handleUpdate}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 animate-spin" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="border-gunmetal hover:bg-gunmetal/80"
                  onClick={handleTogglePreview}
                >
                  {showPreview ? (
                    <EyeOff size={16} className="mr-2" />
                  ) : (
                    <Eye size={16} className="mr-2" />
                  )}
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
                <Button
                  variant="outline"
                  className="border-gunmetal hover:bg-gunmetal/80"
                  onClick={handleDownload}
                >
                  <Download size={16} className="mr-2" /> Download
                </Button>
                <Button
                  className="bg-teal-muted text-dark-shale hover:bg-teal-muted/80"
                  onClick={handleStartEdit}
                  disabled={!collectionData || isPreviewLoading}
                >
                  <Edit size={16} className="mr-2" /> Edit
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
