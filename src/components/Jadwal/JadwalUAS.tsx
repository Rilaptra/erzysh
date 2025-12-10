"use client";

import { useMemo, useState } from "react";
import { format, parseISO, isSameDay, addDays, isAfter } from "date-fns";
import { id } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  BookOpen,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import jadwalUASData from "@/lib/data/jadwal-uas.json";
import { cn } from "@/lib/cn";
import type { JadwalUASItem } from "@/types/jadwal-uas";

// --- TIPE DATA ---
type GroupedData = Record<string, JadwalUASItem[]>;

// --- HELPER COMPONENTS ---
const ExamMeta = ({
  item,
  minimal = false,
}: {
  item: JadwalUASItem;
  minimal?: boolean;
}) => (
  <div
    className={cn(
      "text-muted-foreground flex flex-wrap items-center gap-3 text-xs",
      minimal && "mt-1",
    )}
  >
    <div className="flex items-center gap-1.5">
      <Clock className="size-3.5 text-teal-600" />
      <span className="text-foreground font-medium">
        {item.waktu.mulai} - {item.waktu.selesai}
      </span>
    </div>
    <div className="bg-border hidden h-3 w-px sm:block" />
    <div className="flex items-center gap-1.5">
      <MapPin className="size-3.5" />
      <span>{item.ruang}</span>
    </div>
    {!minimal && (
      <>
        <div className="bg-border hidden h-3 w-px sm:block" />
        <div className="flex items-center gap-1.5">
          <BookOpen className="size-3.5" />
          <span>{item.sks} SKS</span>
        </div>
      </>
    )}
  </div>
);

// --- DESIGN 5: TICKET (Unik & Aesthetic) ---
const DesignTicket = ({ data, today }: { data: GroupedData; today: Date }) => (
  <div className="space-y-6">
    {Object.entries(data).map(([dateStr, exams]) => {
      const dateObj = parseISO(dateStr);
      const isTomorrow = isSameDay(addDays(today, 1), dateObj);

      return (
        <div
          key={dateStr}
          className="border-muted-foreground/30 bg-card relative flex flex-col overflow-hidden rounded-2xl border-2 border-dashed md:flex-row"
        >
          {/* Left / Top Side: Date */}
          <div
            className={cn(
              "border-muted-foreground/30 flex flex-row items-center justify-between gap-2 border-b-2 border-dashed p-6 md:w-40 md:flex-col md:justify-center md:border-r-2 md:border-b-0",
              isTomorrow ? "bg-teal-500 text-white" : "bg-muted/50",
            )}
          >
            <span className="text-lg font-medium opacity-80">
              {format(dateObj, "EEEE", { locale: id })}
            </span>
            <span className="text-4xl font-bold">
              {format(dateObj, "dd", { locale: id })}
            </span>
            <span className="text-sm font-medium uppercase opacity-80">
              {format(dateObj, "MMMM", { locale: id })}
            </span>
          </div>

          {/* Right / Bottom Side: Exams */}
          <div className="flex-1 space-y-4 p-5">
            {exams.map((exam, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="flex w-16 shrink-0 flex-col items-center">
                  <span className="text-sm font-bold">{exam.waktu.mulai}</span>
                  <span className="bg-border my-0.5 h-4 w-px"></span>
                  <span className="text-muted-foreground text-xs">
                    {exam.waktu.selesai}
                  </span>
                </div>
                <div className="flex-1 border-l py-1 pl-4">
                  <h4 className="text-sm font-bold">{exam.mata_kuliah}</h4>
                  <p className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                    <MapPin className="size-3" /> {exam.ruang}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <Badge variant="outline" className="font-mono">
                    {exam.sks} SKS
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Cutout Circles Decoration */}
          <div className="bg-background border-muted-foreground/30 absolute top-1/2 -left-3 hidden h-6 w-6 rounded-full border-r md:block" />
          <div className="bg-background border-muted-foreground/30 absolute top-1/2 -right-3 hidden h-6 w-6 rounded-full border-l md:block" />
        </div>
      );
    })}
  </div>
);

// --- MAIN COMPONENT ---
export function JadwalUAS() {
  const today = new Date();
  const [] = useState<number>(3); // Default ke design 3 (Minimal)

  // Grouping Logic
  const { todayExams, upcomingGroups } = useMemo(() => {
    const todayHits: JadwalUASItem[] = [];
    const groupedUpcoming: Record<string, JadwalUASItem[]> = {};

    const sortedData = [...jadwalUASData].sort((a, b) => {
      const dateA = new Date(`${a.tanggal}T${a.waktu.mulai}`);
      const dateB = new Date(`${b.tanggal}T${b.waktu.mulai}`);
      return dateA.getTime() - dateB.getTime();
    });

    sortedData.forEach((exam) => {
      const examDate = parseISO(exam.tanggal);
      if (isSameDay(today, examDate)) {
        todayHits.push(exam);
      } else if (
        isAfter(examDate, today) ||
        isSameDay(addDays(today, 1), examDate)
      ) {
        if (!groupedUpcoming[exam.tanggal]) groupedUpcoming[exam.tanggal] = [];
        groupedUpcoming[exam.tanggal].push(exam);
      }
    });

    return { todayExams: todayHits, upcomingGroups: groupedUpcoming };
  }, [today]);

  const hasExamsToday = todayExams.length > 0;
  const upcomingAvailable = Object.keys(upcomingGroups).length > 0;

  return (
    <div className="space-y-8 pb-10">
      {/* SECTION 1: HARI INI (Highlight Hero - Tetap Konsisten) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="size-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Ujian Hari Ini</h2>
        </div>

        {hasExamsToday ? (
          <Card className="border-l-4 border-l-red-500 shadow-lg dark:bg-red-950/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                    {format(today, "EEEE, dd MMMM yyyy", { locale: id })}
                  </CardTitle>
                  <CardDescription>
                    Semangat! Kamu punya {todayExams.length} ujian hari ini.
                  </CardDescription>
                </div>
                <Badge className="animate-pulse bg-red-500 hover:bg-red-600">
                  Sedang Berlangsung
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-4">
              {todayExams.map((exam) => (
                <div
                  key={exam.no}
                  className="bg-background/80 flex flex-col gap-2 rounded-lg border border-red-200 p-4 dark:border-red-900/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">
                      {exam.mata_kuliah}
                    </span>
                    <Badge variant="secondary">{exam.sks} SKS</Badge>
                  </div>
                  <ExamMeta item={exam} />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <div className="bg-muted/30 flex h-24 flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <p className="text-muted-foreground text-sm font-medium">
              Tidak ada jadwal ujian hari ini. Manfaatkan untuk belajar! 📚
            </p>
          </div>
        )}
      </section>

      {/* SECTION 2: JADWAL MENDATANG (Design Switcher) */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400">
              <CalendarDays className="size-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Jadwal Mendatang
            </h2>
          </div>
        </div>

        {upcomingAvailable ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <DesignTicket data={upcomingGroups} today={today} />
          </div>
        ) : (
          <p className="text-muted-foreground py-10 text-center">
            Tidak ada jadwal ujian mendatang.
          </p>
        )}
      </section>
    </div>
  );
}
