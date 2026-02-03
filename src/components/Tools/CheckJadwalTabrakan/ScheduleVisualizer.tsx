"use client";

import { Clock, Download, GraduationCap, MapPin } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { getDayColor } from "./CourseItem";
import { Matkul } from "./types";

interface ScheduleVisualizerProps {
  courses: Matkul[];
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const START_HOUR = 7;
const END_HOUR = 18; // Until 18:00
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const timeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

export function ScheduleVisualizer({ courses }: ScheduleVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<Matkul | null>(null);

  const getPosition = (startStr: string, endStr: string) => {
    const start = timeToMinutes(startStr);
    const end = timeToMinutes(endStr);
    const startOffset = start - START_HOUR * 60;
    const duration = end - start;

    return {
      top: `${(startOffset / TOTAL_MINUTES) * 100}%`,
      height: `${(duration / TOTAL_MINUTES) * 100}%`,
    };
  };

  const handleExportText = () => {
    const text = courses.map((c) => `[${c.hari}] ${c.mulai}-${c.selesai}: ${c.mataKuliah} (${c.ruang})`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Jadwal disalin ke clipboard!");
  };

  return (
    <Card className="p-6 border-border/50 bg-card/30 mt-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">Visualisasi Jadwal</h2>
          <p className="text-sm text-muted-foreground">Preview jadwal dalam bentuk grid mingguan.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportText}>
          <Download className="w-4 h-4 mr-2" /> Salin Text
        </Button>
      </div>

      <div className="relative overflow-x-auto" ref={containerRef}>
        <div className="min-w-[800px] bg-background/50 rounded-xl border border-border/50 p-4">
          <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr] gap-4">
            {/* Header: TIME + DAYS */}
            <div className="text-xs font-bold text-center py-2 text-muted-foreground">JAM</div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-xs font-bold text-center py-2 uppercase tracking-wider bg-muted/20 rounded-lg text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Content: TIME SLOTS */}
            <div className="relative col-span-7 grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 h-[600px]">
              {/* Y-AXIS LABELS */}
              <div className="relative h-full border-r border-border/30">
                {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full text-right pr-2 text-[10px] text-muted-foreground border-t border-dashed border-border/30"
                    style={{
                      top: `${(((hour - START_HOUR) * 60) / TOTAL_MINUTES) * 100}%`,
                    }}>
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* GRID COLUMNS */}
              {DAYS.map((day) => (
                <div key={day} className="relative h-full border-l border-dashed border-border/20 group">
                  {/* Hover Effect Background */}
                  <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/5 transition-colors duration-500 pointer-events-none" />

                  {courses
                    .filter((c) => c.hari === day)
                    .map((course, idx) => {
                      const pos = getPosition(course.mulai, course.selesai);
                      return (
                        <div
                          key={`${course.kode}-${idx}`}
                          onClick={() => setSelectedCourse(course)}
                          className={cn(
                            "absolute left-0 right-0 mx-1 p-2 rounded-md border text-[10px] flex flex-col justify-center shadow-sm overflow-hidden hover:z-10 hover:scale-105 transition-all cursor-pointer",
                            getDayColor(course.hari),
                            "bg-opacity-90 dark:bg-opacity-80 backdrop-blur-sm",
                          )}
                          style={{
                            top: pos.top,
                            height: pos.height,
                          }}
                          title="Klik untuk detail">
                          <div className="flex gap-1 items-center ">
                            <div className="font-bold truncate leading-none">{course.mataKuliah}</div>
                            <div className="opacity-75 truncate text-[9px] mt-0.5">{course.ruang}</div>
                          </div>
                          <div className="opacity-75 truncate text-[9px]">
                            {course.mulai} - {course.selesai}
                          </div>
                          {/* Info Icon Overlay */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-background/80 rounded-full p-0.5">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-info">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span
                className={cn(
                  "inline-block w-4 h-4 rounded-full",
                  selectedCourse && getDayColor(selectedCourse.hari).split(" ")[0],
                )}
              />
              Detail Mata Kuliah
            </DialogTitle>
            <DialogDescription>Informasi lengkap mengenai mata kuliah yang dipilih.</DialogDescription>
          </DialogHeader>

          {selectedCourse && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Mata Kuliah</Label>
                  <p className="font-bold text-lg leading-tight">{selectedCourse.mataKuliah}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Kode Matkul</Label>
                  <p className="font-mono text-base">{selectedCourse.kode}</p>
                </div>
              </div>

              <div className="h-px bg-border my-1" />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Dosen Pengampu</Label>
                  <div className="flex items-center gap-2 font-medium">
                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                    <span className="truncate">{selectedCourse.dosen}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">SKS & Kelas</Label>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{selectedCourse.sks} SKS</Badge>
                    <Badge variant="outline">Kls {selectedCourse.kelas}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Waktu</Label>
                  <div className="flex items-center gap-2 font-medium">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span>
                      {selectedCourse.hari}, {selectedCourse.mulai} - {selectedCourse.selesai}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Ruangan</Label>
                  <div className="flex items-center gap-2 font-medium">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>{selectedCourse.ruang}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSelectedCourse(null)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
