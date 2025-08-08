"use client";

import type { Jadwal, MataKuliah } from "@/lib/jadwal-data";
import { HariIni } from "./HariIni";
import { HariLain } from "./HariLain";

interface JadwalDashboardProps {
  hariIni: string;
  jadwalHariIni: MataKuliah[] | undefined;
  jadwalLain: Jadwal;
}

export function JadwalDashboard({
  hariIni,
  jadwalHariIni,
  jadwalLain,
}: JadwalDashboardProps) {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2">
          <HariIni hari={hariIni} jadwal={jadwalHariIni} />
        </main>
        <aside>
          <HariLain jadwalLain={jadwalLain} />
        </aside>
      </div>
    </div>
  );
}
