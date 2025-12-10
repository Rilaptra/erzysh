// src/components/Tugas/tugas.api.ts
import type { Tugas } from "@/types/tugas";

const CONTAINER_ID = "1409908765074919585";
const BOX_ID = "1409908859971309681";
const API_BASE_URL = `/api/database/${CONTAINER_ID}/${BOX_ID}`;

// --- PERBAIKAN DI SINI ---
async function scheduleNotification(taskId: string, deadline: string) {
  try {
    const res = await fetch("/api/schedule-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, deadline }),
    });

    if (!res.ok) {
      // Jangan throw error, cukup log warning saja agar flow tidak putus
      console.warn(
        "⚠️ Warning: Gagal menjadwalkan notifikasi. (Cek .env QStash)",
        await res.text(),
      );
      return null;
    }

    const { messageId } = await res.json();
    return messageId || null;
  } catch (error) {
    // Tangkap error network dsb, jangan biarkan meledak
    console.error("⚠️ Error scheduling notification (Non-fatal):", error);
    return null;
  }
}

// Fungsi cancel juga kita amankan
async function cancelNotification(qstashMessageId: string) {
  if (!qstashMessageId) return;

  try {
    await fetch("/api/schedule-notification", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qstashMessageId }),
    });
  } catch (error) {
    console.warn("⚠️ Error canceling notification (Non-fatal):", error);
  }
}

export const fetchTugas = async (): Promise<Tugas[]> => {
  const res = await fetch(`${API_BASE_URL}?full=true`);
  if (!res.ok) throw new Error("Gagal mengambil daftar tugas dari server.");
  const { data } = (await res.json()) as {
    data: (Omit<Tugas, "id"> & { id: string })[];
  };

  return data ? data.map((item) => ({ ...item, id: item.id })) : [];
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

  // Schedule notif (aman jika gagal)
  const qstashMessageId = await scheduleNotification(
    newTaskId,
    tugasData.deadline,
  );

  const finalTugasData: Tugas = {
    ...tugasData,
    id: newTaskId,
    qstashMessageId: qstashMessageId || undefined,
  };

  // Update untuk simpan ID notifikasi (background process, no await needed for UX speed)
  if (qstashMessageId) {
    updateTugas(finalTugasData).catch((e) =>
      console.warn("Failed to save notification ID", e),
    );
  }

  return finalTugasData;
};

export const updateTugas = async (tugas: Tugas): Promise<Tugas> => {
  const { id, ...content } = tugas;

  // Cancel notif lama jika ada
  if (tugas.qstashMessageId) {
    await cancelNotification(tugas.qstashMessageId);
  }

  // Schedule notif baru (aman jika gagal)
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

export const deleteTugas = async (
  id: string,
  qstashMessageId?: string,
): Promise<void> => {
  if (qstashMessageId) {
    await cancelNotification(qstashMessageId);
  }

  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Gagal menghapus tugas dari server.");
};
