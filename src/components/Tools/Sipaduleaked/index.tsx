// src/components/Tools/Sipaduleaked/index.tsx
"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Tipe data untuk setiap mahasiswa
interface StudentData {
  npm: string;
  imageUrl: string;
}

// Komponen untuk menampilkan satu kartu mahasiswa
const StudentCard = ({ student }: { student: StudentData }) => {
  return (
    <div className="group overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
      <div className="relative aspect-[3/4] w-full bg-neutral-100 dark:bg-neutral-700">
        <Image
          src={student.imageUrl}
          alt={`Foto Mahasiswa ${student.npm}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          // Fallback jika gambar gagal dimuat
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/300x400.png?text=Not+Found";
          }}
        />
      </div>
      <div className="p-3 text-center">
        <p className="font-mono text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {student.npm}
        </p>
      </div>
    </div>
  );
};

// Komponen utama
export default function SipaduLeakedPage() {
  // State untuk menyimpan nilai input dari pengguna
  const [params, setParams] = useState({
    kode1: "5", // Default: Kode Fakultas Teknik
    kode2: "3", // Default: Kode Prodi Teknik Sipil
    start: "1", // Default: Nomor urut awal
    end: "150", // Default: Nomor urut akhir
  });

  // State untuk menyimpan nilai yang akan digunakan untuk generate list
  const [activeParams, setActiveParams] = useState(params);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setParams((prev) => ({ ...prev, [id]: value }));
  };

  const handleApplyParams = () => {
    const startNum = parseInt(params.start, 10);
    const endNum = parseInt(params.end, 10);

    if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
      toast.error("Rentang Nomor Urut tidak valid.", {
        description: "Pastikan nomor awal lebih kecil dari nomor akhir.",
      });
      return;
    }

    if (endNum - startNum > 500) {
      toast.warning("Rentang terlalu besar.", {
        description:
          "Mungkin akan menyebabkan browser lambat. Maksimal 500 data.",
      });
      // Tetap lanjutkan, tapi beri peringatan
    }

    setActiveParams(params);
    toast.success("Filter diterapkan!");
  };

  // Gunakan useMemo agar daftar mahasiswa tidak dibuat ulang pada setiap render
  const students = useMemo(() => {
    const data: StudentData[] = [];
    const { kode1, kode2, start, end } = activeParams;
    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);

    if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
      return [];
    }

    for (let i = startNum; i <= endNum; i++) {
      // Format nomor urut menjadi 3 digit (e.g., 1 -> 001, 10 -> 010)
      const nomorUrut = i.toString().padStart(3, "0");
      const npm = `250${kode1}0${kode2}0${nomorUrut}`;
      const imageUrl = `https://smart.untidar.ac.id/web_publicfiles/mahasiswa/foto/2025/${npm}.jpg`;

      data.push({ npm, imageUrl });
    }
    return data;
  }, [activeParams]);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8 dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-800 sm:text-4xl dark:text-neutral-100">
            Sipadu Leaked Viewer
          </h1>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
            Menampilkan foto mahasiswa angkatan 2025 berdasarkan pola NPM.
          </p>
        </div>

        {/* --- FORM KUSTOMISASI --- */}
        <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="kode1" className="dark:text-neutral-300">
                Kode Fakultas
              </Label>
              <Input
                id="kode1"
                value={params.kode1}
                onChange={handleInputChange}
                placeholder="e.g., 5"
                className="dark:bg-neutral-700 dark:text-neutral-200"
              />
            </div>
            <div>
              <Label htmlFor="kode2" className="dark:text-neutral-300">
                Kode Prodi
              </Label>
              <Input
                id="kode2"
                value={params.kode2}
                onChange={handleInputChange}
                placeholder="e.g., 3"
                className="dark:bg-neutral-700 dark:text-neutral-200"
              />
            </div>
            <div>
              <Label htmlFor="start" className="dark:text-neutral-300">
                No. Urut Awal
              </Label>
              <Input
                id="start"
                value={params.start}
                onChange={handleInputChange}
                placeholder="e.g., 1"
                className="dark:bg-neutral-700 dark:text-neutral-200"
              />
            </div>
            <div>
              <Label htmlFor="end" className="dark:text-neutral-300">
                No. Urut Akhir
              </Label>
              <Input
                id="end"
                value={params.end}
                onChange={handleInputChange}
                placeholder="e.g., 150"
                className="dark:bg-neutral-700 dark:text-neutral-200"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleApplyParams}
              className="bg-teal-muted text-dark-shale hover:bg-teal-muted/90"
            >
              Terapkan
            </Button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {students.map((student) => (
            <StudentCard key={student.npm} student={student} />
          ))}
        </div>
      </div>
    </main>
  );
}
