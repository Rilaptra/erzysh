"use client";

import type { MataKuliah } from "@/lib/data/jadwal-types";
import { JadwalCard } from "./JadwalCard";
import { LiveClock } from "./LiveClock"; // <-- Impor komponen jam

import { useAcademicEvents } from "@/lib/hooks/useAcademicEvents";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

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

      {/* --- TAMPILKAN EVENT AKADEMIK JIKA ADA --- */}
      {academicEvents.length > 0 && (
        <div className="mb-6 space-y-2 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:border-blue-400 dark:bg-blue-900/20">
          <h3 className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
            <Calendar className="size-4" /> Event Akademik Hari Ini
          </h3>
          {academicEvents.map((event) => (
            <div key={event.nomor} className="text-sm">
              <Badge variant="secondary" className="mr-2">
                {event.kegiatan}
              </Badge>
              <span className="text-muted-foreground">{event.keterangan}</span>
            </div>
          ))}
        </div>
      )}

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
