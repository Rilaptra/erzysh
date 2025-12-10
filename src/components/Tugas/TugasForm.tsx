// src/components/Tugas/TugasForm.tsx
"use client";

import { useEffect, useState } from "react";
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
import {
  Sparkles,
  Loader2,
  Calendar,
  Clock,
  BookOpen,
  Tag,
  Type,
  AlignLeft,
  Save,
} from "lucide-react";
import { cn } from "@/lib/cn";

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

// Helper untuk memisahkan ISO string
const splitISOString = (isoString: string) => {
  if (!isoString) return ["", ""];
  const date = new Date(isoString);
  // Handle timezone offset manually simple way or just use split if stored as ISO
  // Simplest for input type="date": YYYY-MM-DD
  const datePart = date.toISOString().split("T")[0];
  const timePart = date.toTimeString().slice(0, 5);
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
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [deskripsi, setDeskripsi] = useState("");
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setJudul(initialData.judul);
      setMataKuliah(initialData.mataKuliah);
      setKategori(initialData.kategori);
      const [d, t] = splitISOString(initialData.deadline);
      setDeadlineDate(d);
      setDeadlineTime(t);
      setDeskripsi(initialData.deskripsi);
    } else {
      // Reset form
      setJudul("");
      setMataKuliah("");
      setKategori("Kuliah");
      setDeadlineDate("");
      setDeadlineTime("23:59");
      setDeskripsi("");
    }
  }, [initialData, isOpen]);

  const handleGenerateTitle = async () => {
    if (!mataKuliah || !deskripsi) {
      toast.warning("Info Kurang", {
        description: "Isi Mata Kuliah dan Deskripsi dulu biar AI bisa mikir.",
      });
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const response = await fetch("/api/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mataKuliah, deskripsi }),
      });

      if (!response.ok) throw new Error("Gagal request ke server.");

      const data = await response.json();
      setJudul(data.title);
      toast.success("Judul Siap!", {
        icon: <Sparkles className="h-4 w-4 text-amber-400" />,
        description: "Judul berhasil dibuat otomatis.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Gagal generate judul.");
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleSubmit = () => {
    if (!judul || !mataKuliah || !deadlineDate) {
      toast.error("Data Belum Lengkap", {
        description: "Pastikan Judul, Matkul, dan Deadline terisi.",
      });
      return;
    }

    // Gabungkan Date & Time
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
      <DialogContent className="border-border/50 bg-card/95 max-h-[90vh] gap-0 overflow-y-auto border-2 p-0 shadow-2xl backdrop-blur-xl sm:max-w-lg">
        {/* HEADER */}
        <DialogHeader className="border-border/50 bg-muted/20 border-b p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-2xl font-black tracking-tight">
            {isEditing ? (
              <>
                <span className="text-teal-500">Edit</span> Misi
              </>
            ) : (
              <>
                <span className="text-indigo-500">New</span> Mission
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isEditing
              ? "Perbarui detail tugas ini."
              : "Tambahkan tugas baru ke daftar antrian."}
          </DialogDescription>
        </DialogHeader>

        {/* BODY */}
        <div className="flex flex-col gap-5 p-6">
          {/* 1. SECTION: MATKUL & KATEGORI (2 Kolom) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
                <BookOpen className="h-3.5 w-3.5" /> Mata Kuliah
              </Label>
              <Select onValueChange={setMataKuliah} value={mataKuliah}>
                <SelectTrigger className="bg-background/50 border-muted-foreground/20">
                  <SelectValue placeholder="Pilih Matkul" />
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
              <Label className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
                <Tag className="h-3.5 w-3.5" /> Kategori
              </Label>
              <Select
                onValueChange={(val: TugasKategori) => setKategori(val)}
                value={kategori}
              >
                <SelectTrigger className="bg-background/50 border-muted-foreground/20">
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
          </div>

          {/* 2. SECTION: DESKRIPSI (Ditaruh tengah biar flow AI enak) */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="deskripsi"
              className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold"
            >
              <AlignLeft className="h-3.5 w-3.5" /> Deskripsi Tugas
            </Label>
            <Textarea
              id="deskripsi"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="bg-background/50 border-muted-foreground/20 min-h-[100px] resize-none focus-visible:ring-indigo-500"
              placeholder="Contoh: Buat makalah tentang struktur jembatan..."
            />
          </div>

          {/* 3. SECTION: JUDUL (AI Powered) */}
          <div className="relative flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="judul"
                className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold"
              >
                <Type className="h-3.5 w-3.5" /> Judul Tugas
              </Label>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateTitle}
                disabled={isGeneratingTitle}
                className={cn(
                  "h-6 gap-1.5 rounded-full border border-amber-500/20 bg-linear-to-r from-amber-500/10 to-orange-500/10 px-2 text-[10px] text-amber-600 transition-all hover:border-amber-500/50 hover:text-amber-700",
                  isGeneratingTitle && "cursor-wait opacity-70",
                )}
              >
                {isGeneratingTitle ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {isGeneratingTitle ? "Thinking..." : "Auto-Title AI"}
              </Button>
            </div>
            <Input
              id="judul"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul tugas..."
              className="bg-background/50 border-muted-foreground/20 focus-visible:ring-indigo-500"
            />
          </div>

          {/* 4. SECTION: DEADLINE (2 Kolom) */}
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-3 flex flex-col gap-2">
              <Label
                htmlFor="deadline-date"
                className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold"
              >
                <Calendar className="h-3.5 w-3.5" /> Tanggal
              </Label>
              <Input
                id="deadline-date"
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="bg-background/50 border-muted-foreground/20"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label
                htmlFor="deadline-time"
                className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold"
              >
                <Clock className="h-3.5 w-3.5" /> Jam
              </Label>
              <Input
                id="deadline-time"
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="bg-background/50 border-muted-foreground/20 text-center"
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="bg-muted/20 border-border/50 gap-2 border-t p-6 pt-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="hover:bg-muted/50"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            className="gap-2 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" />
            {isEditing ? "Simpan Perubahan" : "Simpan Tugas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
