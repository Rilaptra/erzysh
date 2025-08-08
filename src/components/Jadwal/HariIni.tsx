"use client";

import type { MataKuliah } from "@/lib/jadwal-data";
import { JadwalCard } from "./JadwalCard";

interface HariIniProps {
  hari: string;
  jadwal: MataKuliah[] | undefined;
}

export function HariIni({ hari, jadwal }: HariIniProps) {
  return (
    <div className="bg-card text-card-foreground rounded-xl p-6 shadow-inner">
      <h1 className="mb-6 text-3xl font-bold">
        Jadwal Hari: <span className="text-primary">{hari}</span>
      </h1>
      {jadwal && jadwal.length > 0 ? (
        <div className="space-y-6">
          {jadwal.map((matkul, idx) => (
            <JadwalCard key={idx} matkul={matkul} />
          ))}
        </div>
      ) : (
        <div className="border-border flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground text-xl">
            Tidak ada jadwal kuliah pada hari {hari}.
          </p>
        </div>
      )}
    </div>
  );
}
