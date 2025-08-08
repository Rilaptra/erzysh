"use client";

import type { MataKuliah } from "@/lib/jadwal-data";
import { JadwalCard } from "./JadwalCard";

interface HariIniProps {
  hari: string;
  jadwal: MataKuliah[] | undefined;
}

export function HariIni({ hari, jadwal }: HariIniProps) {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Jadwal Hari Ini: <span className="text-primary">{hari}</span>
      </h1>
      {jadwal && jadwal.length > 0 ? (
        <div className="space-y-6">
          {jadwal.map((matkul, index) => (
            <JadwalCard key={index} matkul={matkul} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <p className="text-xl text-gray-500">Hari ini tidak ada jadwal kuliah. Selamat beristirahat!</p>
        </div>
      )}
    </div>
  );
}
