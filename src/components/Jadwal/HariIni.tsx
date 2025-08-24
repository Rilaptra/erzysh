"use client";

import type { MataKuliah } from "@/lib/data/jadwal-types";
import { JadwalCard } from "./JadwalCard";
import { LiveClock } from "./LiveClock"; // <-- Impor komponen jam

interface HariIniProps {
  hari: string;
  jadwal: MataKuliah[] | undefined;
}

export function HariIni({ hari, jadwal }: HariIniProps) {
  return (
    <div className="bg-card text-card-foreground rounded-xl p-6 shadow-inner">
      {/* --- PERUBAHAN DI SINI --- */}
      <div className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">
          Jadwal Hari: <span className="text-primary">{hari}</span>
        </h1>
        {/* Panggil komponen jam di sini */}
        <LiveClock />
      </div>
      {/* --- AKHIR PERUBAHAN --- */}

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
