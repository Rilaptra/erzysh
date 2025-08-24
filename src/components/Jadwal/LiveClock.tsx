"use client";

import { useState, useEffect } from "react";

// Helper function untuk menambahkan nol di depan angka tunggal (e.g., 7 -> "07")
const padZero = (num: number) => num.toString().padStart(2, "0");

export function LiveClock() {
  // 1. Inisialisasi state ke null agar server dan client render hal yang sama di awal.
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // 2. Pindahkan logika inisialisasi dan interval ke dalam useEffect.
    // Kode di dalam sini HANYA berjalan di sisi klien setelah komponen terpasang.
    setTime(new Date()); // Set waktu awal saat komponen mount di client

    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // 3. Tampilkan placeholder saat state masih null (saat server-render & initial client-render).
  // Ini mencegah layout shift dan memastikan tidak ada mismatch.
  if (!time) {
    return (
      <div className="bg-muted/50 text-foreground font-mono text-lg font-bold tracking-wider">
        <span>--</span>
        <span>:</span>
        <span>--</span>
        <span>:</span>
        <span>--</span>
      </div>
    );
  }

  const hours = padZero(time.getHours());
  const minutes = padZero(time.getMinutes());
  const seconds = padZero(time.getSeconds());

  return (
    <div className="bg-muted/50 text-foreground font-mono text-lg font-bold tracking-wider">
      <span>{hours}</span>
      <span className="animate-pulse">:</span>
      <span>{minutes}</span>
      <span className="animate-pulse">:</span>
      <span>{seconds}</span>
    </div>
  );
}
