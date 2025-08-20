"use client";

import { useState } from "react";
import type { Jadwal } from "@/lib/data/jadwal-types";
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

  const selectedSchedule = fullSchedule[selectedDay];

  return (
    <div className="max-w-full px-4 py-6 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <main className="lg:col-span-2">
          <HariIni hari={selectedDay} jadwal={selectedSchedule} />
        </main>
        <aside>
          <HariLain
            fullSchedule={fullSchedule}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        </aside>
      </div>
    </div>
  );
}
