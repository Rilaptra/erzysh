export interface Matkul {
  kode: string;
  mataKuliah: string;
  sks: number;
  dosen: string;
  kelas: string;
  hari: string;
  mulai: string;
  selesai: string;
  ruang: string;
  quota?: number;
}

export interface Conflict {
  course1: Matkul;
  course2: Matkul;
}
