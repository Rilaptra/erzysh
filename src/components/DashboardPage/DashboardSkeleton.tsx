"use client";

import { cn } from "@/lib/cn";

// Komponen kotak abu-abu yang kedap-kedip
const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("bg-muted/50 animate-pulse rounded-2xl", className)} />
);

export function DashboardSkeleton() {
  return (
    <div className="bg-background min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* HEADER SKELETON */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-2">
            <div className="bg-muted/50 h-4 w-32 animate-pulse rounded-full" />
            <div className="bg-muted/50 h-10 w-64 animate-pulse rounded-lg" />
          </div>
          <div className="bg-muted/50 h-9 w-40 animate-pulse rounded-full" />
        </div>

        {/* BENTO GRID SKELETON */}
        <div className="grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Stats Row */}
          <SkeletonCard className="col-span-1 h-32 lg:col-span-1" />
          <SkeletonCard className="col-span-1 h-32 lg:col-span-1" />
          <SkeletonCard className="col-span-1 h-32 lg:col-span-2" />

          {/* Main Content */}
          {/* Jadwal */}
          <SkeletonCard className="col-span-1 h-96 lg:col-span-2 lg:row-span-2" />

          {/* Tugas */}
          <SkeletonCard className="col-span-1 h-48 lg:col-span-2" />

          {/* Quick Access & Status */}
          <SkeletonCard className="col-span-1 h-48" />
          <div className="col-span-1 space-y-4">
            <SkeletonCard className="h-20" />
            <SkeletonCard className="h-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
