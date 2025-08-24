"use client";

import { useState } from "react";
import type { Jadwal } from "@/lib/data/jadwal-types";
import { HariIni } from "./HariIni";
import { HariLain } from "./HariLain";

interface JadwalDashboardProps {
  // ❌ Hapus prop initialDay dari sini
  fullSchedule: Jadwal;
}

export function JadwalDashboard({ fullSchedule }: JadwalDashboardProps) {
  // ✅ Pindahkan logika penentuan hari ke dalam inisialisasi useState.
  // Fungsi ini HANYA akan berjalan sekali di sisi klien.
  const [selectedDay, setSelectedDay] = useState(() => {
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const todayIndex = new Date().getDay(); // <-- Ini sekarang dijalankan di browser pengguna
    const todayString = days[todayIndex];

    const jadwalHariIni = fullSchedule[todayString];

    // Jika hari ini ada jadwalnya, langsung pakai hari ini.
    if (jadwalHariIni && jadwalHariIni.length > 0) {
      return todayString;
    }

    // Jika tidak, cari hari berikutnya yang ada jadwalnya (misal, kalau hari ini libur)
    const dayOrder = [
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
      "Minggu",
    ];
    for (const day of dayOrder) {
      if (fullSchedule[day] && fullSchedule[day].length > 0) {
        return day; // Default ke hari pertama yang ada jadwal di minggu itu
      }
    }

    return "Senin"; // Fallback terakhir
  });

  const selectedSchedule = fullSchedule[selectedDay];

  return (
    <div className="max-w-full px-4 py-6 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <main className="lg:col-span-2">
          <HariIni hari={selectedDay} jadwal={selectedSchedule} />
        </main>
        <aside>
          <HariLain
            fullSchedule={fullSchedule}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        </aside>
      </div>
    </div>
  );
}
