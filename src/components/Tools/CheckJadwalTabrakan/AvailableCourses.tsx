"use client";

import { Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CourseItem } from "./CourseItem";
import { Matkul } from "./types";

interface AvailableCoursesProps {
  availableCourses: Matkul[];
  onAddCourse: (course: Matkul) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function AvailableCourses({
  availableCourses,
  onAddCourse,
  searchQuery,
  setSearchQuery,
}: AvailableCoursesProps) {
  return (
    <div className="flex flex-col gap-4 min-h-0 h-full lg:col-span-8">
      {/* Search Header */}
      <Card className="p-5 border-border/50 bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-teal-500" />
              Cari Mata Kuliah
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Pilih matkul untuk menyusun jadwal semester ini.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari Dosen, Matkul, Hari..."
              className="pl-9 bg-background/50 border-border/50 focus-visible:ring-teal-500/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* List Card */}
      <Card className="flex-1 border-border/50 bg-card/30 overflow-hidden flex flex-col min-h-0 shadow-none">
        <div className="p-4 bg-muted/20 border-b flex justify-between items-center shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Available Courses ({availableCourses.length})
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-teal-600 font-medium bg-teal-500/10 px-2 py-1 rounded-full">
            <Plus className="w-3 h-3" /> Klik tombol untuk menambahkan
          </span>
        </div>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 lg:pb-4">
              {availableCourses.map((item, idx) => (
                <CourseItem key={`${item.kode}-${item.kelas}-${idx}`} item={item} onAdd={onAddCourse} />
              ))}
              {availableCourses.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground flex flex-col items-center">
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Tidak ditemukan</p>
                  <p className="text-sm">Coba kata kunci lain atau bersihkan pencarian.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}
