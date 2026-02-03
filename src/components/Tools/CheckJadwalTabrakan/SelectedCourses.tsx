"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BookOpen, CheckCircle2, Clock, MapPin, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/cn";
import { ConflictAlert } from "./ConflictAlert";
import { Conflict, Matkul } from "./types";

interface SelectedCoursesProps {
  selectedCourses: Matkul[];
  onRemoveCourse: (course: Matkul) => void;
  onReset: () => void;
  totalSKS: number;
  maxSKS: number;
  setMaxSKS: (sks: number) => void;
  conflicts: Conflict[];
}

export function SelectedCourses({
  selectedCourses,
  onRemoveCourse,
  onReset,
  totalSKS,
  maxSKS,
  setMaxSKS,
  conflicts,
}: SelectedCoursesProps) {
  return (
    <div className="flex flex-col gap-4 min-h-0 h-full lg:col-span-4">
      {/* STATS & SETTINGS CARD */}
      <Card
        className={cn(
          "p-5 border-2 transition-all duration-500 shrink-0",
          conflicts.length > 0
            ? "border-red-500/50 bg-red-500/5 shadow-red-500/10 shadow-lg"
            : "border-teal-500/20 bg-teal-500/5",
        )}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-end gap-2">
              <h3
                className={cn(
                  "font-black text-4xl tabular-nums leading-none tracking-tighter",
                  conflicts.length > 0 ? "text-red-500" : "text-teal-600",
                )}>
                {totalSKS}
              </h3>
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                <span className="text-lg font-light">/</span>
                <div className="relative group">
                  <Input
                    type="number"
                    className="w-14 h-7 px-1 py-0 text-center text-sm font-bold bg-background/50 border-border focus:ring-1 focus:ring-teal-500 rounded-md"
                    value={maxSKS}
                    onChange={(e) => setMaxSKS(Number(e.target.value))}
                    min={1}
                    max={40}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-background/50 px-1.5 py-0.5 rounded border">
                  Max
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">
              Total SKS Terpilih
            </p>
          </div>

          <div className="flex gap-2">
            {conflicts.length > 0 ? (
              <div className="bg-red-500 text-white p-2.5 rounded-xl animate-pulse shadow-lg shadow-red-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
            ) : (
              <div className="bg-teal-500 text-white p-2.5 rounded-xl shadow-lg shadow-teal-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>

        {/* PROGRES BAR SKS */}
        <div className="mb-4">
          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                totalSKS > maxSKS ? "bg-red-500" : "bg-teal-500",
              )}
              style={{ width: `${Math.min((totalSKS / maxSKS) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
            <span>0 SKS</span>
            <span>{Math.round((totalSKS / maxSKS) * 100)}% Used</span>
            <span>{maxSKS} SKS</span>
          </div>
        </div>

        <ConflictAlert conflicts={conflicts} />
      </Card>

      {/* SELECTED LIST - Lebih lega */}
      <Card className="flex-1 flex flex-col border-border/50 bg-card/50 overflow-hidden min-h-0 shadow-sm">
        <div className="p-4 border-b flex justify-between items-center bg-muted/20 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Draft KRS ({selectedCourses.length})
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            onClick={onReset}
            title="Reset Semua">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex-1 min-h-0 bg-background/30">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {selectedCourses.map((item) => (
                  <motion.div
                    key={`${item.kode}-${item.kelas}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group relative bg-background border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:border-teal-500/30">
                    <button
                      onClick={() => onRemoveCourse(item)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 bg-muted/50 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="pr-8">
                      <h4 className="font-bold text-sm text-foreground leading-snug">{item.mataKuliah}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.kode}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium">
                        {item.sks} SKS
                      </Badge>
                      <Badge
                        variant="outline"
                        className="h-5 px-2 text-[10px] bg-blue-500/5 text-blue-600 border-blue-200 dark:border-blue-900">
                        Kls {item.kelas}
                      </Badge>
                    </div>

                    <div className="mt-3 pt-3 border-t border-dashed flex justify-between items-center text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span
                          className={cn(
                            "font-medium",
                            conflicts.some((c) => c.course1 === item || c.course2 === item) && "text-red-500 font-bold",
                          )}>
                          {item.hari}, {item.mulai.slice(0, 5)} - {item.selesai.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5" title={item.ruang}>
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="truncate max-w-[80px]">{item.ruang.split("(")[0]}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {selectedCourses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center opacity-50 border-2 border-dashed rounded-xl m-2 bg-muted/20">
                  <BookOpen className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="text-sm font-bold">Draft Kosong</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[150px]">
                    Pilih mata kuliah di panel sebelah kiri untuk memulai.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}
