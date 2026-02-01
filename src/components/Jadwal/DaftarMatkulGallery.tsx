"use client";

import { CalendarDays, MapPin, Search, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import rawData from "@/lib/data/daftar-matkul-dosen.json";

// --- TIPE DATA ---
interface JadwalSipil {
  quota: number;
  kode: string;
  mataKuliah: string;
  sks: number;
  dosen: string;
  kelas: string;
  hari: string;
  mulai: string;
  selesai: string;
  ruang: string;
}

export function DaftarMatkulGallery() {
  const [searchQuery, setSearchQuery] = useState("");

  // --- LOGIC SEARCH / FILTERING ---
  const filteredData = useMemo(() => {
    if (!searchQuery) return rawData;
    const lowerQuery = searchQuery.toLowerCase();

    return rawData.filter(
      (item) =>
        item.mataKuliah.toLowerCase().includes(lowerQuery) ||
        item.dosen.toLowerCase().includes(lowerQuery) ||
        item.ruang.toLowerCase().includes(lowerQuery) ||
        item.hari.toLowerCase().includes(lowerQuery) ||
        item.kelas.toLowerCase().includes(lowerQuery) ||
        item.kode.toLowerCase().includes(lowerQuery),
    );
  }, [searchQuery]);

  return (
    <div className="w-full space-y-6 py-8">
      {/* --- CONTROLLER (CAROUSEL NAV & SEARCH) --- */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/30 p-4 backdrop-blur-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Daftar Mata Kuliah Sipil</h2>
            <p className="text-sm text-muted-foreground">
              Semester Genap 2025/2026 • {filteredData.length} Matkul Ditemukan
            </p>
          </div>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari Dosen, Matkul, Ruang, Hari..."
            className="pl-10 pr-10 bg-background/50 border-border/50 focus-visible:ring-teal-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* --- DESIGN RENDERER --- */}
      <div className="min-h-[500px]">
        {filteredData.length > 0 ? (
          <DesignHybridGlassCompact data={filteredData} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">Tidak ada hasil ditemukan</p>
            <p className="text-sm text-muted-foreground">Coba kata kunci lain untuk "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 🎨 DESIGN NEW: HYBRID GLASS COMPACT (Requested!)
// Gabungan Modern Glass (Aesthetic) + Compact Grid (Dense Info)
// ----------------------------------------------------------------------
const DesignHybridGlassCompact = ({ data }: { data: JadwalSipil[] }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {data.map((item, idx) => (
      <div
        key={idx}
        className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/30 hover:bg-white/10 hover:shadow-lg dark:bg-black/20">
        {/* Decorative Glow */}
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-500/10 blur-2xl transition-all group-hover:bg-teal-500/20" />

        {/* Header: Kode & Kelas */}
        <div className="mb-3 flex items-start justify-between">
          <Badge
            variant="outline"
            className="border-teal-500/30 bg-teal-500/10 text-[10px] font-bold text-teal-600 dark:text-teal-400">
            Kelas {item.kelas}
          </Badge>
          <span className="font-mono text-[10px] text-muted-foreground opacity-70">{item.kode}</span>
        </div>

        {/* Content: Nama Matkul */}
        <div className="mb-4">
          <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-teal-500">
            {item.mataKuliah}
          </h3>
          <p className="mt-1 text-[10px] font-medium text-muted-foreground">{item.sks} SKS</p>
        </div>

        {/* Footer: Details (Compact Grid) */}
        <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3 text-[11px]">
          <div className="col-span-1 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground opacity-60">Waktu</span>
            <div className="flex items-center gap-1.5 font-medium">
              <CalendarDays className="h-3 w-3 text-blue-400" />
              <span className="truncate">
                {item.hari}, {item.mulai.slice(0, 5)}
              </span>
            </div>
          </div>

          <div className="col-span-1 flex flex-col gap-0.5 text-right">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground opacity-60">Ruang</span>
            <div className="flex items-center justify-end gap-1.5 font-medium">
              <span className="truncate">{item.ruang.split("(")[0]}</span>
              <MapPin className="h-3 w-3 text-rose-400" />
            </div>
          </div>

          <div className="col-span-2 mt-1 flex items-center gap-2 rounded-md bg-white/5 p-1.5 dark:bg-black/20">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/20">
              <Users className="h-3 w-3 text-teal-500" />
            </div>
            <span className="truncate font-medium opacity-90">{item.dosen}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
);
