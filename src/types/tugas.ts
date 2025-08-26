// src/types/tugas.ts

export type TugasKategori = "Kuliah" | "Tugas Prodi" | "Lainnya";

export interface Tugas {
  id: string; // uuid
  mataKuliah: string;
  kategori: TugasKategori;
  judul: string;
  deskripsi: string;
  deadline: string; // ISO String date
  isCompleted: boolean;
}
