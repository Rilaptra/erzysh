// src/components/Jadwal/HariIni.tsx
"use client";

import type { MataKuliah } from "@/types/jadwal-types";
import { LiveClock } from "./LiveClock";
import { useAcademicEvents } from "@/lib/hooks/useAcademicEvents";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Sparkles } from "lucide-react";

interface HariIniProps {
  hari: string;
  jadwal: MataKuliah[] | undefined;
}

// --- DESIGN 1: REFINED TICKET (Fixed Layout & Cool Animation) ---
const DesignTicket = ({ data }: { data: MataKuliah[] }) => (
  <div className="space-y-5">
    {data.map((matkul, idx) => (
      <div
        key={idx}
        className="group border-border bg-card relative flex w-full overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/10 dark:hover:shadow-teal-900/20"
      >
        {/* === KIRI: STUB (Waktu) === */}
        <div className="border-muted-foreground/20 bg-muted/30 relative flex w-32 shrink-0 flex-col items-center justify-center border-r-2 border-dashed p-4 text-center transition-colors group-hover:bg-teal-500/5">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Mulai
            </span>
            <span className="text-foreground font-mono text-2xl font-black">
              {matkul.jam_pelajaran.mulai}
            </span>
          </div>
          <div className="bg-border/50 my-2 h-px w-8" />
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground font-mono text-lg font-medium">
              {matkul.jam_pelajaran.selesai}
            </span>
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Selesai
            </span>
          </div>

          {/* Cutout Circles (Atas & Bawah garis putus-putus) */}
          <div className="border-border bg-background absolute -top-3 -right-3 h-6 w-6 rounded-full border" />
          <div className="border-border bg-background absolute -right-3 -bottom-3 h-6 w-6 rounded-full border" />
        </div>

        {/* === KANAN: BODY (Info Matkul) === */}
        <div className="relative flex flex-1 flex-col justify-center p-5">
          {/* Animasi Kilatan Cahaya (Sheen Effect) */}
          <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

          <div className="relative z-10">
            <div className="mb-1 flex items-center justify-between">
              <Badge
                variant="outline"
                className="border-teal-500/30 bg-teal-500/5 text-[10px] text-teal-600 dark:text-teal-400"
              >
                {matkul.sks} SKS
              </Badge>
              <div className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                <MapPin className="size-3" />
                {matkul.ruang_kelas.id_ruang}
              </div>
            </div>

            <h3 className="text-foreground text-xl leading-tight font-bold transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-400">
              {matkul.matkul}
            </h3>

            <div className="mt-4 flex items-center gap-3 border-t border-dashed pt-3">
              <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                <User className="text-muted-foreground size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">
                  Dosen Pengampu
                </span>
                <span className="line-clamp-1 text-sm font-medium">
                  {matkul.dosen.full_name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export function HariIni({ hari, jadwal }: HariIniProps) {
  const today = new Date();
  const academicEvents = useAcademicEvents(today);

  return (
    <div className="bg-card text-card-foreground relative min-h-[500px] rounded-xl border p-6 shadow-sm">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
              Jadwal{" "}
              <span className="text-teal-600 dark:text-teal-400">{hari}</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm font-medium">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <LiveClock />
        </div>
      </div>

      {/* EVENTS ALERT */}
      {academicEvents.length > 0 && (
        <div className="animate-in slide-in-from-top-2 fade-in mb-8 rounded-xl border border-blue-200 bg-blue-50 p-4 duration-500 dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <Calendar className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200">
                Event Akademik Hari Ini
              </h3>
              <div className="mt-1 space-y-1">
                {academicEvents.map((event) => (
                  <p
                    key={event.nomor}
                    className="text-xs leading-relaxed text-blue-600 dark:text-blue-300"
                  >
                    <span className="font-semibold">• {event.kegiatan}</span>:{" "}
                    {event.keterangan}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      {jadwal && jadwal.length > 0 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          <DesignTicket data={jadwal} />
        </div>
      ) : (
        <div className="bg-muted/10 flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed text-center">
          <div className="bg-muted mb-3 animate-bounce rounded-full p-4">
            <Sparkles className="size-8 text-yellow-500" />
          </div>
          <h3 className="text-lg font-bold">Hari Libur!</h3>
          <p className="text-muted-foreground mx-auto max-w-xs text-sm">
            Tidak ada jadwal kuliah hari ini. Waktunya istirahat atau ngoding
            santai! ☕
          </p>
        </div>
      )}
    </div>
  );
}
