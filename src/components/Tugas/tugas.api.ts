// src/components/Tugas/tugas.api.ts
import type { Tugas } from "@/types/tugas";

const CONTAINER_ID = "1409908765074919585";
const BOX_ID = "1409908859971309681";
const API_BASE_URL = `/api/database/${CONTAINER_ID}/${BOX_ID}`;

export const fetchTugas = async (): Promise<Tugas[]> => {
  // Langsung panggil dengan ?full=true. Hanya 1 API call!
  const res = await fetch(`${API_BASE_URL}?full=true`);
  if (!res.ok) throw new Error("Gagal mengambil daftar tugas dari server.");

  const { data } = await res.json();
  return data || [];
};

export const createTugas = async (
  tugasData: Omit<Tugas, "id">,
): Promise<Tugas> => {
  const payload = {
    name: `${tugasData.judul.replace(/\s+/g, "-")}-${Date.now()}.json`,
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
