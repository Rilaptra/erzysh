// src/components/Dashboard/ChannelView/index.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Box,
  Search,
  MoreVertical,
  FileJson, // Icon JSON
  Trash,
  Loader2,
  Image as ImageIcon, // Icon Gambar
  Database,
  PanelLeft,
  FileText, // Icon Dokumen (PDF/Doc)
  Video, // Icon Video
  FileArchive, // Icon Zip/Rar
  File as FileIcon, // Icon Default (Generic)
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  ApiDbCategoryChannel,
  ApiDbProcessedMessage,
  ApiDbCreateChannelRequest,
} from "@/types";
import { CollectionDetailsModal } from "../CollectionDetailModal";
import { toast } from "sonner";

interface ChannelViewProps {
  boxes: ApiDbCategoryChannel[];
  activeCategoryId: string | null;
  activeContainerName: string;
  onboxCreated: () => void;
  onboxDeleted: () => void;
  onboxUpdated: () => void;
  onDataChanged: () => void;
  onAddToQueue: (
    files: File[],
    catId: string,
    boxId: string,
    contName: string,
    boxName: string,
  ) => void;
  onToggleSidebar: () => void;
}

export function ChannelView({
  boxes,
  activeCategoryId,
  activeContainerName,
  onboxCreated,
  onboxDeleted,
  onDataChanged,
  onAddToQueue,
  onToggleSidebar,
}: ChannelViewProps) {
  const [search, setSearch] = useState("");
  const [newBoxName, setNewBoxName] = useState("");
  const [isCreatingBox, setIsCreatingBox] = useState(false);
  const [addBoxOpen, setAddBoxOpen] = useState(false);

  // Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetBox, setTargetBox] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "manual">("file");
  const [manualContent, setManualContent] = useState("");
  const [manualName, setManualName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Detail Modal
  const [selectedCollection, setSelectedCollection] = useState<
    (ApiDbProcessedMessage & { boxId: string }) | null
  >(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const boxToDelete = deleteConfirmId
    ? boxes.find((b) => b.id === deleteConfirmId)
    : null;

  const filteredBoxes = (boxes || []).filter((b) =>
    (b.name || "").toLowerCase().includes((search || "").toLowerCase()),
  );

  const handleCreateBox = async () => {
    const trimmedName = newBoxName.trim();
    if (!trimmedName || !activeCategoryId) {
      toast.error("Box name cannot be empty");
      return;
    }
    if (trimmedName.length > 100) {
      toast.error("Box name must be 100 characters or less");
      return;
    }
    setIsCreatingBox(true);
    try {
      const res = await fetch(`/api/database/${activeCategoryId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { name: trimmedName },
        } as ApiDbCreateChannelRequest),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || "Failed to create box",
        );
      }
      toast.success(`Box "${trimmedName}" created!`);
      setAddBoxOpen(false);
      setNewBoxName("");
      onboxCreated();
    } catch (e) {
      toast.error(`Error: ${(e as Error).message}`);
    } finally {
      setIsCreatingBox(false);
    }
  };

  const confirmDeleteBox = async () => {
    if (!activeCategoryId || !deleteConfirmId) return;
    const boxName = boxToDelete?.name || "box";
    setDeleteConfirmId(null);
    const promise = fetch(
      `/api/database/${activeCategoryId}/${deleteConfirmId}`,
      { method: "DELETE" },
    ).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete box");
      }
      return res;
    });
    toast.promise(promise, {
      loading: `Deleting "${boxName}"...`,
      success: () => {
        onboxDeleted();
        return `"${boxName}" deleted!`;
      },
      error: (err) => `Error: ${err.message}`,
    });
  };

  const handleStartUpload = () => {
    if (!activeCategoryId || !targetBox) return;
    if (uploadMode === "file" && selectedFiles) {
      onAddToQueue(
        Array.from(selectedFiles),
        activeCategoryId,
        targetBox.id,
        activeContainerName,
        targetBox.name,
      );
    } else if (uploadMode === "manual" && manualName && manualContent) {
      try {
        const parsed = JSON.parse(manualContent);
        const file = new File(
          [JSON.stringify(parsed, null, 2)],
          manualName.endsWith(".json") ? manualName : `${manualName}.json`,
          { type: "application/json" },
        );
        onAddToQueue(
          [file],
          activeCategoryId,
          targetBox.id,
          activeContainerName,
          targetBox.name,
        );
      } catch {
        toast.error("Invalid JSON format");
        return;
      }
    }
    setUploadModalOpen(false);
  };

  // --- 🔥 PERBAIKAN ICON DI SINI ---
  const getIcon = (name?: string) => {
    if (!name) return <FileIcon className="text-muted-foreground h-4 w-4" />;
    const ext = name.split(".").pop()?.toLowerCase() || "";

    // 1. Images
    if (["jpg", "png", "jpeg", "webp", "gif", "svg"].includes(ext))
      return <ImageIcon className="h-4 w-4 text-purple-500" />;

    // 2. Data / Code (JSON, JS, TS, etc)
    if (["json", "js", "ts", "html", "css", "xml"].includes(ext))
      return <FileJson className="h-4 w-4 text-yellow-500" />;

    // 3. Videos
    if (["mp4", "webm", "ogg", "mov"].includes(ext))
      return <Video className="h-4 w-4 text-red-500" />;

    // 4. Documents (PDF, Word, Txt)
    if (["pdf", "doc", "docx", "txt", "md"].includes(ext))
      return <FileText className="h-4 w-4 text-blue-500" />;

    // 5. Archives
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
      return <FileArchive className="h-4 w-4 text-orange-500" />;

    // 6. Default (Generic File) - Warna abu-abu biar netral
    return <FileIcon className="text-muted-foreground h-4 w-4" />;
  };

  if (!activeCategoryId)
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-4">
        <Button
          variant="outline"
          className="lg:hidden"
          onClick={onToggleSidebar}
        >
          <PanelLeft className="mr-2 h-4 w-4" /> Open Sidebar
        </Button>
        <div className="bg-muted/30 border-border/50 rounded-full border p-6">
          <Database className="h-12 w-12 opacity-50" />
        </div>
        <p>Select a container from the sidebar</p>
      </div>
    );

  return (
    <div className="bg-card/30 flex h-full flex-col backdrop-blur-sm">
      {/* Header Responsif */}
      <div className="border-border/40 bg-background/40 flex flex-col gap-4 border-b p-4 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="bg-background/50 shrink-0 backdrop-blur-sm lg:hidden"
            onClick={onToggleSidebar}
          >
            <PanelLeft className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </Button>

          <div>
            <h1 className="line-clamp-1 text-xl font-bold tracking-tight md:text-2xl">
              {activeContainerName}
            </h1>
            <p className="text-muted-foreground text-sm">
              {boxes.length} boxes available
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              placeholder="Search boxes..."
              className="border-border/60 bg-background/50 h-10 w-full rounded-full pl-10 sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Dialog open={addBoxOpen} onOpenChange={setAddBoxOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setAddBoxOpen(true)}
                className="h-10 w-full gap-2 rounded-full bg-teal-600 text-white shadow-lg shadow-teal-500/20 hover:bg-teal-700 sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span className="sm:hidden">Create New Box</span>
                <span className="hidden sm:inline">New Box</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Box</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 py-4">
                <Label>Box Name</Label>
                <Input
                  value={newBoxName}
                  onChange={(e) => setNewBoxName(e.target.value)}
                  placeholder="e.g. UserData"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateBox}
                  disabled={isCreatingBox}
                  className="w-full bg-teal-600 text-white hover:bg-teal-700 sm:w-auto"
                >
                  {isCreatingBox ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid Content */}
      <div className="scrollbar-thin scrollbar-thumb-border flex-1 overflow-y-auto p-4 md:p-6">
        {filteredBoxes.length === 0 ? (
          <div className="border-border/60 bg-muted/10 animate-in fade-in zoom-in-95 flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <Box className="text-muted-foreground/50 mb-3 h-10 w-10" />
            <p className="text-muted-foreground font-medium">No boxes found</p>
            <p className="text-muted-foreground/70 text-xs">
              Create a box to start storing data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBoxes.map((box) => (
              <div
                key={box.id}
                className="group border-border/50 bg-background/40 relative flex flex-col rounded-xl border p-4 transition-all hover:-translate-y-1 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5"
              >
                {/* Box Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-600 transition-colors group-hover:bg-teal-500/20">
                      <Box className="h-5 w-5" />
                    </div>
                    <span
                      className="truncate text-sm font-semibold"
                      title={box.name}
                    >
                      {box.name}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setDeleteConfirmId(box.id)}
                        className="text-red-500 focus:bg-red-50 focus:text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" /> Delete Box
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="bg-muted/20 border-border/30 mb-4 min-h-[100px] flex-1 space-y-1.5 rounded-lg border p-2">
                  {(box.collections || []).length > 0 ? (
                    (box.collections || []).slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="text-muted-foreground bg-background/50 flex cursor-pointer items-center gap-2 rounded-md border border-transparent p-1.5 text-xs transition-colors hover:border-teal-500/20 hover:bg-teal-500/10 hover:text-teal-600"
                        onClick={() => {
                          setSelectedCollection({ ...item, boxId: box.id });
                          setDetailModalOpen(true);
                        }}
                      >
                        {/* FIX 1: Bungkus icon pake shrink-0 biar ukurannya gak berubah kena gencet teks */}
                        <div className="flex shrink-0 items-center justify-center">
                          {getIcon(item.name)}
                        </div>

                        {/* FIX 2: min-w-0 wajib ada biar truncate jalan di dalam flex, flex-1 biar menuhin sisa ruang */}
                        <span
                          className="min-w-0 flex-1 truncate font-medium"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground/40 flex h-full items-center justify-center text-xs italic">
                      Empty box
                    </div>
                  )}

                  {(box.collections || []).length > 4 && (
                    <div className="text-muted-foreground pt-1 text-center text-[10px]">
                      + {box.collections.length - 4} more
                    </div>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-muted/50 mt-auto w-full transition-colors hover:bg-teal-600 hover:text-white"
                  onClick={() => {
                    setTargetBox({ id: box.id, name: box.name });
                    setUploadModalOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-3 w-3" /> Add Data
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal, Detail Modal, dll SAMA */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        {/* ... */}
        <DialogContent>
          {/* ... */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Button
              variant={uploadMode === "file" ? "default" : "outline"}
              onClick={() => setUploadMode("file")}
            >
              Upload File
            </Button>
            <Button
              variant={uploadMode === "manual" ? "default" : "outline"}
              onClick={() => setUploadMode("manual")}
            >
              Manual JSON
            </Button>
          </div>
          {uploadMode === "file" ? (
            <div className="space-y-2">
              <Label>Select File(s)</Label>
              <Input
                type="file"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="data.json"
                />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={
                    manualContent ||
                    JSON.stringify(
                      {
                        key: "value",
                      },
                      null,
                      2,
                    )
                  }
                  onChange={(e) => setManualContent(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleStartUpload} className="w-full sm:w-auto">
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedCollection && activeCategoryId && (
        <CollectionDetailsModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          collection={selectedCollection}
          categoryId={activeCategoryId}
          channelId={selectedCollection.boxId}
          onDataChanged={() => {
            setDetailModalOpen(false);
            onDataChanged();
          }}
        />
      )}

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Box</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>"{boxToDelete?.name}"</strong>? This will permanently
              remove the box and all its contents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBox}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
