// src/app/kuliah/jadwal/page.tsx
import { jadwalKuliah } from "@/lib/data/jadwal"; // <-- Diubah
import { JadwalDashboard } from "@/components/Jadwal/JadwalDashboard";

// Helper function untuk mendapatkan hari dalam Bahasa Indonesia
const getHariIni = (): string => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayIndex = new Date().getDay();
  // Jika hari ini Minggu (indeks 0) dan tidak ada jadwal, default ke Senin
  if (todayIndex === 0 && !jadwalKuliah["Minggu"]) {
    return days[1];
  }
  return days[todayIndex];
};

export default function JadwalPage() {
  const hariIniStr = getHariIni();

  return (
    <JadwalDashboard initialDay={hariIniStr} fullSchedule={jadwalKuliah} />
  );
}
