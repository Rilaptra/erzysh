// src/components/Tugas/TugasDashboard.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BookCheck,
  PlusCircle,
  Loader2,
  BellRing,
  BellOff,
} from "lucide-react"; // <-- Ikon baru: BellOff
import type { Tugas } from "@/types/tugas";
import { Button } from "@/components/ui/button";
import { TugasCard } from "./TugasCard";
import { TugasForm } from "./TugasForm";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "../ui/label";
import { Undo2 } from "lucide-react";
import * as TugasAPI from "./tugas.api";

type FilterStatus = "semua" | "aktif" | "selesai";
type SortBy = "deadline" | "terbaru";

interface TugasDashboardProps {
  mataKuliahOptions: string[];
}

export function TugasDashboard({ mataKuliahOptions }: TugasDashboardProps) {
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTugas, setEditingTugas] = useState<Tugas | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("aktif");
  const [sortBy, setSortBy] = useState<SortBy>("deadline");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [subscriptionObject, setSubscriptionObject] =
    useState<PushSubscription | null>(null); // State baru untuk menyimpan objek subscription

  // --- LOGIKA NOTIFIKASI YANG DI-UPDATE ---
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsNotificationEnabled(true);
            setSubscriptionObject(sub); // Simpan objek subscription
          }
        });
      });
    }
  }, []);

  const handleSubscribe = async () => {
    if (!("serviceWorker" in navigator)) {
      toast.error("Browser tidak mendukung Service Worker.");
      return;
    }

    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          throw new Error("VAPID public key tidak ditemukan.");
        }
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });
      }

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Gagal mendaftar notifikasi di server.");

      setIsNotificationEnabled(true);
      setSubscriptionObject(subscription); // Simpan objek subscription setelah berhasil
      toast.success("Notifikasi pengingat deadline berhasil diaktifkan!");
    } catch (error) {
      console.error("Error subscribing to push notifications", error);
      toast.error("Gagal mengaktifkan notifikasi.", {
        description: (error as Error).message,
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!("serviceWorker" in navigator) || !subscriptionObject) {
      toast.error("Tidak ada notifikasi yang aktif untuk dinonaktifkan.");
      return;
    }

    setIsSubscribing(true); // Re-use isSubscribing for loading state
    try {
      await subscriptionObject.unsubscribe(); // Hapus dari browser

      const res = await fetch("/api/notifications/unsubscribe", {
        // <-- Endpoint baru di backend
        method: "POST",
        body: JSON.stringify({ endpoint: subscriptionObject.endpoint }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Gagal menghapus notifikasi di server.");

      setIsNotificationEnabled(false);
      setSubscriptionObject(null);
      toast.info("Notifikasi pengingat deadline berhasil dinonaktifkan.");
    } catch (error) {
      console.error("Error unsubscribing from push notifications", error);
      toast.error("Gagal menonaktifkan notifikasi.", {
        description: (error as Error).message,
      });
    } finally {
      setIsSubscribing(false);
    }
  };
  // --- END LOGIKA NOTIFIKASI ---

  useEffect(() => {
    const loadTugas = async () => {
      try {
        setIsLoading(true);
        const data = await TugasAPI.fetchTugas();
        setTugasList(data);
      } catch (error) {
        toast.error("Gagal memuat data tugas.", {
          description: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadTugas();
  }, []);

  // ... (sisa fungsi handle dan useMemo tetap sama)

  const handleOpenForm = (tugas: Tugas | null) => {
    setEditingTugas(tugas);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingTugas(null);
    setIsFormOpen(false);
  };

  const handleCrudSubmit = async (
    data: Omit<Tugas, "id" | "isCompleted"> & { id?: string },
    originalData?: Tugas,
  ) => {
    if (data.id && originalData) {
      // Update
      const optimisticUpdate = { ...originalData, ...data };
      setTugasList((prev) =>
        prev.map((t) => (t.id === data.id ? optimisticUpdate : t)),
      );
      try {
        await TugasAPI.updateTugas(optimisticUpdate);
        toast.success(`Tugas "${data.judul}" berhasil diperbarui!`, {
          action: {
            label: "Undo",
            onClick: () => handleUndoUpdate(originalData),
          },
          icon: <Undo2 className="size-4" />,
        });
      } catch (error) {
        toast.error("Gagal update, mengembalikan data.", {
          description: (error as Error).message,
        });
        setTugasList((prev) =>
          prev.map((t) => (t.id === data.id ? originalData : t)),
        );
      }
    } else {
      // Create
      const newTugasData: Omit<Tugas, "id"> = {
        ...data,
        isCompleted: false,
      };
      try {
        const createdTugas = await TugasAPI.createTugas(newTugasData);
        setTugasList((prev) => [createdTugas, ...prev]);
        toast.success(`Tugas "${data.judul}" berhasil ditambahkan!`);
      } catch (error) {
        toast.error("Gagal menambahkan tugas.", {
          description: (error as Error).message,
        });
      }
    }
  };

  const handleUndoUpdate = async (originalTugas: Tugas) => {
    setTugasList((prev) =>
      prev.map((t) => (t.id === originalTugas.id ? originalTugas : t)),
    );
    try {
      await TugasAPI.updateTugas(originalTugas);
      toast.info("Perubahan telah dibatalkan.");
    } catch {
      toast.error("Gagal membatalkan perubahan.");
      // Rollback UI jika undo di server gagal
      setTugasList((prev) =>
        prev.map((t) => (t.id === originalTugas.id ? originalTugas : t)),
      );
    }
  };

  const handleDelete = (id: string) => {
    const tugasToDelete = tugasList.find((t) => t.id === id);
    if (!tugasToDelete) return;

    setTugasList((prev) => prev.filter((t) => t.id !== id));

    const deletePromise = () =>
      TugasAPI.deleteTugas(id).catch((err) => {
        setTugasList((prev) => [...prev, tugasToDelete]); // Rollback on error
        throw err; // Lemparkan error agar toast bisa menanganinya
      });

    toast.promise(deletePromise, {
      loading: "Menghapus tugas...",
      success: "Tugas berhasil dihapus permanen.",
      error: "Gagal menghapus tugas.",
    });
  };

  const handleToggleComplete = (id: string, currentState: boolean) => {
    const tugas = tugasList.find((t) => t.id === id);
    if (!tugas) return;

    const updatedTugas = { ...tugas, isCompleted: !currentState };
    setTugasList((prev) => prev.map((t) => (t.id === id ? updatedTugas : t)));

    const originalState = { ...tugas };

    toast.info(
      `Tugas ditandai ${updatedTugas.isCompleted ? "selesai" : "belum selesai"}.`,
      {
        action: {
          label: "Undo",
          onClick: async () => {
            setTugasList((prev) =>
              prev.map((t) => (t.id === id ? originalState : t)),
            );
            try {
              await TugasAPI.updateTugas(originalState);
              toast.info("Status tugas dibatalkan.");
            } catch {
              toast.error("Gagal membatalkan status.");
              setTugasList((prev) =>
                prev.map((t) => (t.id === id ? updatedTugas : t)),
              );
            }
          },
        },
        icon: <Undo2 className="size-4" />,
      },
    );

    TugasAPI.updateTugas(updatedTugas).catch(() => {});
  };

  const filteredAndSortedList = useMemo(() => {
    return [...tugasList]
      .filter((t) => {
        if (filterStatus === "aktif") return !t.isCompleted;
        if (filterStatus === "selesai") return t.isCompleted;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadline") {
          if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
          return (
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        }
        return new Date(b.id).getTime() - new Date(a.id).getTime();
      });
  }, [tugasList, filterStatus, sortBy]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="text-primary size-12 animate-spin" />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-3 text-3xl font-bold md:text-4xl">
          <BookCheck className="text-teal-muted size-9 md:size-10" />
          Manajemen Tugas
        </h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant={isNotificationEnabled ? "outline" : "destructive"} // Warna berbeda saat aktif
            onClick={
              isNotificationEnabled ? handleUnsubscribe : handleSubscribe
            } // Pilih fungsi berdasarkan status
            disabled={isSubscribing} // Hanya disable saat proses subscribe/unsubscribe
            className="w-full sm:w-auto"
          >
            {isSubscribing ? (
              <Loader2 className="mr-2 animate-spin" />
            ) : isNotificationEnabled ? (
              <BellOff className="mr-2" /> // Ikon BellOff saat aktif
            ) : (
              <BellRing className="mr-2" /> // Ikon BellRing saat nonaktif
            )}
            {isSubscribing
              ? "Memproses..."
              : isNotificationEnabled
                ? "Nonaktifkan Pengingat" // Text berbeda saat aktif
                : "Aktifkan Pengingat"}
          </Button>
          <Button
            size="lg"
            onClick={() => handleOpenForm(null)}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="mr-2" />
            Tambah Tugas Baru
          </Button>
        </div>
      </div>
      <div className="bg-card mb-6 flex flex-col gap-4 rounded-lg border p-4 sm:flex-row">
        <div className="flex-1">
          <Label className="text-muted-foreground text-xs">Tampilkan</Label>
          <Select
            onValueChange={(v: FilterStatus) => setFilterStatus(v)}
            value={filterStatus}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aktif">Tugas Aktif</SelectItem>
              <SelectItem value="selesai">Tugas Selesai</SelectItem>
              <SelectItem value="semua">Semua Tugas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="text-muted-foreground text-xs">Urutkan</Label>
          <Select onValueChange={(v: SortBy) => setSortBy(v)} value={sortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Deadline Terdekat</SelectItem>
              <SelectItem value="terbaru">Baru Dibuat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredAndSortedList.map((tugas) => (
          <TugasCard
            key={tugas.id}
            tugas={tugas}
            onEdit={handleOpenForm}
            onDelete={handleDelete}
            onToggleComplete={handleToggleComplete}
          />
        ))}
      </div>
      {filteredAndSortedList.length === 0 && !isLoading && (
        <div className="mt-6 rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground text-lg">
            {filterStatus === "aktif"
              ? "Hore, tidak ada tugas aktif! 😎"
              : "Belum ada tugas yang selesai."}
          </p>
        </div>
      )}
      <TugasForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleCrudSubmit}
        initialData={editingTugas}
        mataKuliahOptions={mataKuliahOptions}
      />
    </main>
  );
}
