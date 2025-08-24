// src/components/DashboardPage/index.tsx
"use client";

import { useMemo } from "react";
import { Box, File, Database } from "lucide-react";
import type { ApiDbCategory, UserPayload } from "@/types";
import { jadwalKuliah } from "@/lib/data/jadwal";

import { StatCard } from "./StatCard";
import { JadwalWidget } from "./JadwalWidget";
import { QuickAccess } from "./QuickAccess";
import { ApiStatusWidget } from "./ApiStatusWidget";
import { GitHubWidget } from "./GitHubWidget";

interface DashboardClientProps {
  user: UserPayload;
  initialData: ApiDbCategory[];
}

export const DashboardClient = ({
  user,
  initialData,
}: DashboardClientProps) => {
  const stats = useMemo(() => {
    const totalContainers = initialData.length;
    let totalBoxes = 0;
    let totalCollections = 0;

    initialData.forEach((container) => {
      totalBoxes += container.boxes.length;
      container.boxes.forEach((box) => {
        totalCollections += box.collections.length;
      });
    });

    return { totalContainers, totalBoxes, totalCollections };
  }, [initialData]);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-off-white text-3xl font-bold tracking-tight sm:text-4xl">
        Welcome back, <span className="text-teal-muted">{user.username}</span>!
      </h1>
      <p className="text-off-white/70 mt-2">
        Here's your dashboard overview for today.
      </p>

      {/* Grid Utama */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Kolom Kiri (Konten Utama) */}
        <div className="space-y-8 lg:col-span-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <StatCard
              title="Total Containers"
              value={stats.totalContainers}
              icon={<Database />}
            />
            <StatCard
              title="Total Boxes"
              value={stats.totalBoxes}
              icon={<Box />}
            />
            <StatCard
              title="Total Collections"
              value={stats.totalCollections}
              icon={<File />}
            />
          </div>

          {/* Jadwal Widget */}
          <JadwalWidget fullSchedule={jadwalKuliah} />
        </div>

        {/* Kolom Kanan (Sidebar) */}
        <div className="space-y-6 lg:col-span-4">
          <QuickAccess />
          <ApiStatusWidget />
          {/* Ganti "Eryzsh" dengan username GitHub lo */}
          <GitHubWidget username="Rilaptra" />
        </div>
      </div>
    </div>
  );
};
