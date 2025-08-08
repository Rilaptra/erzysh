import { jadwalKuliah } from "@/lib/jadwal-data";
import { JadwalDashboard } from "@/components/Jadwal/JadwalDashboard";
import type { Jadwal } from "@/lib/jadwal-data";

// Helper function to get the current day in Indonesian
const getHariIni = (): string => {
  // Note: This runs on the server, so it will be the server's current time.
  // For a production app, this might need to consider the user's timezone.
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayIndex = new Date().getDay();
  return days[todayIndex];
};

export default function JadwalPage() {
  const hariIniStr = getHariIni();

  // Clone the original object to avoid mutation
  const jadwalLain: Jadwal = { ...jadwalKuliah };

  // Get today's schedule and remove it from the 'other days' schedule
  const jadwalHariIni = jadwalLain[hariIniStr];
  if (jadwalLain[hariIniStr]) {
    delete jadwalLain[hariIniStr];
  }

  return (
    <JadwalDashboard
      hariIni={hariIniStr}
      jadwalHariIni={jadwalHariIni}
      jadwalLain={jadwalLain}
    />
  );
}
