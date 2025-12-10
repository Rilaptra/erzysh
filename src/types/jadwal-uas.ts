export interface JadwalUASItem {
  no: number;
  mata_kuliah: string;
  sks: number;
  tanggal: string; // YYYY-MM-DD
  waktu: {
    mulai: string;
    selesai: string;
  };
  ruang: string;
}
