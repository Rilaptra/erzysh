// src/components/DashboardPage/index.tsx
"use client";

import { useMemo } from "react";
import { Box, Database, File } from "lucide-react";
import type { ApiDbCategory, UserPayload } from "@/types";
import type { Tugas } from "@/types/tugas";
import { jadwalKuliah } from "@/lib/data/jadwal";

import { StatCard } from "./StatCard";
import { JadwalWidget } from "./JadwalWidget";
import { QuickAccess } from "./QuickAccess";
import { ApiStatusWidget } from "./ApiStatusWidget";
import { GitHubWidget } from "./GitHubWidget";
import { TugasWidget } from "./TugasWidget";

interface DashboardClientProps {
  user: UserPayload;
  initialData: ApiDbCategory[];
  tugasList: Tugas[];
}

export const DashboardClient = ({
  user,
  initialData,
  tugasList,
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
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Welcome back, <span className="text-teal-muted">{user.username}</span>!
      </h1>
      <p className="text-muted-foreground mt-2">
        Here's your dashboard overview for today.
      </p>

      {/* --- LAYOUT UTAMA BARU (RESPONSIVE) --- */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
        {/* KOLOM UTAMA (KIRI DI DESKTOP, ATAS DI MOBILE) */}
        <div className="space-y-8 lg:col-span-2">
          <TugasWidget tugasList={tugasList} />
          <JadwalWidget fullSchedule={jadwalKuliah} />
        </div>

        {/* SIDEBAR (KANAN DI DESKTOP, TENGAH DI MOBILE) */}
        <div className="mt-8 space-y-6 lg:col-span-1 lg:mt-0">
          <QuickAccess />
          <ApiStatusWidget />
          <GitHubWidget username="Rilaptra" />
        </div>
      </div>

      {/* --- BAGIAN STATISTIK (PALING BAWAH) --- */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold">Database Overview</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
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
      </div>
    </div>
  );
};
