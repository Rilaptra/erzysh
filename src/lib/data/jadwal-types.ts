// src/lib/data/jadwal-types.ts

// Tipe untuk struktur data asli dari jadwal.json
interface JadwalItemJson {
  jadwal: {
    mulai: string;
    selesai: string;
  };
  kelas: string;
  nama_matkul: string;
  dosen: string;
  ruang: string;
  detail_ruang: {
    gedung: string;
    lantai: string;
    nomor_ruangan: string;
  };
  karakteristik_dosen: string[];
}

export type JadwalJson = Record<string, JadwalItemJson[]>;

// Tipe yang akan digunakan oleh komponen-komponen React (setelah transformasi)
export interface RuangKelas {
  id_ruang: string;
  gedung_ft: number;
  lantai: number;
  nomor_ruang: string;
  keterangan?: string;
}

export interface Dosen {
  full_name: string;
  karakteristik: string[];
}

export interface MataKuliah {
  matkul: string;
  sks: number;
  jam_pelajaran: {
    mulai: string;
    selesai: string;
  };
  ruang_kelas: RuangKelas;
  dosen: Dosen;
}

export type Jadwal = Record<string, MataKuliah[]>;
