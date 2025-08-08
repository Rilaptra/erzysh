"use client";

import type { MataKuliah } from "@/lib/jadwal-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HariLainCardProps {
  hari: string;
  jadwal: MataKuliah[];
}

export function HariLainCard({ hari, jadwal }: HariLainCardProps) {
  const courseNames = jadwal.map((m) => m.matkul).join(", ");

  return (
    <Card className="hover:bg-gray-50 transition-colors">
      <CardHeader>
        <CardTitle className="text-lg">{hari}</CardTitle>
        <CardDescription>{jadwal.length} Matkul</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 truncate" title={courseNames}>
          {courseNames}
        </p>
      </CardContent>
    </Card>
  );
}
