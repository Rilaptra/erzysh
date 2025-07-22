// src/components/Dashboard/CollectionDetailModal/index.tsx
"use client";
import { useState, useMemo, useEffect } from "react";
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
  Copy,
} from "lucide-react";
import type {
  ApiDbGetMessageResponse,
  ApiDbProcessedMessage,
  ApiDbUpdateMessageRequest,
} from "@/types";
import Image from "next/image";
import {
  getCachedCollection,
  removeCachedCollection,
  setCachedCollection,
} from "../Helper/cache";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

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
  console.log(extension);
  if (["json", "txt"].includes(extension)) return "string";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) return "image";
  if (["mp4", "webm", "ogg"].includes(extension)) return "video";
  return "other";
};

// --- BARU: Helper untuk mendapatkan MIME type dari ekstensi file ---
const getMimeType = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp"; // Buffer 'RIFF' biasanya adalah WEBP
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogg":
      return "video/ogg";
    default:
      return "application/octet-stream"; // Tipe default
  }
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

  const [lastCollectionId, setLastCollectionId] = useState<string | null>(null);
  const [collectionData, setCollectionData] =
    useState<ApiDbGetMessageResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [editContent, setEditContent] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // --- BARU: State untuk menyimpan Blob URL yang dibuat dari buffer ---
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileType = useMemo(
    () => getFileType(collection.name),
    [collection.name],
  );
  const isStringOrJson = fileType === "string";

  useEffect(() => {
    if (collection.id !== lastCollectionId) {
      setLastCollectionId(collection.id);
      setCollectionData(null);
      setShowPreview(false);
      setIsEditing(false);
      setPreviewError(null);
    }
  }, [collection.id, lastCollectionId]);

  // --- BARU: useEffect untuk menangani fetch data dengan AbortController ---
  useEffect(() => {
    // Hanya jalankan fetch jika showPreview true dan data belum ada
    if (!showPreview || collectionData) {
      return;
    }

    // Buat AbortController untuk membatalkan fetch jika komponen berubah
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setIsPreviewLoading(true);
      setPreviewError(null);

      const cachedData = getCachedCollection(collection.id);
      if (cachedData) {
        setCollectionData(cachedData);
        if (isStringOrJson) {
          setEditContent(JSON.stringify(JSON.parse(cachedData.data), null, 2));
        }
        setIsPreviewLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/database/${categoryId}/${channelId}/${collection.id}`,
          { signal }, // <-- Lewatkan signal ke fetch
        );
        if (!res.ok) throw new Error("Failed to fetch collection data.");

        const data = await res.json();
        setCollectionData(data);
        setCachedCollection(collection.id, data);

        if (isStringOrJson) {
          setEditContent(JSON.stringify(data.data, null, 2));
        }
      } catch (error: any) {
        // Jangan set error jika error karena pembatalan (abort)
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          console.error(error);
          setPreviewError(error.message);
        }
      } finally {
        setIsPreviewLoading(false);
      }
    };

    fetchData();

    // --- Cleanup Function: Ini adalah kuncinya ---
    // Fungsi ini akan dijalankan saat dependency berubah (misal collection.id)
    // atau saat komponen di-unmount.
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPreview, collection.id, categoryId, channelId, collectionData]); // <-- dependensi effect

  // --- BARU: useEffect untuk membuat & membersihkan Blob URL dari buffer ---
  useEffect(() => {
    // Cek jika collectionData ada, dan tipenya adalah image/video
    if (
      collectionData?.data &&
      (fileType === "image" || fileType === "video")
    ) {
      const buffer = collectionData.data.data;
      if (!buffer) return;

      // Buat Blob dari buffer
      const mimeType = getMimeType(collection.name);
      const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });

      // Buat Object URL (Blob URL) dari Blob
      const objectUrl = URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);

      // Cleanup Function: Hapus URL saat komponen tidak lagi memerlukannya
      // Ini sangat penting untuk mencegah memory leak!
      return () => {
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
      };
    }
  }, [collectionData, fileType, collection.name]); // Jalankan saat data atau tipe file berubah

  // --- DISEDERHANAKAN: Fungsi toggle preview sekarang hanya mengubah state ---
  const handleTogglePreview = () => {
    setShowPreview((prev) => !prev);
  };

  const handleTogglePublic = async (isPublic: boolean) => {
    try {
      const res = await fetch(
        `/api/database/${categoryId}/${channelId}/${collection.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { isPublic } }),
        },
      );
      if (!res.ok) throw new Error("Failed to update status.");

      // Update state lokal agar UI langsung berubah
      setCollectionData((prev) => (prev ? { ...prev, isPublic } : null));
      toast.success(`Collection is now ${isPublic ? "public" : "private"}.`);
    } catch (error) {
      toast.error("Failed to update public status.");
      console.error(error);
    }
  };

  const handleCopyPublicLink = () => {
    if (!collectionData?.isPublic) {
      toast.error("This collection is not public.", {
        description: "You can make it public using the toggle.",
      });
      return;
    }
    const publicUrl = `${window.location.origin}/api/database/${categoryId}/${channelId}/${collection.id}?raw=true&userID=${collectionData.userID}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Public link copied to clipboard!");
  };

  const handleStartEdit = () => {
    if (!collectionData) return;
    setIsEditing(true);
  };

  const handleDownload = () => {
    // Cek paling awal, jika tidak ada data sama sekali, jangan lakukan apa-apa.
    if (!collectionData?.data) return;

    // Tentukan data yang akan disimpan ke dalam Blob.
    const dataForBlob = isStringOrJson
      ? // Untuk JSON/string, kita stringify datanya.
        JSON.stringify(collectionData.data, null, 2)
      : // Untuk biner (gambar/video), kita ambil array buffer-nya.
        new Uint8Array(collectionData.data.data);

    // Buat Blob dengan tipe MIME yang sesuai agar file dikenali dengan benar.
    const blob = new Blob([dataForBlob], {
      type: getMimeType(collection.name),
    });

    // Buat URL sementara untuk di-download.
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = collection.name; // Gunakan nama file asli.
    document.body.appendChild(a);
    a.click(); // Simulasikan klik untuk memulai download.
    document.body.removeChild(a); // Hapus elemen 'a' setelah selesai.
    URL.revokeObjectURL(url); // Hapus URL dari memori untuk mencegah memory leak.
  };

  // --- MODIFIED: Hapus cache saat item dihapus ---
  const handleDelete = async () => {
    try {
      if (!confirm("Are you sure you want to delete this collection?")) return;
      setIsProcessing(true);
      await fetch(`/api/database/${categoryId}/${channelId}/${collection.id}`, {
        method: "DELETE",
      });
      removeCachedCollection(collection.id); // Hapus dari cache
      setIsProcessing(false);
      setCollectionData(null);
      onDataChanged(); // Ini akan menutup modal dan refresh list
    } catch (error) {
      console.error(error);
      setIsProcessing(false); // Pastikan loading state mati jika error
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simpan info file (terutama nama) untuk dikirim ke API nanti
    setEditFile(file);

    const reader = new FileReader();

    // Definisikan apa yang terjadi setelah file selesai dibaca
    reader.onload = (event) => {
      if (!event.target?.result) return;

      const fileContent = event.target.result as string;

      if (isStringOrJson) {
        // Jika file berupa JSON/TXT, langsung simpan konten teksnya
        setEditContent(fileContent);
        setJsonError(null);
      } else {
        // Jika file berupa gambar/video, hasilnya adalah Data URL
        // Format: "data:image/png;base64,iVBORw0KGgo..."
        // Kita perlu buang bagian depannya untuk mendapatkan string Base64 murni
        const base64String = fileContent.split(",")[1];
        setEditContent(base64String);
      }
    };

    // Pilih cara membaca file berdasarkan tipenya
    if (isStringOrJson) {
      reader.readAsText(file); // Baca sebagai teks biasa
    } else {
      reader.readAsDataURL(file); // Baca sebagai Data URL (untuk mendapatkan Base64)
    }
  };

  // --- MODIFIED: Hapus cache saat item diupdate ---
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
        body: JSON.stringify(payload),
      });

      removeCachedCollection(collection.id); // Hapus cache lama setelah update berhasil
      setIsProcessing(false);
      setIsEditing(false);
      setCollectionData(null);
      onDataChanged(); // Ini akan menutup modal dan refresh list
    } catch (error) {
      console.error(error);
      setIsProcessing(false); // Pastikan loading state mati jika error
    }
  };

  // --- MODIFIKASI: Render preview menggunakan state previewUrl ---
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
      // --- Menggunakan previewUrl untuk gambar dan video ---
      if ((fileType === "image" || fileType === "video") && previewUrl) {
        if (fileType === "image") {
          return (
            <Image
              src={previewUrl} // <-- Gunakan Blob URL
              width={500}
              height={256}
              alt={collection.name}
              className="mt-2 max-h-64 w-full rounded-md object-contain"
            />
          );
        }
        if (fileType === "video") {
          return (
            <video
              src={previewUrl} // <-- Gunakan Blob URL
              controls
              className="mt-2 max-h-64 w-full rounded-md"
            />
          );
        }
      }

      if (isStringOrJson) {
        return (
          <pre className="bg-dark-shale/50 mt-2 max-h-48 overflow-auto rounded-md p-2 font-mono text-xs whitespace-pre-wrap">
            {JSON.stringify(JSON.parse(collectionData.data), null, 2)}
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
              accept=".json,.txt"
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
              className="bg-dark-shale border-teal-muted/50 max-h-[200px] max-w-md overflow-auto font-mono"
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
      <DialogContent className="bg-gunmetal border-teal-muted/30 text-off-white max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
            {/* --- UI BARU UNTUK STATUS PUBLIK --- */}
            <div className="bg-dark-shale/50 flex items-center justify-between rounded-lg p-3">
              <div className="space-y-0.5">
                <Label htmlFor="public-status" className="font-semibold">
                  Public Access
                </Label>
                <p className="text-off-white/60 text-xs">
                  Anyone with the link can view this file.
                </p>
              </div>
              <Switch
                id="public-status"
                className="cursor-pointer"
                checked={collectionData?.isPublic || false}
                onCheckedChange={handleTogglePublic}
                disabled={!collectionData}
              />
            </div>
            {renderPreviewArea()}
          </div>
        )}

        <DialogFooter className="w-full flex-col gap-2 pt-4 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-red-500/50 text-red-500 hover:bg-red-900/30 hover:text-red-500"
              onClick={handleDelete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" /> Delete
                </>
              )}
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
                  disabled={isProcessing || (!editFile && !editContent)}
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
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-gunmetal hover:bg-gunmetal/80"
                  onClick={handleCopyPublicLink}
                  disabled={!collectionData?.isPublic}
                >
                  <Copy size={16} className="mr-2" /> Copy Link
                </Button>
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
                  disabled={!collectionData} // Download hanya aktif jika data sudah di-load
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
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
