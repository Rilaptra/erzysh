"use client";

import type { Jadwal } from "@/lib/jadwal-data";
import { HariLainCard } from "./HariLainCard";

interface HariLainProps {
  jadwalLain: Jadwal;
}

export function HariLain({ jadwalLain }: HariLainProps) {
  return (
    <div className="p-6 bg-gray-50 rounded-lg h-full">
      <h2 className="text-2xl font-bold mb-4">Jadwal Hari Lain</h2>
      <div className="space-y-4">
        {Object.entries(jadwalLain).map(([hari, jadwal]) => (
          <HariLainCard key={hari} hari={hari} jadwal={jadwal} />
        ))}
      </div>
    </div>
  );
}
