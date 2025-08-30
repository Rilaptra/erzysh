// src/app/kuliah/tugas/page.tsx
import { TugasDashboard } from "@/components/Tugas/TugasDashboard";
import { jadwalKuliah } from "@/lib/data/jadwal";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen Tugas",
  description: "Track all your university assignments and deadlines.",
  // openGraph dan twitter akan mewarisi dari root layout
};

const getMataKuliahList = () => {
  const matkulSet = new Set<string>();
  Object.values(jadwalKuliah).forEach((hari) => {
    hari.forEach((mk) => {
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

  return <TugasDashboard mataKuliahOptions={mataKuliahOptions} />;
}
