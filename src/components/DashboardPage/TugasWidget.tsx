// src/components/DashboardPage/TugasWidget.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tugas } from "@/types/tugas";
import { BookCheck } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface TugasWidgetProps {
  tugasList: Tugas[];
}

export const TugasWidget = ({ tugasList }: TugasWidgetProps) => {
  const upcomingTugas = useMemo(() => {
    return tugasList
      .filter((t) => !t.isCompleted)
      .sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      )
      .slice(0, 4);
  }, [tugasList]);

  return (
    // THEME: Menggunakan bg-card yang adaptif
    <Card className="backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <BookCheck className="text-teal-muted size-6" />
          <CardTitle className="text-xl font-bold">Tugas Terdekat</CardTitle>
        </div>
        <Link
          href="/kuliah/tugas"
          className="text-teal-muted text-sm hover:underline"
        >
          Lihat semua
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingTugas.length > 0 ? (
          upcomingTugas.map((tugas) => (
            // THEME: Menggunakan bg-muted yang adaptif
            <div
              key={tugas.id}
              className="bg-muted/50 flex items-center justify-between rounded-md p-3"
            >
              <div>
                <p className="font-semibold">{tugas.judul}</p>
                <p className="text-muted-foreground text-xs">
                  {tugas.mataKuliah}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 text-right">
                <Badge variant="destructive" className="mb-1">
                  {formatDistanceToNow(parseISO(tugas.deadline), {
                    addSuffix: true,
                    locale: id,
                  })}
                </Badge>
                <p className="text-muted-foreground/80 text-xs">
                  {new Date(tugas.deadline).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed">
            <p className="text-muted-foreground">
              Tidak ada tugas aktif. Santai dulu, bro! 🤙
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
