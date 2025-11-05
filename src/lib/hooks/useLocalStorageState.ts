// src/lib/hooks/useLocalStorageState.ts
"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";

/**
 * Custom hook yang berfungsi seperti useState, namun secara otomatis
 * menyimpan dan mengambil state dari localStorage.
 *
 * @param key Kunci unik untuk item di localStorage.
 * @param initialValue Nilai awal jika tidak ada data di localStorage.
 * @returns Tuple [state, setState] seperti hook useState.
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Gunakan function di useState agar logic ini hanya berjalan sekali di client-side
  const [state, setState] = useState<T>(() => {
    // Handle SSR: jangan akses localStorage di server
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const storedItem = window.localStorage.getItem(key);
      // Jika ada item, parse. Jika tidak, gunakan initialValue.
      return storedItem ? JSON.parse(storedItem) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // useEffect untuk menyimpan state ke localStorage setiap kali state berubah
  useEffect(() => {
    try {
      // Jangan simpan jika di server
      if (typeof window !== "undefined") {
        const valueToStore = JSON.stringify(state);
        window.localStorage.setItem(key, valueToStore);
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}