// src/components/Dashboard/DashboardContent.tsx
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

  // ... (Copy semua state hooks, GSAP, dan fungsi handler dari page.tsx lama ke sini)
  // Termasuk: useGSAP, handleAddToUploadQueue, handleSelectCategory, handleDataChange

  const fetchData = useCallback(async () => {
    try {
      // Fetch hanya data utama, user sudah ada dari props
      const res = await fetch("/api/database");
      if (!res.ok) throw new Error("Failed to refresh server data.");

      const serverData: { data: { [key: string]: ApiDbCategory } } =
        await res.json();
      const categoriesFromApi = Object.values(serverData.data);
      setCategories(categoriesFromApi);
    } catch (err) {
      toast.error("Failed to refresh data", {
        description: (err as Error).message,
      });
    }
  }, []);

  const handleDataChange = useCallback(() => {
    // Beri jeda agar perubahan di backend sempat diproses
    setTimeout(() => {
      fetchData();
    }, 1000);
  }, [fetchData]);

  const handleSelectCategory = (id: string) => setActiveCategoryId(id);

  // ... (Salin fungsi handleAddToUploadQueue yang sudah diperbaiki ke sini)
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
            const finalContent = isJson
              ? fileContent
              : fileContent.split(",")[1];
            if (!finalContent)
              throw new Error("Content could not be processed.");
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
            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.message || "Upload failed");
            }
            resolve(await res.json());
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Error reading file."));
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
          return `${item.file.name} uploaded successfully!`;
        },
        error: (err: Error) => {
          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: "error", error: err.message }
                : q,
            ),
          );
          return `Failed to upload ${item.file.name}: ${err.message}`;
        },
      });
    });
  };

  const simplifiedCategories: DiscordCategory[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    type: 4,
    guild_id: "",
    position: 0,
  }));

  const allChannels: ApiDbCategoryChannel[] = categories.flatMap(
    (cat) => cat.channels || [],
  );

  const filteredChannels = allChannels.filter(
    (ch) => ch.categoryId === activeCategoryId,
  );

  const activeContainer = simplifiedCategories.find(
    (cat) => cat.id === activeCategoryId,
  );

  // useGSAP hook... (salin dari page.tsx lama)
  useGSAP(
    () => {
      gsap.to(".gsap-blob-1", {
        x: "random(-150, 150)",
        y: "random(-100, 100)",
        scale: 1.2,
        duration: 8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      gsap.to(".gsap-blob-2", {
        x: "random(-100, 100)",
        y: "random(-150, 150)",
        scale: 1.1,
        duration: 10,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: container },
  );

  return (
    <div
      ref={container}
      className="bg-dark-shale text-off-white relative min-h-screen"
    >
      <div className="absolute inset-0 z-0">
        <div className="gsap-blob-1 bg-teal-muted/10 absolute top-1/4 left-1/4 h-80 w-80 rounded-full blur-3xl filter"></div>
        <div className="gsap-blob-2 bg-gunmetal/40 absolute top-1/2 right-1/4 h-72 w-72 rounded-full blur-3xl filter"></div>
      </div>
      <div className="relative z-10 flex h-screen flex-col">
        <DashboardHeader user={user} uploadQueue={uploadQueue} />
        <div className="flex flex-1 overflow-hidden">
          <CategorySidebar
            categories={simplifiedCategories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
            onCategoryCreated={handleDataChange}
            onCategoryDeleted={handleDataChange}
            onCategoryUpdated={handleDataChange}
          />
          <ChannelView
            channels={filteredChannels}
            activeCategoryId={activeCategoryId}
            activeContainerName={activeContainer?.name || ""}
            onDataChanged={handleDataChange}
            onChannelCreated={handleDataChange}
            onChannelDeleted={handleDataChange}
            onChannelUpdated={handleDataChange}
            onAddToQueue={handleAddToUploadQueue}
          />
        </div>
      </div>
    </div>
  );
}
