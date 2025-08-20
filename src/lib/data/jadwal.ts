// src/lib/data/jadwal.ts
import jadwalData from "./jadwal.json";
import type { Jadwal, MataKuliah, JadwalJson } from "./jadwal-types";

/**
 * Mengubah data dari jadwal.json ke format yang kompatibel dengan komponen UI.
 * @param jsonData Data asli dari file JSON.
 * @returns Objek jadwal yang sudah ditransformasi.
 */
function transformJadwal(jsonData: JadwalJson): Jadwal {
  const transformedJadwal: Jadwal = {};

  for (const hari in jsonData) {
    if (Object.prototype.hasOwnProperty.call(jsonData, hari)) {
      transformedJadwal[hari] = jsonData[hari].map(
        (item): MataKuliah => ({
          matkul: item.nama_matkul,
          // SKS tidak ada di JSON baru, kita beri nilai default 0 atau bisa disesuaikan
          sks: 0,
          jam_pelajaran: {
            mulai: item.jadwal.mulai.substring(0, 5), // Ambil HH:mm
            selesai: item.jadwal.selesai.substring(0, 5), // Ambil HH:mm
          },
          ruang_kelas: {
            id_ruang: item.ruang,
            gedung_ft: parseInt(item.detail_ruang.gedung.split(" ")[2], 10),
            lantai: parseInt(item.detail_ruang.lantai, 10),
            nomor_ruang: item.detail_ruang.nomor_ruangan,
            keterangan: item.ruang.match(/\((.*?)\)/)?.[1] || undefined,
          },
          dosen: {
            full_name: item.dosen,
            karakteristik: item.karakteristik_dosen,
          },
        }),
      );
    }
  }
  return transformedJadwal;
}

export const jadwalKuliah = transformJadwal(jadwalData);
