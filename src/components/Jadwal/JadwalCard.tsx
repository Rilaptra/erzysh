// src/components/Jadwal/JadwalCard.tsx
"use client";

import type { MataKuliah } from "@/types/jadwal-types"; // <-- Diubah
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";

interface JadwalCardProps {
  matkul: MataKuliah;
}

export function JadwalCard({ matkul }: JadwalCardProps) {
  return (
    <Card className="border-border bg-card text-card-foreground w-full rounded-lg border shadow-sm transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="px-4 pb-2">
        <CardTitle className="text-lg leading-snug font-semibold">
          {matkul.matkul}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 px-4 py-2 text-sm">
        <div className="text-muted-foreground flex items-start gap-2">
          <Clock className="mt-[2px] h-4 w-4 shrink-0" />
          <div>
            {matkul.jam_pelajaran.mulai} - {matkul.jam_pelajaran.selesai}
          </div>
        </div>

        <div className="text-muted-foreground flex items-start gap-2">
          <MapPin className="mt-[2px] h-4 w-4 shrink-0" />
          <div className="leading-tight">
            <div className="font-medium">{matkul.ruang_kelas.id_ruang}</div>
            <div className="text-xs">
              Gedung FT {matkul.ruang_kelas.gedung_ft}, Lantai &nbsp;
              {matkul.ruang_kelas.lantai}, Ruang &nbsp;
              {matkul.ruang_kelas.nomor_ruang}
            </div>
          </div>
        </div>

        <div className="text-muted-foreground flex items-start gap-2">
          <User className="mt-[2px] h-4 w-4 shrink-0" />
          <span>{matkul.dosen.full_name}</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 px-4 pt-2">
        {matkul.dosen.karakteristik.map((char, index) => (
          <Badge key={index} variant="outline" className="px-2 py-1 text-xs">
            {char
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  );
}
