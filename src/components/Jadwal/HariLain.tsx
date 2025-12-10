// src/components/Jadwal/HariLain.tsx
"use client";

import type { Jadwal, MataKuliah } from "@/types/jadwal-types";
import { cn } from "@/lib/cn";
import { CalendarDays } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HariLainProps {
  fullSchedule: Jadwal;
  selectedDay: string;
  onSelectDay: (day: string) => void;
}

// Helper: Menghitung jumlah matkul
const getCount = (jadwal: MataKuliah[]) => jadwal.length;

// --- DESIGN 1: CLASSIC CARD (Original Refined) ---
const StyleClassic = ({
  fullSchedule,
  selectedDay,
  onSelectDay,
}: HariLainProps) => (
  <div className="space-y-3">
    {Object.entries(fullSchedule).map(([hari, jadwal]) => {
      const isSelected = selectedDay === hari;
      return (
        <div
          key={hari}
          onClick={() => onSelectDay(hari)}
          className={cn(
            "cursor-pointer rounded-lg border p-4 transition-all duration-200",
            isSelected
              ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500 dark:border-teal-500 dark:bg-teal-950/20"
              : "bg-card border-border hover:border-muted-foreground/30 hover:bg-accent/50",
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <h3
              className={cn(
                "font-bold",
                isSelected
                  ? "text-teal-700 dark:text-teal-400"
                  : "text-foreground",
              )}
            >
              {hari}
            </h3>
            <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 font-mono text-xs">
              {getCount(jadwal)} Matkul
            </span>
          </div>
          <p className="text-muted-foreground line-clamp-1 text-xs">
            {jadwal.map((m) => m.matkul).join(", ")}
          </p>
        </div>
      );
    })}
  </div>
);

export function HariLain(props: HariLainProps) {
  return (
    <div className="bg-card/50 sticky top-24 flex h-full flex-col gap-6 rounded-xl border p-6">
      {/* HEADER & SWITCHER */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <CalendarDays className="size-5 text-teal-600" />
            Jadwal Seminggu
          </h2>
        </div>
      </div>

      {/* CONTENT AREA */}
      <ScrollArea className="-mr-3 flex-1 pr-3">
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <StyleClassic {...props} />
        </div>
      </ScrollArea>
    </div>
  );
}
