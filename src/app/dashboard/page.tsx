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
import type {
  UserPayload,
  ApiDbGetAllStructuredDataResponse,
  ApiDbCategory,
  ApiDbCategoryChannel,
  DiscordCategory,
} from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const container = useRef(null);

  // States
  const [user, setUser] = useState<UserPayload | null>(null);
  const [categories, setCategories] = useState<DiscordCategory[]>([]);
  const [channels, setChannels] = useState<ApiDbCategoryChannel[]>([]); // Diubah untuk menyimpan data lengkap channel
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fungsi untuk fetch dan proses data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Ambil data user
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) throw new Error("Please log in again.");
      const userData = await userRes.json();
      setUser(userData);

      // 2. Ambil data server dari /api/database
      const serverDataRes = await fetch("/api/database");
      if (!serverDataRes.ok) throw new Error("Failed to fetch server data.");
      const serverData: ApiDbGetAllStructuredDataResponse =
        await serverDataRes.json();

      // 3. Proses data API menjadi struktur yang dibutuhkan frontend
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
          // Menyimpan seluruh objek channel, termasuk array 'messages' di dalamnya
          flattenedChannelsWithMessages.push(...category.channels);
        }
      });

      setCategories(flattenedCategories);
      setChannels(flattenedChannelsWithMessages);
    } catch (err) {
      setError((err as Error).message);
      if ((err as Error).message === "Please log in again.") {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectCategory = (id: string) => {
    setActiveCategoryId(id);
  };

  // Filter channels berdasarkan kategori aktif
  const filteredChannels = channels.filter(
    (ch) => ch.categoryId === activeCategoryId,
  );

  if (isLoading) {
    return (
      <div className="bg-dark-shale text-off-white flex h-screen w-full items-center justify-center">
        <Loader2 className="text-teal-muted h-8 w-8 animate-spin" />
        <p className="ml-4">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-shale flex h-screen w-full items-center justify-center text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

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
        <DashboardHeader user={user} />
        <div className="flex flex-1 overflow-hidden">
          <CategorySidebar
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
            onCategoryCreated={fetchData}
            onCategoryDeleted={fetchData}
          />
          <ChannelView
            channels={filteredChannels}
            activeCategoryId={activeCategoryId}
            // Menggunakan callback yang sama untuk me-refresh semua data
            onDataChanged={fetchData}
            onChannelCreated={fetchData}
            onChannelDeleted={fetchData}
          />
        </div>
      </div>
    </div>
  );
}
