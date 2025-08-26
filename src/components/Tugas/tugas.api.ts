// src/components/Tugas/tugas.api.ts
import type { Tugas } from "@/types/tugas";
import type {
  ApiDbGetMessageResponse,
  ApiDbProcessedMessage,
} from "@/types/api-db-response";

// ID yang udah lo kasih
const CONTAINER_ID = "1409908765074919585";
const BOX_ID = "1409908859971309681";
const API_BASE_URL = `/api/database/${CONTAINER_ID}/${BOX_ID}`;

// Helper untuk mengubah data dari API ke format Tugas yang siap pakai
const transformApiToTugas = (apiData: ApiDbGetMessageResponse): Tugas => {
  if (!apiData.data) throw new Error("Data tugas tidak ditemukan.");
  const data = JSON.parse(apiData.data);
  return {
    id: apiData.id,
    judul: data.judul,
    mataKuliah: data.mataKuliah,
    kategori: data.kategori,
    deskripsi: data.deskripsi,
    deadline: data.deadline,
    isCompleted: data.isCompleted,
  };
};

// --- FUNGSI-FUNGSI CRUD UNTUK BERINTERAKSI DENGAN API ---

export const fetchTugas = async (): Promise<Tugas[]> => {
  const listRes = await fetch(API_BASE_URL);
  if (!listRes.ok) throw new Error("Gagal mengambil daftar tugas dari server.");

  const { data: tugasList }: { data: ApiDbProcessedMessage[] } =
    await listRes.json();

  if (!tugasList || tugasList.length === 0) {
    return [];
  }

  // Ambil detail untuk setiap tugas secara paralel biar cepat
  const detailPromises = tugasList.map((tugasInfo) =>
    fetch(`${API_BASE_URL}/${tugasInfo.id}`).then((res) => res.json()),
  );

  const allDetails: ApiDbGetMessageResponse[] =
    await Promise.all(detailPromises);

  return allDetails.map(transformApiToTugas);
};

export const createTugas = async (
  tugasData: Omit<Tugas, "id">,
): Promise<Tugas> => {
  const payload = {
    name: `${tugasData.judul.replace(/\s+/g, "-")}-${Date.now()}.json`, // Nama file unik
    content: JSON.stringify(tugasData),
  };

  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) throw new Error("Gagal membuat tugas baru di server.");

  const createdMessage: { details: { id: string } } = await res.json();

  return {
    ...tugasData,
    id: createdMessage.details.id,
  };
};

export const updateTugas = async (tugas: Tugas): Promise<Tugas> => {
  const { id, ...content } = tugas;
  const payload = {
    name: `${tugas.judul.replace(/\s+/g, "-")}-${Date.now()}.json`,
    content: JSON.stringify(content),
  };

  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) throw new Error("Gagal memperbarui tugas di server.");
  return tugas;
};

export const deleteTugas = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Gagal menghapus tugas dari server.");
};
