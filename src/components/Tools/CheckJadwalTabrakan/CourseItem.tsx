"use client";

import { GraduationCap, MapPin, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Matkul } from "./types";

interface CourseItemProps {
  item: Matkul;
  onAdd: (course: Matkul) => void;
}

export const getDayColor = (day: string) => {
  switch (day) {
    case "Senin":
      return "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900";
    case "Selasa":
      return "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900";
    case "Rabu":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900";
    case "Kamis":
      return "bg-green-500/10 text-green-600 border-green-200 dark:border-green-900";
    case "Jumat":
      return "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900";
    case "Sabtu":
      return "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function CourseItem({ item, onAdd }: CourseItemProps) {
  return (
    <div className="group relative border border-border/60 bg-background/60 hover:bg-background hover:border-teal-500/50 hover:shadow-lg rounded-xl p-5 transition-all duration-300 flex flex-col justify-between gap-4">
      <div className="flex justify-between items-start w-full">
        <Badge
          variant="outline"
          className={cn("px-2 py-0.5 text-[10px] font-bold uppercase border", getDayColor(item.hari))}>
          {item.hari} • {item.mulai.slice(0, 5)} - {item.selesai.slice(0, 5)}
        </Badge>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-[10px]">
            {item.sks} SKS
          </Badge>
          <Badge variant="outline" className="text-[10px] border-teal-500/30 text-teal-600 bg-teal-500/5">
            Kls {item.kelas}
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-base leading-snug group-hover:text-teal-600 transition-colors line-clamp-2">
          {item.mataKuliah}
        </h3>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GraduationCap className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
            <span className="truncate">{item.dosen}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            <span className="truncate">{item.ruang.split("(")[0]}</span>
          </div>
        </div>
      </div>

      <Button
        size="sm"
        className="w-full mt-1 bg-background border border-dashed border-teal-500/30 text-foreground hover:bg-teal-600 hover:text-white hover:border-solid hover:shadow-md transition-all active:scale-95"
        onClick={() => onAdd(item)}>
        <Plus className="w-4 h-4 mr-2" /> Ambil Mata Kuliah Ini
      </Button>
    </div>
  );
}
