// src/components/Dashboard/DashboardContent/index.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { DashboardHeader } from "../Header";
import { CategorySidebar } from "../Sidebar";
import { ChannelView } from "../ChannelView";
import type {
  UserPayload,
  ApiDbCategory,
  UploadQueueItem,
  ApiDbSendMessageRequest,
  DiscordCategory,
  ApiDbCategoryChannel,
} from "@/types";

interface DashboardContentProps {
  initialCategories: ApiDbCategory[];
  user: UserPayload;
}

export function DashboardContent({
  initialCategories,
  user,
}: DashboardContentProps) {
  const container = useRef(null);
  const [categories, setCategories] =
    useState<ApiDbCategory[]>(initialCategories);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    initialCategories[0]?.id || null,
  );
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- DATA FETCHING ---
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
    // Delay sedikit biar server Discord sempat proses
    setTimeout(() => fetchData(), 1000);
  }, [fetchData]);

  const handleSelectCategory = (id: string) => {
    setActiveCategoryId(id);
    setIsSidebarOpen(false); // Tutup sidebar di mobile setelah pilih
  };

  // --- UPLOAD LOGIC ---
  const handleAddToUploadQueue = (
    files: (File & { isPublic?: boolean })[],
    categoryId: string,
    channelId: string,
    containerName: string,
    boxName: string,
  ) => {
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

    newQueueItems.forEach((item) => {
      const promise = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            if (!event.target?.result) throw new Error("Failed to read file.");
            const fileContent = event.target.result as string;
            const isJson =
              item.file.type === "application/json" ||
              item.file.name.endsWith(".json");
            // Basic handling: JSON as text, others as base64
            const finalContent = isJson
              ? fileContent
              : fileContent.split(",")[1];

            const payload: ApiDbSendMessageRequest = {
              data: {
                name: item.file.name,
                content: finalContent,
                isPublic: (item.file as any)?.isPublic || false,
              },
            };

            const res = await fetch(
              `/api/database/${item.categoryId}/${item.channelId}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              },
            );

            if (!res.ok) throw new Error("Upload failed");
            resolve(await res.json());
          } catch (err) {
            reject(err);
          }
        };

        const isJsonFile =
          item.file.type === "application/json" ||
          item.file.name.endsWith(".json");
        if (isJsonFile) reader.readAsText(item.file);
        else reader.readAsDataURL(item.file);
      });

      toast.promise(promise, {
        loading: `Uploading ${item.file.name}...`,
        success: () => {
          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, status: "success" } : q,
            ),
          );
          handleDataChange();
          return `${item.file.name} uploaded!`;
        },
        error: (err) => {
          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: "error", error: err.message }
                : q,
            ),
          );
          return `Failed: ${err.message}`;
        },
      });
    });
  };

  // --- PREPARE DATA ---
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

  // --- ANIMASI BACKGROUND ---
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
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob-db absolute top-0 left-0 h-[600px] w-[600px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="blob-db absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <DashboardHeader
          user={user}
          uploadQueue={uploadQueue}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div className="flex flex-1 overflow-hidden">
          <CategorySidebar
            categories={simplifiedCategories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Overlay Mobile */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

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
            />
          </main>
        </div>
      </div>
    </div>
  );
}
