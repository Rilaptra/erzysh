"use client";

import { useEffect } from "react";

export default function PWAInit() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((error) => {
          console.log("SW registration failed: ", error);
        });
    }
  }, []);

  return null; // Komponen ini tidak ngerender apa-apa
}
