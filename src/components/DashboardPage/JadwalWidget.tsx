// src/components/DashboardPage/JadwalWidget.tsx
"use client";

import { JadwalCard } from "@/components/Jadwal/JadwalCard";
import { LiveClock } from "@/components/Jadwal/LiveClock";
import type { Jadwal, MataKuliah } from "@/lib/data/jadwal-types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

interface JadwalWidgetProps {
  fullSchedule: Jadwal;
}

export const JadwalWidget = ({ fullSchedule }: JadwalWidgetProps) => {
  const [todaySchedule, setTodaySchedule] = useState<MataKuliah[]>([]);
  const [todayString, setTodayString] = useState("");

  useEffect(() => {
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const todayIndex = new Date().getDay();
    const currentDay = days[todayIndex];
    setTodayString(currentDay);
    setTodaySchedule(fullSchedule[currentDay] || []);
  }, [fullSchedule]);

  return (
    <div className="bg-gunmetal/30 border-gunmetal/50 rounded-lg p-6 backdrop-blur-sm">
      <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-off-white text-xl font-bold">
          Jadwal Hari Ini ({todayString})
        </h3>
        <LiveClock />
      </div>
      <div className="max-h-96 space-y-4 overflow-y-auto pr-2">
        {todaySchedule.length > 0 ? (
          todaySchedule.map((matkul, idx) => (
            <JadwalCard key={idx} matkul={matkul} />
          ))
        ) : (
          <div className="border-gunmetal/80 flex h-40 items-center justify-center rounded-md border-2 border-dashed">
            <p className="text-off-white/70">
              Hore, tidak ada jadwal kuliah hari ini! 🎉
            </p>
          </div>
        )}
      </div>
      <Link href="/kuliah/jadwal">
        <Button
          variant="outline"
          className="border-teal-muted/20 text-teal-muted hover:bg-teal-muted/10 hover:text-teal-muted mt-4 w-full"
        >
          Lihat Jadwal Lengkap <ArrowRight className="ml-2 size-4" />
        </Button>
      </Link>
    </div>
  );
};
