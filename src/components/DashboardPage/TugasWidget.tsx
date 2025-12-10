// src/components/DashboardPage/TugasWidget.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BookCheck, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Tugas } from "@/types/tugas";
import { formatDistanceToNow, parseISO, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/cn";

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
      .slice(0, 3); // Ambil 3 teratas aja biar gak penuh
  }, [tugasList]);

  const getUrgencyColor = (deadline: string) => {
    const daysLeft = differenceInDays(parseISO(deadline), new Date());
    if (daysLeft < 2) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (daysLeft < 7)
      return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-blue-500 bg-blue-500/10 border-blue-500/20";
  };

  return (
    <div className="from-card/80 to-card/40 flex h-full flex-col bg-linear-to-b p-6 backdrop-blur-md">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <BookCheck className="h-5 w-5 text-indigo-500" />
          Tugas Aktif
        </h3>
        <Badge variant="outline" className="font-mono">
          {upcomingTugas.length} Pending
        </Badge>
      </div>

      {/* CONTENT */}
      <div className="flex-1 space-y-3">
        {upcomingTugas.length > 0 ? (
          upcomingTugas.map((tugas) => {
            const urgencyClass = getUrgencyColor(tugas.deadline);

            return (
              <div
                key={tugas.id}
                className="group border-border/50 bg-card/50 hover:bg-card flex flex-col gap-2 rounded-xl border p-3 transition-all hover:-translate-x-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h4 className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-indigo-500">
                    {tugas.judul}
                  </h4>
                  <div
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      urgencyClass,
                    )}
                  >
                    {formatDistanceToNow(parseISO(tugas.deadline), {
                      locale: id,
                    })}
                  </div>
                </div>

                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span className="bg-muted/50 line-clamp-1 max-w-[60%] rounded px-2 py-0.5">
                    {tugas.mataKuliah}
                  </span>
                  <div className="flex items-center gap-1 opacity-70">
                    <Clock className="h-3 w-3" />
                    {new Date(tugas.deadline).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
            <div className="mb-2 rounded-full bg-green-500/10 p-3 text-green-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">Semua tugas selesai!</p>
            <p className="text-muted-foreground text-xs">
              Kerja bagus, santai dulu bro.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="border-border/50 mt-4 border-t pt-4">
        <Link href="/kuliah/tugas">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs hover:bg-indigo-500/10 hover:text-indigo-500"
          >
            Kelola Semua Tugas <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
