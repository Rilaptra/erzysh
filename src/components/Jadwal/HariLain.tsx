"use client";

import type { Jadwal } from "@/lib/jadwal-data";
import { HariLainCard } from "./HariLainCard";

interface HariLainProps {
  fullSchedule: Jadwal;
  selectedDay: string;
  onSelectDay: (day: string) => void;
}

export function HariLain({ fullSchedule, selectedDay, onSelectDay }: HariLainProps) {
  return (
    <div className="p-6 bg-gray-50 rounded-lg h-full">
      <h2 className="text-2xl font-bold mb-4">Jadwal Seminggu</h2>
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
