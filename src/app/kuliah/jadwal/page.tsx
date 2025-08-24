// src/app/kuliah/jadwal/page.tsx
import { jadwalKuliah } from "@/lib/data/jadwal";
import { JadwalDashboard } from "@/components/Jadwal/JadwalDashboard";

export default function JadwalPage() {
  // ❌ Hapus semua logika getHariIni dari sini.
  // Server hanya bertugas mengirim data jadwal mentah.

  // Langsung render komponen client tanpa prop initialDay
  return <JadwalDashboard fullSchedule={jadwalKuliah} />;
}
