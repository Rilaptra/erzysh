// src/lib/hooks/useAcademicEvents.ts
import { useEffect, useMemo, useState } from "react";
import type { Kegiatan } from "@/types/kalender-akademik";
import kalenderData from "@/lib/data/kalender-akademik.json";
import { cariKegiatan } from "@/lib/utils/academic-search";

export const useAcademicEvents = (targetDate: Date = new Date()): Kegiatan[] => {
  const [events, setEvents] = useState<Kegiatan[]>([]);

  useEffect(() => {
    const isoDate = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const hasil = cariKegiatan(kalenderData, {
      tanggal_mulai: isoDate,
      tanggal_selesai: isoDate,
    });
    setEvents(hasil);
  }, [targetDate]);

  return events;
};
