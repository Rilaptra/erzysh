// src/lib/hooks/useDevMode.ts
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

const DEV_MODE_KEY = "eryzsh_dev_mode";
const DEV_PASSWORD = "cihuyyy"; // Ganti password sesuka hati
const EXPIRY_DURATION = 24 * 60 * 60 * 1000; // 1 Hari (dalam milidetik)

export function useDevMode() {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // Cek localStorage saat component dimuat
    const itemStr = localStorage.getItem(DEV_MODE_KEY);

    if (!itemStr) {
      setIsDevMode(false);
      return;
    }

    try {
      const item = JSON.parse(itemStr);
      const now = new Date().getTime();

      // Cek apakah waktu sekarang sudah melewati waktu expiry
      if (now > item.expiry) {
        localStorage.removeItem(DEV_MODE_KEY); // Hapus karena expired
        setIsDevMode(false);
        // Opsional: Kasih tau user sesi habis (bisa di-skip biar ga ganggu)
        // toast.info("Sesi Developer Mode telah berakhir.");
      } else {
        setIsDevMode(true); // Masih valid
      }
    } catch (e) {
      // Kalau format json rusak/salah, reset aja
      localStorage.removeItem(DEV_MODE_KEY);
      setIsDevMode(false);
    }
  }, []);

  const unlockDevMode = (inputPassword: string) => {
    if (inputPassword === DEV_PASSWORD) {
      const now = new Date().getTime();
      const data = {
        value: true,
        expiry: now + EXPIRY_DURATION, // Set waktu kadaluwarsa
      };

      localStorage.setItem(DEV_MODE_KEY, JSON.stringify(data));
      setIsDevMode(true);

      toast.success("Developer Mode Unlocked! 🔓", {
        description: "Akses admin terbuka selama 24 jam.",
      });
      return true;
    } else {
      toast.error("Access Denied 🚫", {
        description: "Password salah, Bro.",
      });
      return false;
    }
  };

  const lockDevMode = () => {
    localStorage.removeItem(DEV_MODE_KEY);
    setIsDevMode(false);
    toast.info("Developer Mode Locked 🔒");
  };

  return { isDevMode, unlockDevMode, lockDevMode };
}
