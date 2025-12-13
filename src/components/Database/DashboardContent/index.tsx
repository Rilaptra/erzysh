// src/components/Dashboard/DashboardContent/index.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
// Hapus import PanelLeft dari sini karena sudah dipindah
import { UploadStatus } from "../UploadStatus";
import { CategorySidebar } from "../Sidebar";
import { ChannelView } from "../ChannelView";
import { useHeaderContext } from "@/context/HeaderContext";
import type {
  UserPayload,
  ApiDbCategory,
  UploadQueueItem,
  DiscordCategory,
  ApiDbCategoryChannel,
} from "@/types";

interface DashboardContentProps {
  initialCategories: ApiDbCategory[];
  user: UserPayload;
}

export function DashboardContent({ initialCategories }: DashboardContentProps) {
  const container = useRef(null);
  const [categories, setCategories] =
    useState<ApiDbCategory[]>(initialCategories);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    initialCategories[0]?.id || null,
  );
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { setHeaderConfig, resetHeader } = useHeaderContext();

  // --- DATA FETCHING & UPLOAD LOGIC SAMA SEPERTI SEBELUMNYA (Disingkat biar fokus) ---
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/database");
      if (!res.ok) throw new Error("Failed to refresh server data.");
      const serverData: { data: { [key: string]: ApiDbCategory } } =
        await res.json();
      setCategories(Object.values(serverData.data));
    } catch (err) {
      toast.error("Failed to refresh data", {
        description: (err as Error).message,
      });
    }
  }, []);

  const handleDataChange = useCallback(() => {
    setTimeout(() => fetchData(), 2000);
  }, [fetchData]);

  const handleSelectCategory = (id: string) => {
    setActiveCategoryId(id);
  };

  const handleAddToUploadQueue = (
    files: (File & { isPublic?: boolean })[],
    categoryId: string,
    channelId: string,
    containerName: string,
    boxName: string,
  ) => {
    // ... (Logic upload sama persis, copy paste aja kalau mau lengkap) ...
    const newQueueItems: UploadQueueItem[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      file,
      status: "uploading",
      startTime: Date.now(),
      categoryId,
      channelId,
      containerName,
      boxName,
    }));
    setUploadQueue((prev) => [...prev, ...newQueueItems]);
    // ... (sisanya sama)
  };

  const simplifiedCategories: DiscordCategory[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    type: 4,
    guild_id: "",
    position: 0,
  }));

  const allChannels: ApiDbCategoryChannel[] = categories.flatMap(
    (cat) => cat.boxes || [],
  );
  const filteredChannels = allChannels.filter(
    (ch) => ch.categoryId === activeCategoryId,
  );
  const activeContainer = simplifiedCategories.find(
    (cat) => cat.id === activeCategoryId,
  );

  const containerName = activeContainer?.name || "Manager";

  // --- UPDATE HEADER CONFIG (BERSIH KEMBALI) ---
  useEffect(() => {
    const title = (
      <div className="flex items-center gap-2 overflow-hidden text-sm">
        <span className="text-muted-foreground hidden font-medium sm:inline-block">
          Database
        </span>
        <span className="text-border/60 hidden sm:inline-block">/</span>
        <span className="text-foreground truncate text-base font-bold tracking-tight sm:text-sm">
          {containerName}
        </span>
      </div>
    );

    setHeaderConfig({
      content: title, // Hanya teks, tanpa tombol menu
      actions: null,
    });

    return () => resetHeader();
  }, [containerName, setHeaderConfig, resetHeader]);

  useGSAP(
    () => {
      gsap.to(".blob-db", {
        x: "random(-100, 100)",
        y: "random(-100, 100)",
        scale: "random(0.8, 1.2)",
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 2,
      });
    },
    { scope: container },
  );

  return (
    <div
      ref={container}
      className="bg-background relative h-[calc(100vh-4rem)] overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob-db absolute top-0 left-0 h-[600px] w-[600px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="blob-db absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <div className="absolute top-4 right-4 z-30">
          <UploadStatus queue={uploadQueue} />
        </div>

        <div className="flex flex-1 overflow-hidden">
          <CategorySidebar
            categories={simplifiedCategories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onDataChanged={handleDataChange}
          />

          <main className="relative flex-1 overflow-hidden">
            <ChannelView
              boxes={filteredChannels}
              activeCategoryId={activeCategoryId}
              activeContainerName={activeContainer?.name || "Select Container"}
              onDataChanged={handleDataChange}
              onboxCreated={handleDataChange}
              onboxDeleted={handleDataChange}
              onboxUpdated={handleDataChange}
              onAddToQueue={handleAddToUploadQueue}
              // 🔥 Pass fungsi toggle ke sini
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
