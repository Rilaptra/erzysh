// src/app/kuliah/tugas/page.tsx
import { TugasDashboard } from "@/components/Tugas/TugasDashboard";
import { jadwalKuliah } from "@/lib/data/jadwal";

// Helper untuk mengekstrak nama mata kuliah dari jadwal
const getMataKuliahList = () => {
  const matkulSet = new Set<string>();
  Object.values(jadwalKuliah).forEach((hari) => {
    hari.forEach((mk) => {
      // Membersihkan nama matkul dari embel-embel praktikum
      const cleanName = mk.matkul
        .replace(/\s*\((T\*|Praktikum)\)\s*$/, "")
        .trim();
      matkulSet.add(cleanName);
    });
  });
  return Array.from(matkulSet).sort();
};

export default function TugasPage() {
  const mataKuliahOptions = getMataKuliahList();

  // Untuk saat ini, kita akan pass data tugas langsung ke komponen client.
  // Ke depannya, di sini adalah tempat untuk fetch data dari API.
  return <TugasDashboard mataKuliahOptions={mataKuliahOptions} />;
}
