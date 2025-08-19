"use client";

import { useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { useSearchParams } from "next/navigation";

// 1. Komponen baru yang diisolasi untuk menggunakan useSearchParams
function ToolButtons() {
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
      {/* Logika kondisional tetap di sini */}
      {searchParams.get("admin") === "true" && (
        <Link href="/kuliah/tools/photo-formatter">
          <Button variant="default" className="justify-center">
            Photo to Docs Formatter (Tugas Prodi)
          </Button>
        </Link>
      )}
      <Link href="/kuliah/tools/checklist-teksip">
        <Button variant="default" className="justify-center">
          Checklist Nama Teksip 25 (Tugas Foto)
        </Button>
      </Link>
    </div>
  );
}

// 2. Komponen halaman utama
export default function KuliahPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animasi GSAP kamu tetap berfungsi seperti biasa
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      );
    }
  }, []);

  return (
    <main
      ref={containerRef}
      className="flex min-h-screen flex-col items-center justify-center px-4 text-center"
    >
      <h1 className="text-primary mb-8 text-4xl font-bold">Tools Kuliah</h1>

      {/* 3. Bungkus komponen baru dengan Suspense dan berikan fallback UI */}
      <Suspense
        fallback={
          <div className="flex h-[40px] items-center justify-center">
            <p className="animate-pulse">Loading tools...</p>
          </div>
        }
      >
        <ToolButtons />
      </Suspense>
    </main>
  );
}
