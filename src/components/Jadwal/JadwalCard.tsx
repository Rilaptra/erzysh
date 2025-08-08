"use client";

import type { MataKuliah } from "@/lib/jadwal-data";
import {
  Card,
  CardContent,
  CardDescription,
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{matkul.matkul}</CardTitle>
        <CardDescription>{matkul.sks} SKS</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-gray-500" />
          <span>{matkul.jam_pelajaran.mulai} - {matkul.jam_pelajaran.selesai}</span>
        </div>
        <div className="flex items-center">
          <MapPin className="mr-2 h-4 w-4 text-gray-500" />
          <span>{matkul.ruang_kelas.id_ruang}</span>
        </div>
        <div className="flex items-center">
          <User className="mr-2 h-4 w-4 text-gray-500" />
          <span>{matkul.dosen.full_name}</span>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex flex-wrap gap-2">
          {matkul.dosen.karakteristik.map((char, index) => (
            <Badge key={index} variant="outline">{char}</Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
