// src/app/kuliah/tools/check-jadwal-tabrakan/page.tsx
import { Metadata } from "next";
import CheckJadwalTabrakanClient from "@/components/Tools/CheckJadwalTabrakan";
import rawData from "@/lib/data/daftar-matkul-dosen.json";

export const metadata: Metadata = {
  title: "Check Jadwal Tabrakan",
  description: "Simulasi penyusunan KRS dan deteksi jadwal bentrok otomatis.",
};

export default function CheckJadwalPage() {
  return (
    <main className="container mx-auto p-4 lg:p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          KRS <span className="text-teal-500">Simulator</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Susun rencana studi dan cek jadwal bentrok secara otomatis sebelum input KRS asli.
        </p>
      </div>

      <CheckJadwalTabrakanClient data={rawData} />
    </main>
  );
}
