// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { DashboardHeader } from "@/components/Dashboard/Header";
import { CategorySidebar } from "@/components/Dashboard/Sidebar";
import { ChannelView } from "@/components/Dashboard/ChannelView";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type {
  UserPayload,
  ApiDbGetAllStructuredDataResponse,
  ApiDbCategory,
  ApiDbCategoryChannel,
  DiscordCategory,
  UploadQueueItem,
  ApiDbSendMessageRequest,
} from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const container = useRef(null);

  // States
  const [user, setUser] = useState<UserPayload | null>(null);
  const [categories, setCategories] = useState<DiscordCategory[]>([]);
  const [channels, setChannels] = useState<ApiDbCategoryChannel[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State baru untuk antrean unggahan
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

  // Animasi
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

  const fetchData = useCallback(async () => {
    try {
      const [userRes, serverDataRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/database"),
      ]);
      if (!userRes.ok) throw new Error("Please log in again.");
      if (!serverDataRes.ok) throw new Error("Failed to fetch server data.");

      const userData = await userRes.json();
      const serverData: ApiDbGetAllStructuredDataResponse =
        await serverDataRes.json();

      setUser(userData);
      const categoriesFromApi = Object.values(serverData.data);
      const flattenedCategories: DiscordCategory[] = [];
      const flattenedChannelsWithMessages: ApiDbCategoryChannel[] = [];
      categoriesFromApi.forEach((category: ApiDbCategory) => {
        flattenedCategories.push({
          id: category.id,
          name: category.name,
          type: 4,
          guild_id: "",
          position: 0,
        });
        if (category.channels && Array.isArray(category.channels)) {
          flattenedChannelsWithMessages.push(...category.channels);
        }
      });
      setCategories(flattenedCategories);
      setChannels(flattenedChannelsWithMessages);
    } catch (err) {
      setError((err as Error).message);
      if ((err as Error).message === "Please log in again.")
        router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fungsi untuk menangani proses unggahan
  const handleAddToUploadQueue = (
    files: File[],
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

    // Proses setiap file secara asinkron
    newQueueItems.forEach(async (item) => {
      const promise = async () => {
        const content = await item.file.text();
        const payload: ApiDbSendMessageRequest = {
          data: { name: item.file.name, content },
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
        return res.json();
      };

      toast.promise(promise(), {
        loading: `Uploading ${item.file.name}...`,
        success: () => {
          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, status: "success" } : q,
            ),
          );
          handleDataChange(); // Refresh data di dashboard
          return `${item.file.name} uploaded successfully!`;
        },
        error: (err) => {
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

  const handleSelectCategory = (id: string) => setActiveCategoryId(id);
  const handleDataChange = () => setTimeout(fetchData, 500);

  const filteredChannels = channels.filter(
    (ch) => ch.categoryId === activeCategoryId,
  );
  const activeContainer = categories.find((cat) => cat.id === activeCategoryId);

  if (isLoading)
    return (
      <div className="bg-dark-shale text-off-white flex h-screen w-full items-center justify-center">
        <Loader2 className="text-teal-muted h-8 w-8 animate-spin" />
        <p className="ml-4">Loading Dashboard...</p>
      </div>
    );
  if (error)
    return (
      <div className="bg-dark-shale flex h-screen w-full items-center justify-center text-red-500">
        <p>Error: {error}</p>
      </div>
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
            categories={categories}
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
