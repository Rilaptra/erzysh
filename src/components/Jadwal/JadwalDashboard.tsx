"use client";

import { useState } from "react";
import type { Jadwal } from "@/lib/jadwal-data";
import { HariIni } from "./HariIni";
import { HariLain } from "./HariLain";

interface JadwalDashboardProps {
  initialDay: string;
  fullSchedule: Jadwal;
}

export function JadwalDashboard({
  initialDay,
  fullSchedule,
}: JadwalDashboardProps) {
  const [selectedDay, setSelectedDay] = useState(initialDay);

  const handleSelectDay = (day: string) => {
    setSelectedDay(day);
  };

  const selectedSchedule = fullSchedule[selectedDay];

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2">
          <HariIni hari={selectedDay} jadwal={selectedSchedule} />
        </main>
        <aside>
          <HariLain
            fullSchedule={fullSchedule}
            selectedDay={selectedDay}
            onSelectDay={handleSelectDay}
          />
        </aside>
      </div>
    </div>
  );
}
