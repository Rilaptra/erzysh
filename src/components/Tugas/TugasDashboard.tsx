// src/components/Tugas/TugasDashboard.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  ListFilter,
  CheckCircle2,
  CircleDashed,
  LayoutDashboard,
  Bell,
  BellOff,
  TestTube,
  Loader2,
} from "lucide-react";
import type { Tugas } from "@/types/tugas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TugasCard } from "./TugasCard";
import { TugasForm } from "./TugasForm";
import { toast } from "sonner";
import * as TugasAPI from "./tugas.api";
import { cn } from "@/lib/cn";

// --- HELPERS (Sama seperti sebelumnya) ---
function urlBase64ToUint8Array(base64String: string) {
  /* ... kode sama ... */
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface TugasDashboardProps {
  mataKuliahOptions: string[];
}

export function TugasDashboard({ mataKuliahOptions }: TugasDashboardProps) {
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTugas, setEditingTugas] = useState<Tugas | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, completed
  const [sortBy] = useState("deadline"); // deadline, created

  // Notification States
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  // --- 1. LOAD DATA ---
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

    // Cek status notifikasi
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setIsNotificationEnabled(true);
        });
      });
    }
  }, []);

  // --- 2. LOGIC FILTER & SORT ---
  const filteredList = useMemo(() => {
    let result = [...tugasList];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.judul.toLowerCase().includes(q) ||
          t.mataKuliah.toLowerCase().includes(q),
      );
    }

    // Filter Status
    if (filterStatus === "active")
      result = result.filter((t) => !t.isCompleted);
    if (filterStatus === "completed")
      result = result.filter((t) => t.isCompleted);

    // Sort
    result.sort((a, b) => {
      if (sortBy === "deadline")
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      // if (sortBy === "created") ... (jika ada field created_at, kalau tidak pakai ID)
      return 0;
    });

    return result;
  }, [tugasList, searchQuery, filterStatus, sortBy]);

  // Stats Logic
  const stats = useMemo(() => {
    const total = tugasList.length;
    const completed = tugasList.filter((t) => t.isCompleted).length;
    const pending = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, percentage };
  }, [tugasList]);

  // --- 3. HANDLERS (CRUD & NOTIF) ---
  // ... (Gunakan handler yang sama dari kode sebelumnya, saya ringkas di sini) ...
  const handleSubscribe = async () => {
    /* ... Logic Subscribe dari kode lama ... */
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
      return toast.error("VAPID Key missing");
    setIsSubscribing(true);
    try {
      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        ),
      });
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setIsNotificationEnabled(true);
      toast.success("Notifikasi aktif!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal aktivasi notifikasi.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    /* ... Logic Unsubscribe ... */
    setIsSubscribing(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
        setIsNotificationEnabled(false);
        toast.info("Notifikasi mati.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTestNotification = async () => {
    /* ... Logic Test ... */
    setIsTestingNotification(true);
    const toastId = toast.loading("Mengirim tes...");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) throw new Error("Belum subscribe.");
      await new Promise((r) => setTimeout(r, 2000)); // Fake delay
      await fetch("/api/notifications/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });
      toast.success("Terkirim!", { id: toastId });
    } catch (e) {
      toast.error("Gagal kirim tes", { id: toastId });
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleCrudSubmit = async (data: any, original?: Tugas) => {
    // Optimistic Update
    if (data.id && original) {
      const updated = {
        ...original,
        ...data,
        isCompleted: original.isCompleted,
      };
      setTugasList((prev) => prev.map((t) => (t.id === data.id ? updated : t)));
      try {
        const serverRes = await TugasAPI.updateTugas(updated);
        // Update real data from server (including qstashId)
        setTugasList((prev) =>
          prev.map((t) => (t.id === serverRes.id ? serverRes : t)),
        );
        toast.success("Tugas diperbarui!");
      } catch {
        setTugasList((prev) =>
          prev.map((t) => (t.id === data.id ? original : t)),
        );
        toast.error("Gagal update");
      }
    } else {
      try {
        const newTugas = await TugasAPI.createTugas({
          ...data,
          isCompleted: false,
        });
        setTugasList((prev) => [newTugas, ...prev]);
        toast.success("Tugas dibuat!");
      } catch {
        toast.error("Gagal buat tugas");
      }
    }
  };

  const handleDelete = (id: string) => {
    const target = tugasList.find((t) => t.id === id);
    if (!target) return;
    setTugasList((prev) => prev.filter((t) => t.id !== id));
    TugasAPI.deleteTugas(id, target.qstashMessageId).catch(() => {
      setTugasList((prev) => [...prev, target]);
      toast.error("Gagal hapus");
    });
  };

  const handleToggleComplete = (id: string, current: boolean) => {
    const target = tugasList.find((t) => t.id === id);
    if (!target) return;
    const updated = { ...target, isCompleted: !current };
    setTugasList((prev) => prev.map((t) => (t.id === id ? updated : t)));
    TugasAPI.updateTugas(updated).catch(() => {
      setTugasList((prev) => prev.map((t) => (t.id === id ? target : t)));
      toast.error("Gagal update status");
    });
  };

  // --- RENDER UI ---
  return (
    <div className="min-h-screen p-4 lg:p-8 pb-20">
      {/* 1. STATS HEADER (GAMIFICATION) */}
      <section className="bg-card mb-8 rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Mission Control
            </h1>
            <p className="text-muted-foreground mt-1">
              Kamu punya{" "}
              <span className="text-foreground font-bold">
                {stats.pending} tugas aktif
              </span>{" "}
              yang perlu diselesaikan.
            </p>
          </div>

          <div className="w-full space-y-2 md:w-64">
            <div className="flex justify-between text-sm font-medium">
              <span>Progress</span>
              <span>{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-2.5" />
            <div className="text-muted-foreground mt-1 flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <CircleDashed className="h-3 w-3" /> {stats.pending} Pending
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {stats.completed} Selesai
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TOOLBAR (SEARCH & FILTER) */}
      <div className="bg-background/80 sticky top-20 z-10 mb-6 flex flex-col gap-3 rounded-xl border p-3 backdrop-blur-md sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <Input
            placeholder="Cari tugas atau matkul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-muted-foreground/20 bg-background/50 pl-9 focus-visible:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-dashed"
              >
                <ListFilter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter:</span>
                <span className="font-semibold capitalize">
                  {filterStatus === "all" ? "Semua" : filterStatus}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <DropdownMenuRadioItem value="all">
                  Semua Tugas
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="active">
                  Masih Aktif
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">
                  Sudah Selesai
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifikasi Button */}
          <div className="bg-muted/50 flex items-center rounded-md border p-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 rounded-sm",
                isNotificationEnabled &&
                  "bg-teal-100 text-teal-600 dark:bg-teal-900/30",
              )}
              onClick={
                isNotificationEnabled ? handleUnsubscribe : handleSubscribe
              }
              disabled={isSubscribing}
              title={isNotificationEnabled ? "Matikan Notif" : "Hidupkan Notif"}
            >
              {isSubscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isNotificationEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
            {isNotificationEnabled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-sm hover:text-indigo-600"
                onClick={handleTestNotification}
                disabled={isTestingNotification}
                title="Test Notif"
              >
                {isTestingNotification ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          <Button
            onClick={() => {
              setEditingTugas(null);
              setIsFormOpen(true);
            }}
            className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Baru
          </Button>
        </div>
      </div>

      {/* 3. TASK GRID */}
      {isLoading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      ) : filteredList.length > 0 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 grid gap-4 duration-500 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredList.map((tugas) => (
            <TugasCard
              key={tugas.id}
              tugas={tugas}
              onEdit={(t) => {
                setEditingTugas(t);
                setIsFormOpen(true);
              }}
              onDelete={handleDelete}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-muted/10 flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center">
          <div className="bg-muted mb-4 rounded-full p-4">
            <LayoutDashboard className="text-muted-foreground/50 h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold">Tidak ada tugas ditemukan</h3>
          <p className="text-muted-foreground mx-auto mt-1 max-w-xs text-sm">
            {searchQuery
              ? `Tidak ada hasil untuk "${searchQuery}"`
              : "Belum ada tugas di kategori ini. Tambahkan tugas baru!"}
          </p>
          {searchQuery && (
            <Button variant="link" onClick={() => setSearchQuery("")}>
              Reset Pencarian
            </Button>
          )}
        </div>
      )}

      <TugasForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCrudSubmit}
        initialData={editingTugas}
        mataKuliahOptions={mataKuliahOptions}
      />
    </div>
  );
}
