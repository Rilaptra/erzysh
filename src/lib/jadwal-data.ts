export interface RuangKelas {
  id_ruang: string;
  gedung_ft: number;
  lantai: number;
  nomor_ruang: string;
  keterangan?: string;
}

export interface DosenProfile {
  nama: string;
  gelar: {
    belakang: string[];
  };
}

export interface Dosen {
  full_name: string;
  profile: DosenProfile;
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

export const jadwalKuliah: Jadwal = {
  "Senin": [
    {
      "matkul": "Menggambar Bangunan Sipil (T*)",
      "sks": 2,
      "jam_pelajaran": {
        "mulai": "08:42",
        "selesai": "10:23"
      },
      "ruang_kelas": {
        "id_ruang": "E.03.4.01 (Lab. Komputer)",
        "gedung_ft": 3,
        "lantai": 4,
        "nomor_ruang": "01",
        "keterangan": "Lab. Komputer"
      },
      "dosen": {
        "full_name": "Abul Fida Ismaili, S.T., MSc.",
        "profile": {
          "nama": "Abul Fida Ismaili",
          "gelar": {
            "belakang": [
              "S.T.",
              "MSc."
            ]
          }
        },
        "karakteristik": [
          "Pintar",
          "cara menjelaskannya mudah dipahami",
          "sangat disiplin soal waktu (on-time)"
        ]
      }
    },
    {
      "matkul": "Ilmu Ukur Tanah",
      "sks": 2,
      "jam_pelajaran": {
        "mulai": "10:24",
        "selesai": "12:05"
      },
      "ruang_kelas": {
        "id_ruang": "E.03.3.05",
        "gedung_ft": 3,
        "lantai": 3,
        "nomor_ruang": "05"
      },
      "dosen": {
        "full_name": "Ety Fitriyani, S.T., M.Eng.",
        "profile": {
          "nama": "Ety Fitriyani",
          "gelar": {
            "belakang": [
              "S.T.",
              "M.Eng."
            ]
          }
        },
        "karakteristik": [
          "Baik",
          "memberikan tugas dalam jumlah yang cukup banyak"
        ]
      }
    },
    {
      "matkul": "Kimia Dasar",
      "sks": 2,
      "jam_pelajaran": {
        "mulai": "14:42",
        "selesai": "16:23"
      },
      "ruang_kelas": {
        "id_ruang": "E.03.4.01 (Lab. Komputer)",
        "gedung_ft": 3,
        "lantai": 4,
        "nomor_ruang": "01",
        "keterangan": "Lab. Komputer"
      },
      "dosen": {
        "full_name": "Ety Fitriyani, S.T., M.Eng.",
        "profile": {
          "nama": "Ety Fitriyani",
          "gelar": {
            "belakang": [
              "S.T.",
              "M.Eng."
            ]
          }
        },
        "karakteristik": [
          "Baik",
          "memberikan tugas dalam jumlah yang cukup banyak"
        ]
      }
    }
  ],
  "Selasa": [
    {
      "matkul": "Matematika I",
      "sks": 3,
      "jam_pelajaran": {
        "mulai": "13:00",
        "selesai": "15:30"
      },
      "ruang_kelas": {
        "id_ruang": "E.03.3.06",
        "gedung_ft": 3,
        "lantai": 3,
        "nomor_ruang": "06"
      },
      "dosen": {
        "full_name": "Venesa Mega Emilia, S.T., M.T.",
        "profile": {
          "nama": "Venesa Mega Emilia",
          "gelar": {
            "belakang": [
              "S.T.",
              "M.T."
            ]
          }
        },
        "karakteristik": [
          "Tidak diketahui"
        ]
      }
    },
    {
      "matkul": "Fisika Dasar",
      "sks": 2,
      "jam_pelajaran": {
        "mulai": "15:33",
        "selesai": "17:14"
      },
      "ruang_kelas": {
        "id_ruang": "E.03.4.01 (Lab. Komputer)",
        "gedung_ft": 3,
        "lantai": 4,
        "nomor_ruang": "01",
        "keterangan": "Lab. Komputer"
      },
      "dosen": {
        "full_name": "Abul Fida Ismaili, S.T., MSc.",
        "profile": {
          "nama": "Abul Fida Ismaili",
          "gelar": {
            "belakang": [
              "S.T.",
              "MSc."
            ]
          }
        },
        "karakteristik": [
          "Pintar",
          "cara menjelaskannya mudah dipahami",
          "sangat disiplin soal waktu (on-time)"
        ]
      }
    }
  ],
  "Rabu": [
    {
      "matkul": "Pendidikan Agama Islam",
      "sks": 2,
      "jam_pelajaran": {
        "mulai": "12:30",
        "selesai": "14:10"
      },
      "ruang_kelas": {
        "id_ruang": "E.03.3.04",
        "gedung_ft": 3,
        "lantai": 3,
        "nomor_ruang": "04"
      },
      "dosen": {
        "full_name": "Mohammad 'Ulyan, S.Pd.I., M.Pd.",
        "profile": {
          "nama": "Mohammad 'Ulyan",
          "gelar": {
            "belakang": [
              "S.Pd.I.",
              "M.Pd."
            ]
          }
        },
        "karakteristik": [
          "Sangat sabar",
          "terbuka untuk diajak berdiskusi"
        ]
      }
    },
    {
      "matkul": "Mekanika Bahan",
      "sks": 2,
      "jam_pelajaran": {
        "mulai": "14:42",
        "selesai": "16:23"
      },
      "ruang_kelas": {
        "id_ruang": "E.03.3.06",
        "gedung_ft": 3,
        "lantai": 3,
        "nomor_ruang": "06"
      },
      "dosen": {
        "full_name": "Lalu Samsul Aswadi, MEng.",
        "profile": {
          "nama": "Lalu Samsul Aswadi",
          "gelar": {
            "belakang": [
              "MEng."
            ]
          }
        },
        "karakteristik": [
          "Santai",
          "suka bercanda saat mengajar",
          "membuat suasana kelas tidak tegang"
        ]
      }
    }
  ],
  "Kamis": [
    {
      "matkul": "Praktikum Ilmu Ukur Tanah",
      "sks": 1,
      "jam_pelajaran": {
        "mulai": "13:00",
        "selesai": "15:50"
      },
      "ruang_kelas": {
        "id_ruang": "E.03.2.05 (Lab. Hidrolika dan Geodesi)",
        "gedung_ft": 3,
        "lantai": 2,
        "nomor_ruang": "05",
        "keterangan": "Lab. Hidrolika dan Geodesi"
      },
      "dosen": {
        "full_name": "Hulfa Istikomah, S.T., M.T.",
        "profile": {
          "nama": "Hulfa Istikomah",
          "gelar": {
            "belakang": [
              "S.T.",
              "M.T."
            ]
          }
        },
        "karakteristik": [
          "Tidak diketahui"
        ]
      }
    }
  ],
  "Jumat": [
    {
      "matkul": "Dasar-Dasar Rekayasa Transportasi",
      "sks": 2,
      "jam_pelajaran": {
        "mulai": "08:42",
        "selesai": "10:23"
      },
      "ruang_kelas": {
        "id_ruang": "E.03.4.01 (Lab. Komputer)",
        "gedung_ft": 3,
        "lantai": 4,
        "nomor_ruang": "01",
        "keterangan": "Lab. Komputer"
      },
      "dosen": {
        "full_name": "Yusfita Chrisnawati, S.Pd.T., M.Sc.",
        "profile": {
          "nama": "Yusfita Chrisnawati",
          "gelar": {
            "belakang": [
              "S.Pd.T.",
              "M.Sc."
            ]
          }
        },
        "karakteristik": [
          "Sangat detail saat mengoreksi",
          "laporan yang dikumpulkan harus rapi"
        ]
      }
    },
    {
      "matkul": "Pancasila",
      "sks": 2,
      "jam_pelajaran": {
        "mulai": "14:20",
        "selesai": "16:00"
      },
      "ruang_kelas": {
        "id_ruang": "E.03.3.04",
        "gedung_ft": 3,
        "lantai": 3,
        "nomor_ruang": "04"
      },
      "dosen": {
        "full_name": "Delfiyan Widiyanto, S.Pd., M.Pd.",
        "profile": {
          "nama": "Delfiyan Widiyanto",
          "gelar": {
            "belakang": [
              "S.Pd.",
              "M.Pd."
            ]
          }
        },
        "karakteristik": [
          "Tidak diketahui"
        ]
      }
    }
  ]
};
