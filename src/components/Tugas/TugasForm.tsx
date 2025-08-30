// src/components/Tugas/TugasForm.tsx
"use client";

import { Tugas, TugasKategori } from "@/types/tugas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface TugasFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    tugasData: Omit<Tugas, "id" | "isCompleted"> & { id?: string },
    originalData?: Tugas,
  ) => void;
  initialData?: Tugas | null;
  mataKuliahOptions: string[];
}
const kategoriOptions: TugasKategori[] = ["Kuliah", "Tugas Prodi", "Lainnya"];

// Helper untuk memisahkan ISO string menjadi [YYYY-MM-DD, HH:mm]
const splitISOString = (isoString: string) => {
  if (!isoString) return ["", ""];
  const date = new Date(isoString);
  const datePart = date.toISOString().split("T")[0];
  const timePart = date.toTimeString().split(" ")[0].substring(0, 5);
  return [datePart, timePart];
};

export const TugasForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mataKuliahOptions,
}: TugasFormProps) => {
  const [judul, setJudul] = useState("");
  const [mataKuliah, setMataKuliah] = useState("");
  const [kategori, setKategori] = useState<TugasKategori>("Kuliah");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("23:59"); // Default waktu
  const [deskripsi, setDeskripsi] = useState("");
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setJudul(initialData.judul);
      setMataKuliah(initialData.mataKuliah);
      setKategori(initialData.kategori);
      const [datePart, timePart] = splitISOString(initialData.deadline);
      setDeadlineDate(datePart);
      setDeadlineTime(timePart);
      setDeskripsi(initialData.deskripsi);
    } else {
      setJudul("");
      setMataKuliah("");
      setKategori("Kuliah");
      setDeadlineDate("");
      setDeadlineTime("23:59"); // Reset ke default
      setDeskripsi("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = () => {
    if (!judul || !mataKuliah || !deadlineDate) {
      toast.error("Mohon lengkapi Judul, Mata Kuliah, dan Tanggal Deadline.");
      return;
    }
    const deadlineISO = new Date(
      `${deadlineDate}T${deadlineTime || "00:00"}:00`,
    ).toISOString();

    onSubmit(
      {
        id: initialData?.id,
        judul,
        mataKuliah,
        kategori,
        deadline: deadlineISO,
        deskripsi,
      },
      initialData || undefined,
    );

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Tugas" : "Tambah Tugas Baru"}
          </DialogTitle>
          <DialogDescription>Isi detail tugas di bawah ini.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="judul">Judul</Label>
            <Input
              id="judul"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="matkul">Mata Kuliah</Label>
            <Select onValueChange={setMataKuliah} value={mataKuliah}>
              <SelectTrigger id="matkul">
                <SelectValue placeholder="Pilih Mata Kuliah" />
              </SelectTrigger>
              <SelectContent>
                {mataKuliahOptions.map((mk) => (
                  <SelectItem key={mk} value={mk}>
                    {mk}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="kategori">Kategori</Label>
            <Select
              onValueChange={(val: TugasKategori) => setKategori(val)}
              value={kategori}
            >
              <SelectTrigger id="kategori">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                {kategoriOptions.map((kat) => (
                  <SelectItem key={kat} value={kat}>
                    {kat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* --- PERUBAHAN DI SINI --- */}
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 flex flex-col gap-2">
              <Label htmlFor="deadline-date">Tanggal Deadline</Label>
              <Input
                id="deadline-date"
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="deadline-time">Waktu</Label>
              <Input
                id="deadline-time"
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
              />
            </div>
          </div>
          {/* --- AKHIR PERUBAHAN --- */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Simpan Perubahan" : "Buat Tugas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
