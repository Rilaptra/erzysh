"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Conflict } from "./types";

interface ConflictAlertProps {
  conflicts: Conflict[];
}

export function ConflictAlert({ conflicts }: ConflictAlertProps) {
  return (
    <AnimatePresence>
      {conflicts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-background/60 border border-red-500/30 rounded-xl p-3 text-sm text-red-600 space-y-2 overflow-hidden shadow-inner">
          <div className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-red-700">
            <X className="w-4 h-4" /> Jadwal Bentrok Ditemukan!
          </div>
          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
            {conflicts.map((c, i) => (
              <div
                key={i}
                className="bg-white dark:bg-black/40 p-2.5 rounded-lg text-xs border border-red-500/20 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                <div className="flex justify-between items-center mb-1.5 pl-2">
                  <span className="font-bold text-red-700 dark:text-red-400">{c.course1.hari}</span>
                  <Badge variant="destructive" className="h-4 px-1 text-[9px] font-normal">
                    Overlapping
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-1 pl-2">
                  <div className="flex justify-between">
                    <span className="font-medium truncate">{c.course1.mataKuliah}</span>
                    <span className="text-muted-foreground font-mono">{c.course1.mulai.slice(0, 5)}</span>
                  </div>
                  <div className="h-px bg-red-500/20 w-full" />
                  <div className="flex justify-between">
                    <span className="font-medium truncate">{c.course2.mataKuliah}</span>
                    <span className="text-muted-foreground font-mono">{c.course2.mulai.slice(0, 5)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
