"use client";

import type { Jadwal } from "@/lib/jadwal-data";
import { HariLainCard } from "./HariLainCard";

interface HariLainProps {
  fullSchedule: Jadwal;
  selectedDay: string;
  onSelectDay: (day: string) => void;
}

export function HariLain({
  fullSchedule,
  selectedDay,
  onSelectDay,
}: HariLainProps) {
  return (
    <div className="bg-muted text-foreground h-full rounded-lg p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-bold">Jadwal Seminggu</h2>
      <div className="space-y-4">
        {Object.entries(fullSchedule).map(([hari, jadwal]) => (
          <HariLainCard
            key={hari}
            hari={hari}
            jadwal={jadwal}
            isSelected={selectedDay === hari}
            onSelectDay={onSelectDay}
          />
        ))}
      </div>
    </div>
  );
}
