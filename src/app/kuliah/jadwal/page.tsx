// src/app/kuliah/jadwal/page.tsx
import { jadwalKuliah } from "@/lib/data/jadwal";
import { JadwalDashboard } from "@/components/Jadwal/JadwalDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Kuliah",
  description: "View your weekly university class schedule.",
  // openGraph dan twitter akan mewarisi dari root layout
};

export default function JadwalPage() {
  return <JadwalDashboard fullSchedule={jadwalKuliah} />;
}
