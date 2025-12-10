// src/components/Jadwal/KalenderAkademikView.tsx
"use client";

import { useState, useMemo } from "react";
import kalenderData from "@/lib/data/kalender-akademik.json";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Info, Search, Eye, EyeOff, CalendarX, Filter, X } from "lucide-react";
import {
  format,
  parseISO,
  isBefore,
  startOfDay,
  isWithinInterval,
} from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/cn";

// Tipe Data Helper
type EventData = (typeof kalenderData.kalender_akademik.semester_gasal)[0];

export function KalenderAkademikView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false); // Default: Sembunyikan yang lalu

  const today = startOfDay(new Date());

  // --- LOGIC FORMAT TANGGAL ---
  const formatDateRange = (start: string, end: string) => {
    const dStart = parseISO(start);
    const dEnd = parseISO(end);

    if (start === end) {
      return format(dStart, "dd MMMM yyyy", { locale: id });
    }

    if (
      dStart.getMonth() === dEnd.getMonth() &&
      dStart.getFullYear() === dEnd.getFullYear()
    ) {
      return `${format(dStart, "dd")} - ${format(dEnd, "dd MMMM yyyy", { locale: id })}`;
    }

    return `${format(dStart, "dd MMM")} - ${format(dEnd, "dd MMM yyyy", { locale: id })}`;
  };

  // --- LOGIC FILTERING (UPGRADED) ---
  const filterEvents = (events: EventData[]) => {
    return events.filter((event) => {
      const startDate = parseISO(event.tanggal_mulai);
      const endDate = parseISO(event.tanggal_selesai);

      // 1. Filter History (Lewat Tanggal Selesai)
      const isPast = isBefore(endDate, today);
      if (!showHistory && isPast) {
        return false;
      }

      // 2. Filter Search (Case Insensitive + Month Name Support)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();

        // Buat string tanggal lengkap (misal: "17 agustus 2025") untuk pencarian bulan
        const startString = format(startDate, "dd MMMM yyyy", {
          locale: id,
        }).toLowerCase();
        const endString = format(endDate, "dd MMMM yyyy", {
          locale: id,
        }).toLowerCase();

        const textMatch =
          event.kegiatan.toLowerCase().includes(query) ||
          (event.keterangan &&
            event.keterangan.toLowerCase().includes(query)) ||
          event.tanggal_mulai.includes(query) || // Cari "2025-08"
          startString.includes(query) || // Cari "Agustus"
          endString.includes(query); // Cari "September"

        if (!textMatch) return false;
      }

      return true;
    });
  };

  const filteredGasal = useMemo(
    () => filterEvents(kalenderData.kalender_akademik.semester_gasal),
    [searchQuery, showHistory],
  );
  const filteredGenap = useMemo(
    () => filterEvents(kalenderData.kalender_akademik.semester_genap),
    [searchQuery, showHistory],
  );

  // --- RENDER TIMELINE COMPONENT ---
  const TimelineList = ({ events }: { events: EventData[] }) => {
    if (events.length === 0) {
      return (
        <div className="bg-muted/20 animate-in fade-in flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center">
          <div className="bg-muted mb-3 rounded-full p-3">
            <CalendarX className="text-muted-foreground size-6" />
          </div>
          <p className="text-sm font-medium">Tidak ada kegiatan ditemukan.</p>
          <p className="text-muted-foreground mt-1 max-w-[250px] text-xs">
            {searchQuery
              ? `Tidak ada hasil untuk "${searchQuery}".`
              : "Semua kegiatan sudah lewat. Coba tampilkan riwayat."}
          </p>
          {searchQuery && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-2 h-auto p-0 text-xs"
            >
              Hapus pencarian
            </Button>
          )}
        </div>
      );
    }

    return (
      // Mobile: ml-1, sm:ml-3 untuk margin kiri timeline lebih rapat di HP
      <div className="border-muted relative ml-1 space-y-8 border-l-2 pb-4 sm:ml-3">
        {events.map((event) => {
          const startDate = parseISO(event.tanggal_mulai);
          const endDate = parseISO(event.tanggal_selesai);

          const isPast = isBefore(endDate, today);
          const isActive = isWithinInterval(today, {
            start: startDate,
            end: endDate,
          });
          const isFuture = !isPast && !isActive;

          return (
            // Mobile: pl-4, sm:pl-8 untuk padding konten
            <div
              key={event.nomor}
              className={cn(
                "group relative pl-5 transition-all duration-300 sm:pl-8",
                isPast &&
                  "opacity-60 grayscale hover:opacity-100 hover:grayscale-0",
              )}
            >
              {/* Timeline Indicator */}
              <span
                className={cn(
                  "border-background absolute top-1.5 -left-[7px] h-3.5 w-3.5 rounded-full border-2 transition-all sm:-left-[9px] sm:h-4 sm:w-4 sm:border-4",
                  isActive
                    ? "scale-110 bg-teal-500 ring-4 ring-teal-500/20"
                    : isFuture
                      ? "bg-primary border-muted-foreground"
                      : "bg-muted-foreground",
                )}
              />

              <div className="flex flex-col gap-1.5">
                {/* Date Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5 font-mono text-[10px] font-medium sm:text-xs",
                      isActive
                        ? "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                        : "bg-muted/50 border-border text-muted-foreground",
                    )}
                  >
                    {formatDateRange(
                      event.tanggal_mulai,
                      event.tanggal_selesai,
                    )}
                  </span>

                  {isActive && (
                    <Badge className="h-5 bg-teal-500 text-[10px] hover:bg-teal-600">
                      Sedang Berlangsung
                    </Badge>
                  )}
                  {isPast && (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground h-5 text-[10px]"
                    >
                      Selesai
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="hover:bg-muted/30 -ml-2 rounded-lg p-2 transition-colors">
                  <h3
                    className={cn(
                      "text-sm leading-snug font-bold sm:text-base",
                      isPast && "text-muted-foreground decoration-slate-400",
                    )}
                  >
                    {event.kegiatan}
                  </h3>

                  {event.keterangan && (
                    <div className="text-muted-foreground mt-1.5 flex items-start gap-1.5 text-xs sm:text-sm">
                      <Info className="text-primary/60 mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="leading-relaxed">
                        {event.keterangan}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION (Mobile: Stacked, Desktop: Row) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Kalender Akademik
          </h2>
          <p className="text-muted-foreground text-sm">
            Tahun Akademik {kalenderData.tahun_akademik}
          </p>
        </div>

        {/* SEARCH & CONTROL BAR */}
        <div className="flex w-full flex-col gap-3 lg:w-auto">
          <div className="flex w-full gap-2">
            <div className="relative flex-1 lg:w-64">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Cari kegiatan, bulan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background h-10 pr-8 pl-9 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              variant={showHistory ? "secondary" : "outline"}
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "h-10 w-10 shrink-0",
                showHistory &&
                  "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
              )}
              title={
                showHistory
                  ? "Sembunyikan kegiatan yang lalu"
                  : "Tampilkan riwayat kegiatan"
              }
            >
              {showHistory ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* FILTER STATUS BAR */}
      <div className="text-muted-foreground bg-muted/30 border-border/50 flex flex-wrap items-center gap-2 rounded-lg border p-2.5 text-xs">
        <Filter className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium">Filter:</span>
        <div className="flex flex-wrap gap-2">
          {!showHistory && (
            <Badge
              variant="secondary"
              className="bg-background h-5 border px-2 text-[10px] font-normal"
            >
              Sembunyikan yg Lalu
            </Badge>
          )}
          {searchQuery && (
            <Badge
              variant="secondary"
              className="bg-background h-5 border px-2 text-[10px] font-normal"
            >
              Cari: "{searchQuery}"
            </Badge>
          )}
          {showHistory && !searchQuery && <span>Menampilkan semua</span>}
        </div>
      </div>

      {/* TABS & CONTENT */}
      <Tabs defaultValue="gasal" className="w-full">
        {/* Mobile: Grid 2 kolom penuh */}
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="gasal">
            Gasal ({filteredGasal.length})
          </TabsTrigger>
          <TabsTrigger value="genap">
            Genap ({filteredGenap.length})
          </TabsTrigger>
        </TabsList>

        <div className="bg-card mt-4 min-h-[400px] rounded-xl border p-4 shadow-sm sm:mt-6 sm:p-6">
          <TabsContent
            value="gasal"
            className="mt-0 focus-visible:outline-none"
          >
            <TimelineList events={filteredGasal} />
          </TabsContent>
          <TabsContent
            value="genap"
            className="mt-0 focus-visible:outline-none"
          >
            <TimelineList events={filteredGenap} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
