// ================================================
// FILE: src/components/Tugas/tugas.api.ts
// ================================================
// src/components/Tugas/tugas.api.ts
import type { Tugas } from "@/types/tugas";

const CONTAINER_ID = "1409908765074919585";
const BOX_ID = "1409908859971309681";
const API_BASE_URL = `/api/database/${CONTAINER_ID}/${BOX_ID}`;

// Fungsi helper baru untuk menjadwalkan notifikasi via QStash
async function scheduleNotification(taskId: string, deadline: string) {
  console.log(deadline)
  const deadlineDate = new Date(deadline);
  // Jadwalkan 1 jam sebelum deadline
  const notifyAt = new Date(deadlineDate.getTime() - 60 * 60 * 1000);

  console.log(notifyAt.getTime() - Date.now())
  // Jangan jadwalkan jika waktunya sudah lewat
  if (notifyAt.getTime() < Date.now()) {
    console.log("Waktu notifikasi sudah lewat, tidak dijadwalkan.");
    return null;
  }

  try {
    console.log("request qstash")
    const res = await fetch(process.env.NEXT_PUBLIC_QSTASH_URL!, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_QSTASH_TOKEN!}`,
        "Content-Type": "application/json",
        // Tentukan waktu eksekusi dalam UNIX epoch (detik)
        "Upstash-Not-Before": Math.floor(notifyAt.getTime() / 1000).toString(),
      },
      body: JSON.stringify({
        // URL lengkap dari endpoint yang kita buat di Langkah 1
        destination: `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send-specific`,
        body: JSON.stringify({ taskId }),
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`QStash scheduling failed: ${JSON.stringify(error)}`);
    }

    const data = await res.json();
    console.log(data)
    return data.messageId; // Ini adalah ID yang kita butuhkan untuk membatalkan
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
}

// Fungsi helper baru untuk membatalkan notifikasi
async function cancelNotification(qstashMessageId: string) {
  if (!qstashMessageId) return;

  try {
    await fetch(`${process.env.NEXT_PUBLIC_QSTASH_URL}/messages/${qstashMessageId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_QSTASH_TOKEN!}`,
      },
    });
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
}


export const fetchTugas = async (): Promise<Tugas[]> => {
  const res = await fetch(`${API_BASE_URL}?full=true`);
  if (!res.ok) throw new Error("Gagal mengambil daftar tugas dari server.");
  const { data } = (await res.json()) as { data: (Omit<Tugas, "id"> & { id: string })[] };
  
  // Pastikan setiap item memiliki properti 'id' yang benar
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
  
  // Jadwalkan notifikasi setelah tugas berhasil dibuat
  const qstashMessageId = await scheduleNotification(newTaskId, tugasData.deadline);
  console.log("QStash message ID:", qstashMessageId);
  const finalTugasData: Tugas = {
    ...tugasData,
    id: newTaskId,
    qstashMessageId: qstashMessageId || undefined,
  };
  
  // Update sekali lagi untuk menyimpan qstashMessageId ke dalam data tugas
  await updateTugas(finalTugasData);

  return finalTugasData;
};

export const updateTugas = async (tugas: Tugas): Promise<Tugas> => {
  const { id, ...content } = tugas;

  // Jika tugas yang diupdate punya jadwal notifikasi lama, batalkan dulu
  if (tugas.qstashMessageId) {
    await cancelNotification(tugas.qstashMessageId);
  }
  
  // Jadwalkan notifikasi baru dengan deadline yang baru
  console.log('add request')
  const newQstashMessageId = await scheduleNotification(id, tugas.deadline);
  console.log("QStash message ID:", newQstashMessageId);
  
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
  // Batalkan notifikasi terjadwal sebelum menghapus tugas
  if (qstashMessageId) {
    await cancelNotification(qstashMessageId);
  }

  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Gagal menghapus tugas dari server.");
};