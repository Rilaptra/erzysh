"use client";

// --- START: Helper functions untuk LocalStorage Cache dengan Expiration ---

// Atur waktu hidup cache (Time-To-Live). Contoh: 3 hari.
export const CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 hari dalam milidetik

export const getCacheKey = (id: string) => `collection_cache_${id}`;

export const getCachedCollection = (id: string): any | null => {
  try {
    const cachedItem = localStorage.getItem(getCacheKey(id));
    if (!cachedItem) return null;

    const { data, expiry } = JSON.parse(cachedItem);

    // Cek apakah cache sudah kedaluwarsa
    if (Date.now() > expiry) {
      // console.log(`Cache for ${id} expired, removing.`);
      localStorage.removeItem(getCacheKey(id)); // Hapus cache yang sudah usang
      return null;
    }

    // Jika belum kedaluwarsa, kembalikan datanya
    return data;
  } catch (error) {
    console.error("Failed to read or parse from localStorage", error);
    // Jika ada error (misal format lama), bersihkan cache
    localStorage.removeItem(getCacheKey(id));
    return null;
  }
};

export const setCachedCollection = (id: string, data: any) => {
  try {
    // Buat item cache dengan data dan timestamp kedaluwarsa
    const item = {
      data,
      expiry: Date.now() + CACHE_TTL_MS,
    };
    localStorage.setItem(getCacheKey(id), JSON.stringify(item));
  } catch (error) {
    console.error("Failed to write to localStorage", error);
  }
};

export const removeCachedCollection = (id: string) => {
  try {
    localStorage.removeItem(getCacheKey(id));
  } catch (error) {
    console.error("Failed to remove from localStorage", error);
  }
};
// --- END: Helper functions untuk LocalStorage Cache dengan Expiration ---
