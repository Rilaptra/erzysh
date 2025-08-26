// src/components/Tugas/TugasForm.tsx
"use client";

// ... (import tetap sama)
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

export const TugasForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mataKuliahOptions,
}: TugasFormProps) => {
  // ... (state dan logic useEffect tetap sama)
  const [judul, setJudul] = useState("");
  const [mataKuliah, setMataKuliah] = useState("");
  const [kategori, setKategori] = useState<TugasKategori>("Kuliah");
  const [deadline, setDeadline] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const isEditing = !!initialData;
  useEffect(() => {
    if (initialData) {
      setJudul(initialData.judul);
      setMataKuliah(initialData.mataKuliah);
      setKategori(initialData.kategori);
      setDeadline(initialData.deadline.split("T")[0]);
      setDeskripsi(initialData.deskripsi);
    } else {
      setJudul("");
      setMataKuliah("");
      setKategori("Kuliah");
      setDeadline("");
      setDeskripsi("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = () => {
    if (!judul || !mataKuliah || !deadline) {
      toast.error("Mohon lengkapi Judul, Mata Kuliah, and Deadline.");
      return;
    }
    const deadlineISO = new Date(`${deadline}T23:59:59`).toISOString();

    // Kirim juga `initialData` sebagai data original untuk fitur Undo
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
      {/* --- PENAMBAHAN SCROLL DI SINI --- */}
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
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
