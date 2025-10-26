// ================================================
// FILE: src/components/Tugas/tugas.api.ts
// ================================================
// src/components/Tugas/tugas.api.ts
import type { Tugas } from "@/types/tugas";

const CONTAINER_ID = "1409908765074919585";
const BOX_ID = "1409908859971309681";
const API_BASE_URL = `/api/database/${CONTAINER_ID}/${BOX_ID}`;

// Fungsi ini sekarang memanggil API BROKER kita, bukan QStash langsung
async function scheduleNotification(taskId: string, deadline: string) {
  try {
    const res = await fetch('/api/schedule-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, deadline }),
    });

    if (!res.ok) {
      throw new Error('Failed to schedule notification via backend.');
    }

    const { messageId } = await res.json();
    return messageId || null;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
}

// Fungsi ini juga memanggil API BROKER kita
async function cancelNotification(qstashMessageId: string) {
  if (!qstashMessageId) return;

  try {
    await fetch('/api/schedule-notification', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qstashMessageId }),
    });
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
}

export const fetchTugas = async (): Promise<Tugas[]> => {
  const res = await fetch(`${API_BASE_URL}?full=true`);
  if (!res.ok) throw new Error("Gagal mengambil daftar tugas dari server.");
  const { data } = (await res.json()) as { data: (Omit<Tugas, "id"> & { id: string })[] };
  
  return data ? data.map(item => ({...item, id: item.id})) : [];
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
  const newTaskId = createdMessage.details.id;
  
  const qstashMessageId = await scheduleNotification(newTaskId, tugasData.deadline);
  
  const finalTugasData: Tugas = {
    ...tugasData,
    id: newTaskId,
    qstashMessageId: qstashMessageId || undefined,
  };
  
  // Update sekali lagi untuk menyimpan qstashMessageId
  await updateTugas(finalTugasData);

  return finalTugasData;
};

export const updateTugas = async (tugas: Tugas): Promise<Tugas> => {
  const { id, ...content } = tugas;

  if (tugas.qstashMessageId) {
    await cancelNotification(tugas.qstashMessageId);
  }
  
  const newQstashMessageId = await scheduleNotification(id, tugas.deadline);
  
  const updatedContent = {
    ...content,
    qstashMessageId: newQstashMessageId || undefined,
  };

  const payload = {
    name: `${tugas.judul.replace(/\s+/g, "-")}-${Date.now()}.json`,
    content: JSON.stringify(updatedContent),
  };

  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) throw new Error("Gagal memperbarui tugas di server.");
  
  return { ...tugas, qstashMessageId: newQstashMessageId || undefined };
};

export const deleteTugas = async (id: string, qstashMessageId?: string): Promise<void> => {
  if (qstashMessageId) {
    await cancelNotification(qstashMessageId);
  }

  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Gagal menghapus tugas dari server.");
};