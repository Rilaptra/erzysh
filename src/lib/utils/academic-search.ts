// src/lib/utils/academic-search.ts
import type { Kegiatan, KalenderAkademik } from "@/types/kalender-akademik";

// --- Caching ---
let cache: Map<string, Kegiatan[]> | null = null;
let cachedData: KalenderAkademik | null = null;

/**
 * Mencari kegiatan akademik berdasarkan berbagai parameter termasuk rentang tanggal fleksibel.
 *
 * @param {KalenderAkademik} dataKalender - Data kalender akademik dalam bentuk objek JSON.
 * @param {Object} [options={}] - Opsi pencarian.
 * @param {string} [options.kegiatan] - Nama kegiatan untuk dicari (case-insensitive).
 * @param {string} [options.tanggal_mulai] - Tanggal mulai acuan (format: YYYY-MM-DD, YYYY-MM, YYYY, DD).
 * @param {string} [options.tanggal_selesai] - Tanggal selesai acuan (format: YYYY-MM-DD, YYYY-MM, YYYY, DD).
 * @param {number} [options.tanggal_angka] - Hanya tanggal (1-31).
 * @param {number} [options.tahun] - Tahun (contoh: 2025).
 * @param {(string | number)} [options.bulan] - Bulan (angka 1-12 atau string nama bulan).
 * @param {(string | number)} [options.hari] - Hari dalam minggu (angka 0-6 atau string nama hari).
 * @param {boolean} [options.clearCache=false] - Jika true, cache akan dihapus sebelum pencarian baru.
 * @returns {Kegiatan[]} Array kegiatan yang cocok dengan kriteria pencarian.
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
  // --- Enums untuk Pemetaan ---
  enum BulanEnum {
    // Bahasa Indonesia
    Januari = 1,
    Februari,
    Maret,
    April,
    Mei,
    Juni,
    Juli,
    Agustus,
    September,
    Oktober,
    November,
    Desember,
    // Bahasa Inggris
    January = 1,
    February,
    March,
    May = 5,
    June,
    July,
    August,
    October = 10,
    December = 12,
    // Singkatan
    Jan = 1,
    Feb,
    Mar,
    Apr,
    Jun = 6,
    Jul,
    Aug,
    Sep,
    Oct,
    Nov,
    Dec,
  }

  enum HariEnum {
    // Bahasa Indonesia
    Minggu = 0,
    Senin,
    Selasa,
    Rabu,
    Kamis,
    Jumat,
    Sabtu,
    // Bahasa Inggris
    Sunday,
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    // Singkatan
    Sun = 0,
    Mon,
    Tue,
    Wed,
    Thu,
    Fri,
    Sat,
  }

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

  // --- Sub-routines (Fungsi dalam fungsi) ---
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
      if (isNaN(date.getTime())) return null; // Validasi tanggal
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
    const itemTglStart = itemStart.getDate();
    const itemThnEnd = itemEnd.getFullYear();
    const itemBlnEnd = itemEnd.getMonth() + 1;
    const itemTglEnd = itemEnd.getDate();

    // Cocokkan berdasarkan tanggal lengkap (YYYY-MM-DD)
    if (filter.date) {
      return itemStart <= filter.date && itemEnd >= filter.date;
    }
    // Cocokkan berdasarkan tahun dan bulan (YYYY-MM)
    if (filter.tahun !== undefined && filter.bulan !== undefined) {
      return (
        (itemThnStart === filter.tahun && itemBlnStart === filter.bulan) ||
        (itemThnEnd === filter.tahun && itemBlnEnd === filter.bulan) ||
        (itemThnStart < filter.tahun && itemThnEnd > filter.tahun) ||
        (itemThnStart === filter.tahun &&
          itemThnEnd === filter.tahun &&
          itemBlnStart <= filter.bulan &&
          itemBlnEnd >= filter.bulan) ||
        (itemThnStart === filter.tahun &&
          itemThnEnd > filter.tahun &&
          itemBlnStart <= filter.bulan) ||
        (itemThnStart < filter.tahun &&
          itemThnEnd === filter.tahun &&
          itemBlnEnd >= filter.bulan)
      );
    }
    // Cocokkan berdasarkan tahun (YYYY)
    if (filter.tahun !== undefined) {
      return itemThnStart <= filter.tahun && itemThnEnd >= filter.tahun;
    }
    // Cocokkan berdasarkan tanggal angka (DD)
    if (filter.tanggal !== undefined) {
      let current = new Date(itemStart);
      while (current <= itemEnd) {
        if (current.getDate() === filter.tanggal) return true;
        current.setDate(current.getDate() + 1);
      }
      return false;
    }
    return true; // Jika tidak ada filter tanggal, anggap cocok
  };

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
  const cacheKey = JSON.stringify({
    dataRef: dataKalender,
    params: {
      kegiatan,
      tanggal_mulai,
      tanggal_selesai,
      tanggal_angka,
      tahun,
      bulanIndex,
      hariIndex,
    },
  });

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

    // Filter Nama Kegiatan
    if (
      kegiatan &&
      !item.kegiatan.toLowerCase().includes(kegiatan.toLowerCase())
    )
      return false;

    // Filter Rentang Tanggal (Mulai & Selesai)
    if (filterMulai && !isRangeMatch(itemStart, itemEnd, filterMulai))
      return false;
    if (filterSelesai && !isRangeMatch(itemStart, itemEnd, filterSelesai))
      return false;

    // Filter Tanggal Angka (Hanya Tanggal)
    if (tglAngkaFilter) {
      let current = new Date(itemStart);
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

    // Filter Tahun Global
    if (
      tahun !== undefined &&
      (itemStart.getFullYear() > tahun || itemEnd.getFullYear() < tahun)
    )
      return false;

    // Filter Bulan Global
    if (bulanIndex !== null) {
      const itemThnStart = itemStart.getFullYear();
      const itemBlnStart = itemStart.getMonth() + 1;
      const itemThnEnd = itemEnd.getFullYear();
      const itemBlnEnd = itemEnd.getMonth() + 1;
      const thn = tahun; // Alias untuk konsistensi
      if (thn === undefined) {
        // Jika tahun global tidak ditentukan, cocokkan bulan di *tahun manapun*
        if (itemBlnStart > bulanIndex || itemBlnEnd < bulanIndex) return false;
      } else {
        // Jika tahun global ditentukan, cocokkan bulan dan tahun
        if (
          !(
            (itemThnStart === thn && itemBlnStart === bulanIndex) ||
            (itemThnEnd === thn && itemBlnEnd === bulanIndex) ||
            (itemThnStart < thn && itemThnEnd > thn) ||
            (itemThnStart === thn &&
              itemThnEnd === thn &&
              itemBlnStart <= bulanIndex &&
              itemBlnEnd >= bulanIndex) ||
            (itemThnStart === thn &&
              itemThnEnd > thn &&
              itemBlnStart <= bulanIndex) ||
            (itemThnStart < thn &&
              itemThnEnd === thn &&
              itemBlnEnd >= bulanIndex)
          )
        )
          return false;
      }
    }

    // Filter Hari dalam Minggu
    if (hariIndex !== null) {
      let current = new Date(itemStart);
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

    return true; // Jika semua filter lolos
  });

  // Simpan ke cache
  if (cache) cache.set(cacheKey, hasil);
  return hasil;
}

export { cariKegiatan };
