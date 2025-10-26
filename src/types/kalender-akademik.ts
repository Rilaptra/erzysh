// Definisi tipe data untuk kegiatan
export interface Kegiatan {
  nomor: number;
  kegiatan: string;
  tanggal_mulai: string; // Format: YYYY-MM-DD
  tanggal_selesai: string; // Format: YYYY-MM-DD
  keterangan?: string;
  catatan?: string;
}

export interface KalenderAkademik {
  tahun_akademik: string;
  kalender_akademik: {
    semester_gasal: Kegiatan[];
    semester_genap: Kegiatan[];
  };
}
