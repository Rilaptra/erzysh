"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import gsap from "gsap";

export default function KuliahPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      <h1 className="text-primary mb-8 text-4xl font-bold">Kuliah</h1>
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        {/* --- PERUBAHAN DI SINI --- */}
        <Link href="/kuliah/tugas">
          <Button variant="default" className="w-40 justify-center">
            Tugas
          </Button>
        </Link>
        {/* --- AKHIR PERUBAHAN --- */}
        <Link href="/kuliah/jadwal">
          <Button variant="default" className="w-40 justify-center">
            Jadwal
          </Button>
        </Link>
        <Link href="/kuliah/tools">
          <Button variant="default" className="w-40 justify-center">
            Tools
          </Button>
        </Link>
      </div>
    </main>
  );
}
