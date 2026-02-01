// src/app/kuliah/jadwal/page.tsx

import { BookOpenCheck, CalendarRange, GraduationCap, Library } from "lucide-react"; // Icon baru
import { Metadata } from "next";
import { DaftarMatkulGallery } from "@/components/Jadwal/DaftarMatkulGallery";
import { JadwalDashboard } from "@/components/Jadwal/JadwalDashboard";
import { JadwalUAS } from "@/components/Jadwal/JadwalUAS";
import { KalenderAkademikView } from "@/components/Jadwal/KalenderAkademikView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jadwalKuliah } from "@/types/jadwal";

export const metadata: Metadata = {
  title: "Pusat Jadwal",
  description: "Jadwal Kuliah, UAS, dan Kalender Akademik Universitas Tidar.",
};

export default function JadwalPage() {
  return (
    <main className="container mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">Pusat Jadwal</h1>
        <p className="text-muted-foreground mt-2">
          Kelola waktu kuliah, ujian, dan kegiatan akademikmu di satu tempat.
        </p>
      </div>

      <Tabs defaultValue="kuliah" className="space-y-6">
        <div className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-[64px] z-10 -mx-4 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0">
          <TabsList className="grid h-12 w-full grid-cols-4 p-1 sm:inline-flex sm:w-fit overflow-x-auto">
            <TabsTrigger value="kuliah" className="gap-2">
              <BookOpenCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Jadwal</span> Harian
            </TabsTrigger>
            <TabsTrigger value="uas" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Jadwal</span> UAS
            </TabsTrigger>
            <TabsTrigger value="akademik" className="gap-2">
              <CalendarRange className="h-4 w-4" />
              <span className="hidden sm:inline">Kalender</span> Akademik
            </TabsTrigger>
            {/* Tab Baru */}
            <TabsTrigger value="daftar-matkul" className="gap-2">
              <Library className="h-4 w-4" />
              <span className="hidden sm:inline">Daftar</span> Matkul
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="kuliah"
          className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500 outline-none">
          <JadwalDashboard fullSchedule={jadwalKuliah} />
        </TabsContent>

        <TabsContent
          value="uas"
          className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500 outline-none">
          <JadwalUAS />
        </TabsContent>

        <TabsContent
          value="akademik"
          className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500 outline-none">
          <KalenderAkademikView />
        </TabsContent>

        {/* Content Baru */}
        <TabsContent
          value="daftar-matkul"
          className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500 outline-none">
          <DaftarMatkulGallery />
        </TabsContent>
      </Tabs>
    </main>
  );
}
