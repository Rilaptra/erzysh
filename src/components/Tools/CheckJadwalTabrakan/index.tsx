"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { AvailableCourses } from "./AvailableCourses";
import { ScheduleVisualizer } from "./ScheduleVisualizer";
import { SelectedCourses } from "./SelectedCourses";
import { Conflict, Matkul } from "./types";

// --- HELPER: TIME CONVERSION ---
const timeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// --- HELPER: CONFLICT CHECKER ---
const checkConflict = (selected: Matkul[]): Conflict[] => {
  const conflicts: Conflict[] = [];

  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const c1 = selected[i];
      const c2 = selected[j];

      if (c1.hari !== c2.hari) continue;

      const start1 = timeToMinutes(c1.mulai);
      const end1 = timeToMinutes(c1.selesai);
      const start2 = timeToMinutes(c2.mulai);
      const end2 = timeToMinutes(c2.selesai);

      if (Math.max(start1, start2) < Math.min(end1, end2)) {
        conflicts.push({ course1: c1, course2: c2 });
      }
    }
  }
  return conflicts;
};

interface CheckJadwalTabrakanClientProps {
  data: any[];
}

export default function CheckJadwalTabrakanClient({ data: rawData }: CheckJadwalTabrakanClientProps) {
  const [selectedCourses, setSelectedCourses] = useLocalStorageState<Matkul[]>("eryzsh_krs_draft", []);
  const [searchQuery, setSearchQuery] = useState("");
  const [maxSKS, setMaxSKS] = useLocalStorageState<number>("eryzsh_krs_limit", 24);

  const totalSKS = useMemo(() => selectedCourses.reduce((acc, curr) => acc + curr.sks, 0), [selectedCourses]);
  const conflicts = useMemo(() => checkConflict(selectedCourses), [selectedCourses]);

  const availableCourses = useMemo(() => {
    const selectedIds = new Set(selectedCourses.map((c) => `${c.kode}-${c.kelas}`));
    const data = rawData as unknown as Matkul[];

    return data.filter((item) => {
      const id = `${item.kode}-${item.kelas}`;
      if (selectedIds.has(id)) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.mataKuliah.toLowerCase().includes(q) ||
        item.dosen.toLowerCase().includes(q) ||
        item.hari.toLowerCase().includes(q) ||
        item.kode.toLowerCase().includes(q)
      );
    });
  }, [selectedCourses, searchQuery, rawData]);

  const handleAddCourse = (course: Matkul) => {
    if (totalSKS + course.sks > maxSKS) {
      toast.error(`Gagal menambahkan ${course.mataKuliah}`, {
        description: `Total SKS akan melebihi batas (${maxSKS} SKS).`,
      });
      return;
    }

    const alreadyTaken = selectedCourses.find((c) => c.kode === course.kode);
    if (alreadyTaken) {
      toast.warning("Mata Kuliah Serupa Terdeteksi", {
        description: `Kamu sudah mengambil ${alreadyTaken.mataKuliah} (Kelas ${alreadyTaken.kelas}). Hapus dulu jika ingin pindah kelas.`,
      });
      return;
    }

    setSelectedCourses((prev) => [...prev, course]);
    toast.success("Berhasil ditambahkan", {
      description: `${course.mataKuliah} - Kelas ${course.kelas}`,
    });
  };

  const handleRemoveCourse = (course: Matkul) => {
    setSelectedCourses((prev) => prev.filter((c) => `${c.kode}-${c.kelas}` !== `${course.kode}-${course.kelas}`));
    toast.info("Matkul dihapus", { description: `${course.mataKuliah}` });
  };

  const handleReset = () => {
    if (confirm("Yakin ingin menghapus semua draft KRS?")) {
      setSelectedCourses([]);
      toast.success("Draft KRS direset");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* SECTION 1: PICKER */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 h-[calc(100vh-140px)] min-h-[600px]">
        <AvailableCourses
          availableCourses={availableCourses}
          onAddCourse={handleAddCourse}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <SelectedCourses
          selectedCourses={selectedCourses}
          onRemoveCourse={handleRemoveCourse}
          onReset={handleReset}
          totalSKS={totalSKS}
          maxSKS={maxSKS}
          setMaxSKS={setMaxSKS}
          conflicts={conflicts}
        />
      </div>

      {/* SECTION 2: VISUALIZATION */}
      <ScheduleVisualizer courses={selectedCourses} />
    </div>
  );
}
