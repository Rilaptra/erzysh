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

export function HariLainCard({
  hari,
  jadwal,
  isSelected,
  onSelectDay,
}: HariLainCardProps) {
  const courseNames = jadwal.map((m) => m.matkul).join(", ");

  return (
    <Card
      className={cn(
        "border-border bg-card text-card-foreground cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:shadow-md",
        isSelected ? "ring-primary ring-2" : "",
      )}
      onClick={() => onSelectDay(hari)}
    >
      <CardHeader className="mb-2 p-0">
        <CardTitle className="text-base font-semibold">{hari}</CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          {jadwal.length} Matkul
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <p
          className="text-muted-foreground truncate text-sm"
          title={courseNames}
        >
          {courseNames}
        </p>
      </CardContent>
    </Card>
  );
}
