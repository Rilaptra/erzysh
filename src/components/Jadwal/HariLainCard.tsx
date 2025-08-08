"use client";

import type { MataKuliah } from "@/lib/jadwal-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface HariLainCardProps {
  hari: string;
  jadwal: MataKuliah[];
  isSelected: boolean;
  onSelectDay: (day: string) => void;
}

export function HariLainCard({ hari, jadwal, isSelected, onSelectDay }: HariLainCardProps) {
  const courseNames = jadwal.map((m) => m.matkul).join(", ");

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:bg-gray-100",
        isSelected && "border-primary bg-primary/10"
      )}
      onClick={() => onSelectDay(hari)}
    >
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
