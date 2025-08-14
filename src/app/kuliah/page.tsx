"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import gsap from "gsap";

export default function KuliahPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This animation works great on all screen sizes, no changes needed.
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
      {/*
       * Responsive Layout Strategy:
       * - Default to a vertical column layout for mobile (`flex-col`, `space-y-4`).
       * - Switch to a horizontal row layout on small screens and up (`sm:flex-row`).
       * - Reset vertical spacing and apply horizontal spacing for larger screens (`sm:space-y-0`, `sm:space-x-4`).
       */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <Link href="#">
          <Button disabled variant="outline" className="w-40 justify-center">
            Profile (Coming Soon)
          </Button>
        </Link>
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
