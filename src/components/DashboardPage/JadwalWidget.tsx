// src/components/DashboardPage/JadwalWidget.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveClock } from "@/components/Jadwal/LiveClock";
import { useAcademicEvents } from "@/lib/hooks/useAcademicEvents";
import type { Jadwal, MataKuliah } from "@/types/jadwal-types";
import { cn } from "@/lib/cn";

interface JadwalWidgetProps {
  fullSchedule: Jadwal;
}

export const JadwalWidget = ({ fullSchedule }: JadwalWidgetProps) => {
  const [todaySchedule, setTodaySchedule] = useState<MataKuliah[]>([]);
  const [todayString, setTodayString] = useState("");
  const today = new Date();
  const academicEvents = useAcademicEvents(today);

  useEffect(() => {
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const currentDay = days[new Date().getDay()];
    setTodayString(currentDay);
    setTodaySchedule(fullSchedule[currentDay] || []);
  }, [fullSchedule]);

  return (
    <div className="bg-card/40 flex h-full flex-col p-6 backdrop-blur-md">
      {/* HEADER: Judul & Jam */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Calendar className="h-5 w-5 text-teal-500" />
            Jadwal {todayString}
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        {/* Jam dikecilkan dikit biar proporsional */}
        <div className="origin-top-right scale-90">
          <LiveClock />
        </div>
      </div>

      {/* SECTION: Event Akademik (Pemisah Visual) */}
      {academicEvents.length > 0 && (
        <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Sparkles className="h-3.5 w-3.5" /> {academicEvents[0].kegiatan}
          </p>
        </div>
      )}

      {/* SECTION: Timeline Content */}
      <div className="custom-scrollbar flex-1 overflow-y-auto pr-2">
        {todaySchedule.length > 0 ? (
          // Container Timeline Utama: Border kiri ditaruh di sini biar lurus terus
          <div className="border-border/60 relative ml-2.5 space-y-8 border-l-2 py-1">
            {todaySchedule.map((matkul, idx) => (
              <div key={idx} className="relative pl-6">
                {/* 1. Indikator Dot (Menumpuk di atas garis border) */}
                <span
                  className={cn(
                    "border-background absolute top-3 -left-[9px] h-4 w-4 rounded-full border-4 transition-all duration-500",
                    idx === 0
                      ? "scale-110 bg-teal-500 ring-4 ring-teal-500/20" // Item pertama lebih mencolok
                      : "bg-muted-foreground/30",
                  )}
                />

                {/* 2. Kartu Konten */}
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md",
                    idx === 0
                      ? "border-teal-500/30 bg-teal-500/5" // Background halus untuk item aktif
                      : "bg-card/50 border-border/50 hover:bg-card hover:border-border",
                  )}
                >
                  {/* Badge "Now" jika item pertama */}
                  {idx === 0 && (
                    <Badge className="absolute top-3 right-3 h-5 bg-teal-500 px-2 text-[10px] hover:bg-teal-600">
                      Next Class
                    </Badge>
                  )}

                  {/* Judul Mata Kuliah */}
                  <h4
                    className={cn(
                      "mb-2 line-clamp-1 pr-16 text-base font-bold", // pr-16 biar gak nabrak badge
                      idx === 0 ? "text-teal-500" : "text-foreground",
                    )}
                  >
                    {matkul.matkul}
                  </h4>

                  {/* Detail Waktu & Ruang */}
                  <div className="text-muted-foreground grid grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold tracking-wider uppercase opacity-70">
                        Waktu
                      </span>
                      <div className="text-foreground flex items-center gap-1.5 font-mono text-sm font-medium">
                        <Clock className="h-3.5 w-3.5 text-teal-500" />
                        {matkul.jam_pelajaran.mulai}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold tracking-wider uppercase opacity-70">
                        Ruang
                      </span>
                      <div className="text-foreground flex items-center gap-1.5 text-sm font-medium">
                        <MapPin className="h-3.5 w-3.5 text-teal-500" />
                        {matkul.ruang_kelas.id_ruang}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
            <div className="bg-muted/50 mb-3 rounded-full p-4">
              <Calendar className="text-muted-foreground h-8 w-8" />
            </div>
            <p className="text-sm font-medium">Jadwal Kosong</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Hari ini bebas kuliah!
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="border-border/50 mt-4 border-t pt-4">
        <Link href="/kuliah/jadwal">
          <Button
            variant="ghost"
            size="sm"
            className="group w-full justify-between text-xs transition-colors hover:bg-teal-500/10 hover:text-teal-500"
          >
            Lihat Jadwal Lengkap
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
