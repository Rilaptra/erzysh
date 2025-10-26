// File: src/lib/utils/academic-search.ts

import type { Kegiatan, KalenderAkademik } from "@/types/kalender-akademik";

// --- REFACTOR #1: Hoist Enums & Helpers ---
// Enums dan helper functions ini konstan, jadi kita definisikan di luar
// fungsi utama. Ini jauh lebih efisien karena tidak perlu dibuat ulang
// setiap kali `cariKegiatan` dipanggil.

// --- FIX #1: Duplicate Enum Values ---
// Cara yang benar untuk membuat alias di TypeScript enum adalah dengan
// menunjuk ke member yang sudah ada.
enum BulanEnum {
  Januari = 1,
  Februari = 2,
  Maret = 3,
  April = 4,
  Mei = 5,
  Juni = 6,
  Juli = 7,
  Agustus = 8,
  September = 9,
  Oktober = 10,
  November = 11,
  Desember = 12,
  // --- ALIASES ---
  January = Januari,
  February = Februari,
  March = Maret,
  May = Mei,
  June = Juni,
  July = Juli,
  August = Agustus,
  October = Oktober,
  December = Desember,
  Jan = Januari,
  Feb = Februari,
  Mar = Maret,
  Apr = April,
  Jun = Juni,
  Jul = Juli,
  Aug = Agustus,
  Sep = September,
  Oct = Oktober,
  Nov = November,
  Dec = Desember,
}

enum HariEnum {
  Minggu = 0,
  Senin = 1,
  Selasa = 2,
  Rabu = 3,
  Kamis = 4,
  Jumat = 5,
  Sabtu = 6,
  // --- ALIASES ---
  Sunday = Minggu,
  Monday = Senin,
  Tuesday = Selasa,
  Wednesday = Rabu,
  Thursday = Kamis,
  Friday = Jumat,
  Saturday = Sabtu,
  Sun = Minggu,
  Mon = Senin,
  Tue = Selasa,
  Wed = Rabu,
  Thu = Kamis,
  Fri = Jumat,
  Sat = Sabtu,
}

const parseTanggal = (
  tanggalStr: string,
): {
  date?: Date;
  tahun?: number;
  bulan?: number;
  tanggal?: number;
} | null => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(tanggalStr)) {
    const date = new Date(tanggalStr);
    if (isNaN(date.getTime())) return null;
    return {
      date,
      tahun: date.getFullYear(),
      bulan: date.getMonth() + 1,
      tanggal: date.getDate(),
    };
  } else if (/^\d{4}-\d{2}$/.test(tanggalStr)) {
    const [tahunStr, bulanStr] = tanggalStr.split("-").map(Number);
    if (bulanStr < 1 || bulanStr > 12) return null;
    return { tahun: tahunStr, bulan: bulanStr };
  } else if (/^\d{4}$/.test(tanggalStr)) {
    return { tahun: Number(tanggalStr) };
  } else if (/^\d{2}$/.test(tanggalStr)) {
    const tgl = Number(tanggalStr);
    if (tgl < 1 || tgl > 31) return null;
    return { tanggal: tgl };
  }
  return null;
};

const validateEnum = (
  input: string | number,
  enumType: any,
  maxValidValue: number,
): number | null => {
  if (typeof input === "number") {
    if (input >= 0 && input <= maxValidValue) return input;
    else return null;
  } else if (typeof input === "string") {
    const key = input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
    const value = enumType[key as keyof typeof enumType];
    if (value !== undefined && value >= 0 && value <= maxValidValue)
      return value;
    else return null;
  }
  return null;
};

const isRangeMatch = (
  itemStart: Date,
  itemEnd: Date,
  filter: any,
): boolean => {
  const itemThnStart = itemStart.getFullYear();
  const itemBlnStart = itemStart.getMonth() + 1;
  const itemThnEnd = itemEnd.getFullYear();
  const itemBlnEnd = itemEnd.getMonth() + 1;

  if (filter.date) {
    return itemStart <= filter.date && itemEnd >= filter.date;
  }
  if (filter.tahun !== undefined && filter.bulan !== undefined) {
    // Logika kompleks untuk overlap bulan-tahun
    return (
      (itemThnStart < filter.tahun && itemThnEnd > filter.tahun) ||
      (itemThnStart === filter.tahun &&
        itemThnEnd > filter.tahun &&
        itemBlnStart <= filter.bulan) ||
      (itemThnStart < filter.tahun &&
        itemThnEnd === filter.tahun &&
        itemBlnEnd >= filter.bulan) ||
      (itemThnStart === filter.tahun &&
        itemThnEnd === filter.tahun &&
        itemBlnStart <= filter.bulan &&
        itemBlnEnd >= filter.bulan)
    );
  }
  if (filter.tahun !== undefined) {
    return itemThnStart <= filter.tahun && itemThnEnd >= filter.tahun;
  }
  if (filter.tanggal !== undefined) {
    // --- FIX #2: prefer-const ---
    // 'current' tidak di-reassign, hanya propertinya yang diubah (mutated).
    // Jadi, `const` lebih tepat di sini.
    const current = new Date(itemStart);
    while (current <= itemEnd) {
      if (current.getDate() === filter.tanggal) return true;
      current.setDate(current.getDate() + 1);
    }
    return false;
  }
  return true;
};

// --- Caching ---
let cache: Map<string, Kegiatan[]> | null = null;
let cachedData: KalenderAkademik | null = null;

/**
 * Mencari kegiatan akademik berdasarkan berbagai parameter termasuk rentang tanggal fleksibel.
 * (Deskripsi JSDoc lainnya tetap sama)
 */
function cariKegiatan(
  dataKalender: KalenderAkademik,
  options: {
    kegiatan?: string;
    tanggal_mulai?: string;
    tanggal_selesai?: string;
    tanggal_angka?: number;
    tahun?: number;
    bulan?: string | number;
    hari?: string | number;
    clearCache?: boolean;
  } = {},
): Kegiatan[] {
  const {
    kegiatan,
    tanggal_mulai,
    tanggal_selesai,
    tanggal_angka,
    tahun,
    bulan,
    hari,
    clearCache = false,
  } = options;

  // --- Validasi dan Parsing Input ---
  const bulanIndex =
    bulan !== undefined ? validateEnum(bulan, BulanEnum, 12) : null;
  if (bulan !== undefined && bulanIndex === null) {
    console.warn(`Bulan '${bulan}' tidak valid.`);
    return [];
  }

  const hariIndex = hari !== undefined ? validateEnum(hari, HariEnum, 6) : null;
  if (hari !== undefined && hariIndex === null) {
    console.warn(`Hari '${hari}' tidak valid.`);
    return [];
  }

  const tglAngkaFilter =
    tanggal_angka !== undefined
      ? tanggal_angka >= 1 && tanggal_angka <= 31
        ? tanggal_angka
        : null
      : null;
  if (tanggal_angka !== undefined && tglAngkaFilter === null) {
    console.warn(`Tanggal angka '${tanggal_angka}' tidak valid.`);
    return [];
  }

  const filterMulai = tanggal_mulai ? parseTanggal(tanggal_mulai) : null;
  if (tanggal_mulai && filterMulai === null) {
    console.warn(`Format tanggal_mulai '${tanggal_mulai}' tidak valid.`);
    return [];
  }

  const filterSelesai = tanggal_selesai ? parseTanggal(tanggal_selesai) : null;
  if (tanggal_selesai && filterSelesai === null) {
    console.warn(`Format tanggal_selesai '${tanggal_selesai}' tidak valid.`);
    return [];
  }

  // --- Cache ---
  // --- REFACTOR #2: Smarter Caching Key ---
  // Kunci cache sekarang hanya bergantung pada parameter pencarian.
  // Ini jauh lebih cepat daripada me-stringify seluruh objek dataKalender.
  const cacheKey = JSON.stringify(options);

  if (cache && cachedData === dataKalender && !clearCache) {
    const cachedResult = cache.get(cacheKey);
    if (cachedResult !== undefined) return cachedResult;
  } else {
    cache = new Map();
    cachedData = dataKalender;
  }

  // --- Pencarian ---
  const semuaKegiatan = [
    ...dataKalender.kalender_akademik.semester_gasal,
    ...dataKalender.kalender_akademik.semester_genap,
  ];

  const hasil = semuaKegiatan.filter((item) => {
    const itemStart = new Date(item.tanggal_mulai);
    const itemEnd = new Date(item.tanggal_selesai);

    if (
      kegiatan &&
      !item.kegiatan.toLowerCase().includes(kegiatan.toLowerCase())
    )
      return false;

    if (filterMulai && !isRangeMatch(itemStart, itemEnd, filterMulai))
      return false;
    if (filterSelesai && !isRangeMatch(itemStart, itemEnd, filterSelesai))
      return false;

    if (tglAngkaFilter) {
      const current = new Date(itemStart);
      let cocok = false;
      while (current <= itemEnd) {
        if (current.getDate() === tglAngkaFilter) {
          cocok = true;
          break;
        }
        current.setDate(current.getDate() + 1);
      }
      if (!cocok) return false;
    }

    if (
      tahun !== undefined &&
      (itemStart.getFullYear() > tahun || itemEnd.getFullYear() < tahun)
    )
      return false;

    if (bulanIndex !== null) {
      // Logika kompleks untuk mencocokkan bulan dalam rentang waktu
      const cocokBulan = isRangeMatch(itemStart, itemEnd, {
        tahun: tahun,
        bulan: bulanIndex,
      });
      if (!cocokBulan) return false;
    }

    if (hariIndex !== null) {
      const current = new Date(itemStart);
      let cocok = false;
      while (current <= itemEnd) {
        if (current.getDay() === hariIndex) {
          cocok = true;
          break;
        }
        current.setDate(current.getDate() + 1);
      }
      if (!cocok) return false;
    }

    return true;
  });

  if (cache) cache.set(cacheKey, hasil);
  return hasil;
}

export { cariKegiatan };