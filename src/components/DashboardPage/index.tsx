// src/components/DashboardPage/index.tsx
"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { Box, Cloud, Database, File } from "lucide-react";
import type { ApiDbCategory, UserPayload } from "@/types";
import type { Tugas } from "@/types/tugas";
import { jadwalKuliah } from "@/types/jadwal";
import gsap from "gsap";

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

// Helper untuk ucapan waktu
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
};

export const DashboardClient = ({
  user,
  initialData,
  tugasList,
}: DashboardClientProps) => {
  const containerRef = useRef(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  // Animasi Masuk
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set(".dashboard-item", { y: 30, autoAlpha: 0 });
      gsap.set(".header-text", { x: -20, autoAlpha: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(".header-text", {
        x: 0,
        autoAlpha: 1,
        duration: 0.8,
        stagger: 0.1,
      }).to(
        ".dashboard-item",
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.6,
          stagger: 0.08,
        },
        "-=0.4",
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

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
    <div
      ref={containerRef}
      className="bg-background min-h-screen overflow-hidden p-4 sm:p-6 lg:p-8"
    >
      {/* Background Ambience */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl space-y-8">
        {/* HEADER SECTION */}
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="header-text text-muted-foreground mb-1 text-sm font-medium tracking-wider uppercase">
              Dashboard Overview
            </p>
            <h1 className="header-text text-foreground text-3xl font-black tracking-tight md:text-4xl">
              {greeting},{" "}
              <span className="bg-linear-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">
                {user.username}
              </span>{" "}
              👋
            </h1>
          </div>
          <div className="header-text text-muted-foreground bg-muted/30 border-border/50 flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
            <Cloud className="h-4 w-4" />
            <span>Magelang, Indonesia</span>
          </div>
        </header>

        {/* BENTO GRID LAYOUT */}
        <div className="grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* ROW 1: STATS (Full Width on Mobile, distributed on Desktop) */}
          <div className="dashboard-item col-span-1 lg:col-span-1">
            <StatCard
              title="Database Containers"
              value={stats.totalContainers}
              icon={<Database className="h-6 w-6" />}
              className="h-full border-blue-500/20 bg-linear-to-br from-blue-500/10 to-transparent"
            />
          </div>
          <div className="dashboard-item col-span-1 lg:col-span-1">
            <StatCard
              title="Active Boxes"
              value={stats.totalBoxes}
              icon={<Box className="h-6 w-6" />}
              className="h-full border-teal-500/20 bg-linear-to-br from-teal-500/10 to-transparent"
            />
          </div>
          <div className="dashboard-item col-span-1 lg:col-span-2">
            <StatCard
              title="Total Collections Stored"
              value={stats.totalCollections}
              icon={<File className="h-6 w-6" />}
              className="h-full border-purple-500/20 bg-linear-to-br from-purple-500/10 to-transparent"
            />
          </div>

          {/* ROW 2: MAIN CONTENT (Jadwal & Tugas) */}
          {/* Jadwal - Tall Item */}
          <div className="dashboard-item col-span-1 h-full lg:col-span-2 lg:row-span-2">
            <div className="border-border/50 bg-card/30 h-full overflow-hidden rounded-2xl border p-1 backdrop-blur-sm">
              <JadwalWidget fullSchedule={jadwalKuliah} />
            </div>
          </div>

          {/* Tugas - Wide Item */}
          <div className="dashboard-item col-span-1 lg:col-span-2">
            <div className="border-border/50 bg-card/30 overflow-hidden rounded-2xl border p-1 backdrop-blur-sm">
              <TugasWidget tugasList={tugasList} />
            </div>
          </div>

          {/* ROW 3: UTILITIES & EXTRAS */}
          <div className="dashboard-item col-span-1">
            <QuickAccess />
          </div>

          <div className="dashboard-item col-span-1 space-y-4">
            <ApiStatusWidget />
            <GitHubWidget username="Rilaptra" />
          </div>
        </div>
      </div>
    </div>
  );
};
