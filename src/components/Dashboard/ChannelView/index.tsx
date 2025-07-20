// src/components/Dashboard/ChannelView/index.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusCircle,
  Trash2,
  Loader2,
  FileJson,
  Plus,
  Edit,
  Check,
  FileUp,
  FileText,
  UploadCloud, // Tambahkan ikon baru
} from "lucide-react";
import type {
  ApiDbCategoryChannel,
  ApiDbProcessedMessage,
  ApiDbCreateChannelRequest,
} from "@/types";
import { CollectionDetailsModal } from "../CollectionDetailModal";
import { getCachedCollection, setCachedCollection } from "../Helper/cache";
import { Checkbox } from "@/components/ui/checkbox";

interface ChannelViewProps {
  channels: ApiDbCategoryChannel[];
  activeCategoryId: string | null;
  activeContainerName: string;
  onChannelCreated: () => void;
  onChannelDeleted: () => void;
  onDataChanged: () => void;
  onChannelUpdated: () => void;
  onAddToQueue: (
    files: File[],
    categoryId: string,
    channelId: string,
    containerName: string,
    boxName: string,
  ) => void;
}

export function ChannelView({
  channels,
  activeCategoryId,
  activeContainerName,
  onChannelCreated,
  onChannelDeleted,
  onDataChanged,
  onChannelUpdated,
  onAddToQueue,
}: ChannelViewProps) {
  const [addBoxOpen, setAddBoxOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [addCollectionOpen, setAddCollectionOpen] = useState(false);
  const [targetChannel, setTargetChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [manualIsPublic, setManualIsPublic] = useState(false); // State baru

  // --- BARU: useEffect untuk pre-fetch data koleksi di background ---
  useEffect(() => {
    // Pastikan ada kategori aktif dan channel yang ditampilkan
    if (!activeCategoryId || channels.length === 0) {
      return;
    }

    console.log("🚀 Starting background pre-fetch for collections...");

    const preFetchPromises = [];

    // Kumpulkan semua 'message' (koleksi) dari semua channel
    for (const channel of channels) {
      for (const message of channel.messages) {
        // Cek dulu, kalau sudah ada di cache, lewati
        if (getCachedCollection(message.id)) {
          continue;
        }

        // Buat promise untuk fetch data, tapi jangan di-await dulu
        const promise = fetch(
          `/api/database/${activeCategoryId}/${channel.id}/${message.id}`,
        )
          .then((res) => {
            if (!res.ok) {
              // Abaikan error untuk pre-fetch, jangan sampai crash
              return Promise.reject(`Failed to pre-fetch ${message.name}`);
            }
            return res.json();
          })
          .then((data) => {
            // Kalau berhasil, simpan di cache
            setCachedCollection(message.id, data);
            console.log(`✅ Cached: ${message.name}`);
          })
          .catch((err) => {
            // Tangkap error agar Promise.allSettled tidak berhenti
            console.warn(err);
          });

        preFetchPromises.push(promise);
      }
    }

    // Jalankan semua promise secara paralel dan "lupakan"
    // Ini proses background, kita tidak perlu menunggu hasilnya di sini
    if (preFetchPromises.length > 0) {
      Promise.allSettled(preFetchPromises).then(() => {
        console.log("🏁 Background pre-fetch finished.");
      });
    } else {
      console.log("✅ All collections already cached.");
    }
  }, [channels, activeCategoryId]); // Jalankan effect ini saat channels atau kategori berubah

  // State untuk mode upload & form
  const [uploadMode, setUploadMode] = useState<"file" | "manual">("file");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [selectedCollection, setSelectedCollection] = useState<
    (ApiDbProcessedMessage & { channelId: string }) | null
  >(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingChannelName, setEditingChannelName] = useState("");
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreateChannel = async () => {
    if (!newChannelName || !activeCategoryId) return;
    setIsCreatingChannel(true);
    await fetch(`/api/database/${activeCategoryId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: { name: newChannelName },
      } as ApiDbCreateChannelRequest),
    });
    setIsCreatingChannel(false);
    setNewChannelName("");
    setAddBoxOpen(false);
    onChannelCreated();
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!activeCategoryId) return;
    setIsDeleting(channelId);
    await fetch(`/api/database/${activeCategoryId}/${channelId}`, {
      method: "DELETE",
    });
    setIsDeleting(null);
    onChannelDeleted();
  };

  const handleStartEditChannel = (ch: ApiDbCategoryChannel) => {
    setEditingChannelId(ch.id);
    setEditingChannelName(ch.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleUpdateChannelName = async (channelId: string) => {
    if (!editingChannelName || !activeCategoryId || isUpdatingChannel) return;
    setIsUpdatingChannel(true);
    await fetch(`/api/database/${activeCategoryId}/${channelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingChannelName }),
    });
    setIsUpdatingChannel(false);
    setEditingChannelId(null);
    setEditingChannelName("");
    onChannelUpdated();
  };

  const openAddCollectionDialog = (channel: ApiDbCategoryChannel) => {
    setTargetChannel({ id: channel.id, name: channel.name });
    // Reset form states
    setUploadMode("file");
    setSelectedFiles(null);
    setManualName("");
    setManualContent("");
    setJsonError(null);
    setAddCollectionOpen(true);
    setManualIsPublic(false); // Reset juga state ini
  };

  const handleStartUpload = () => {
    if (!activeCategoryId || !targetChannel) return;

    if (uploadMode === "file" && selectedFiles) {
      onAddToQueue(
        Array.from(selectedFiles),
        activeCategoryId,
        targetChannel.id,
        activeContainerName,
        targetChannel.name,
      );
    } else if (uploadMode === "manual" && manualName && manualContent) {
      try {
        JSON.parse(manualContent);
        setJsonError(null);
        const file = new File(
          [manualContent],
          manualName.endsWith(".json") ? manualName : `${manualName}.json`,
          { type: "application/json" },
        );
        // Buat objek file dengan properti isPublic
        const fileWithMeta = Object.assign(file, { isPublic: manualIsPublic });

        onAddToQueue(
          [fileWithMeta],
          activeCategoryId,
          targetChannel.id,
          activeContainerName,
          targetChannel.name,
        );
      } catch {
        setJsonError("Invalid JSON format. Please provide valid JSON.");
        return;
      }
    }
    setAddCollectionOpen(false);
  };

  const handleOpenDetails = (
    collection: ApiDbProcessedMessage,
    channelId: string,
  ) => {
    setSelectedCollection({ ...collection, channelId });
    setIsDetailModalOpen(true);
  };

  if (!activeCategoryId)
    return (
      <div className="text-off-white/50 flex flex-1 items-center justify-center p-6">
        <p>Select a container from the left to view its boxes.</p>
      </div>
    );

  return (
    <>
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-off-white text-2xl font-bold">Data Boxes</h2>
          <Dialog open={addBoxOpen} onOpenChange={setAddBoxOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-muted text-dark-shale hover:bg-teal-muted/80">
                <PlusCircle size={20} className="mr-2" />
                Add Box
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gunmetal border-teal-muted/30 text-off-white sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Box</DialogTitle>
                <DialogDescription className="text-off-white/70">
                  This will create a new data box (channel) in the selected
                  container.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Label htmlFor="channel-name">Box Name</Label>
                <Input
                  id="channel-name"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="bg-dark-shale border-teal-muted/50"
                  placeholder="e.g., user-profiles"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateChannel}
                  disabled={isCreatingChannel}
                  className="bg-teal-muted text-dark-shale hover:bg-teal-muted/80"
                >
                  {isCreatingChannel && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Box
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {channels.map((ch) => (
            <Card
              key={ch.id}
              className="bg-gunmetal/50 border-gunmetal text-off-white flex flex-col"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileJson size={16} />
                  {editingChannelId === ch.id ? (
                    <Input
                      ref={inputRef}
                      value={editingChannelName}
                      onChange={(e) => setEditingChannelName(e.target.value)}
                      onBlur={() => handleUpdateChannelName(ch.id)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleUpdateChannelName(ch.id)
                      }
                      className="bg-dark-shale border-teal-muted/50 h-8 flex-1"
                      disabled={isUpdatingChannel}
                    />
                  ) : (
                    <CardTitle>{ch.name}</CardTitle>
                  )}
                </div>
                <div className="flex items-center">
                  {editingChannelId === ch.id ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleUpdateChannelName(ch.id)}
                      disabled={isUpdatingChannel}
                    >
                      {isUpdatingChannel ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-off-white/50 hover:text-off-white/80 h-8 w-8"
                      onClick={() => handleStartEditChannel(ch)}
                    >
                      <Edit size={16} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteChannel(ch.id)}
                    disabled={!!isDeleting}
                    className="h-8 w-8 text-red-500/50 hover:bg-red-900/30 hover:text-red-500"
                  >
                    {isDeleting === ch.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between">
                <div className="mb-4">
                  <h4 className="text-off-white/60 mb-2 text-xs font-semibold uppercase">
                    Collections ({ch.messages.length})
                  </h4>
                  {ch.messages.length > 0 ? (
                    <ul className="max-h-24 space-y-1 overflow-y-auto pr-2 text-xs">
                      {ch.messages.map((msg: ApiDbProcessedMessage) => (
                        <li
                          key={msg.id}
                          className="bg-dark-shale/50 hover:bg-dark-shale/80 flex cursor-pointer items-center justify-between rounded p-1.5 transition-colors"
                          onClick={() => handleOpenDetails(msg, ch.id)}
                        >
                          <span className="truncate" title={msg.name}>
                            {msg.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-off-white/50 py-4 text-center text-xs">
                      No collections yet.
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-teal-muted/20 text-dark-sha hover:bg-teal-muted/10 w-full"
                  onClick={() => openAddCollectionDialog(ch)}
                >
                  <Plus size={16} className="mr-2" />
                  Add Collection
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={addCollectionOpen} onOpenChange={setAddCollectionOpen}>
        <DialogContent className="bg-gunmetal border-teal-muted/30 text-off-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Collection(s)</DialogTitle>
            <DialogDescription className="text-off-white/70">
              Upload files or enter JSON content for the &quot;
              <b>{targetChannel?.name}</b>&quot; box.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              variant={uploadMode === "file" ? "default" : "outline"}
              onClick={() => setUploadMode("file")}
              className={
                uploadMode === "file"
                  ? "bg-teal-muted text-dark-shale hover:bg-teal-muted/90"
                  : "border-gunmetal hover:bg-gunmetal/80"
              }
            >
              <FileUp className="mr-2 h-4 w-4" /> Upload file
            </Button>
            <Button
              variant={uploadMode === "manual" ? "default" : "outline"}
              onClick={() => setUploadMode("manual")}
              className={
                uploadMode === "manual"
                  ? "bg-teal-muted text-dark-shale hover:bg-teal-muted/90"
                  : "border-gunmetal hover:bg-gunmetal/80"
              }
            >
              <FileText className="mr-2 h-4 w-4" /> Manual Input
            </Button>
          </div>

          <div className="grid gap-4 py-4">
            {uploadMode === "file" ? (
              <div className="space-y-3">
                <Label htmlFor="data-file">Drop Zone</Label>
                <div className="relative">
                  <Input
                    id="data-file"
                    type="file"
                    multiple
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="sr-only" // Input asli disembunyikan
                  />
                  <Label
                    htmlFor="data-file"
                    className="border-teal-muted/30 bg-dark-shale hover:border-teal-muted hover:bg-gunmetal/50 flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="text-off-white/70 mb-4 h-8 w-8" />
                      <p className="text-off-white/70 mb-2 text-sm">
                        <span className="text-teal-muted font-semibold">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-off-white/50 text-xs">
                        Any file type supported
                      </p>
                    </div>
                  </Label>
                </div>
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="text-off-white/80 text-xs">
                    <p className="mb-1 font-semibold">
                      {selectedFiles.length} file selected:
                    </p>
                    <ul className="max-h-24 list-inside list-disc space-y-1 overflow-y-auto pl-2">
                      {Array.from(selectedFiles).map((file) => (
                        <li key={file.name} className="truncate">
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Collection Name</Label>
                  <Input
                    id="manual-name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="bg-dark-shale border-teal-muted/50"
                    placeholder="e.g., my_document.json"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-content">Content (JSON)</Label>
                  <Textarea
                    id="manual-content"
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    className="bg-dark-shale border-teal-muted/50 min-h-[150px] font-mono"
                    placeholder='{ "key": "value" }'
                  />
                  {jsonError && (
                    <p className="text-sm text-red-500">{jsonError}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="manual-public"
                    checked={manualIsPublic}
                    onCheckedChange={(checked) =>
                      setManualIsPublic(Boolean(checked))
                    }
                  />
                  <Label
                    htmlFor="manual-public"
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Make this collection public
                  </Label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleStartUpload}
              disabled={
                (uploadMode === "file" &&
                  (!selectedFiles || selectedFiles.length === 0)) ||
                (uploadMode === "manual" && (!manualName || !manualContent))
              }
              className="bg-teal-muted text-dark-shale hover:bg-teal-muted/80"
            >
              {uploadMode === "file"
                ? `Upload ${selectedFiles?.length || 0} file`
                : "Add Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedCollection && activeCategoryId && (
        <CollectionDetailsModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          collection={selectedCollection}
          categoryId={activeCategoryId}
          channelId={selectedCollection.channelId}
          onDataChanged={() => {
            setIsDetailModalOpen(false);
            onDataChanged();
          }}
        />
      )}
    </>
  );
}
