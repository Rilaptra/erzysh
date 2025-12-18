// src/lib/hooks/useDevMode.ts
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

const DEV_MODE_KEY = "eryzsh_dev_mode";
const DEV_PASSWORD = "cihuyyy"; // Ganti password sesuka hati
const EXPIRY_DURATION = 24 * 60 * 60 * 1000; // 1 Hari (dalam milidetik)

export function useDevMode() {
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    // Check localStorage during initialization if in client-side
    if (typeof window === "undefined") return false;

    const itemStr = localStorage.getItem(DEV_MODE_KEY);
    if (!itemStr) return false;

    try {
      const item = JSON.parse(itemStr);
      const now = new Date().getTime();
      if (now > item.expiry) {
        localStorage.removeItem(DEV_MODE_KEY);
        return false;
      }
      return true;
    } catch (e) {
      localStorage.removeItem(DEV_MODE_KEY);
      return false;
    }
  });

  useEffect(() => {
    // This effect handles potential changes from other tabs
    // or ensures state is synced if needed, but the initializer handles the first mount.
    const handleStorageChange = () => {
      const itemStr = localStorage.getItem(DEV_MODE_KEY);
      if (itemStr) {
        try {
          const item = JSON.parse(itemStr);
          setIsDevMode(new Date().getTime() <= item.expiry);
        } catch {
          setIsDevMode(false);
        }
      } else {
        setIsDevMode(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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
