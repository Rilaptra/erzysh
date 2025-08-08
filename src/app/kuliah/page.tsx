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
      className="flex min-h-screen flex-col items-center justify-center px-4"
    >
      <h1 className="text-primary mb-8 text-4xl font-bold">Kuliah</h1>
      <div className="space-x-4">
        <Link href="#">
          <Button disabled variant="outline">
            Profile (Coming Soon)
          </Button>
        </Link>
        <Link href="/kuliah/jadwal">
          <Button variant="default">Jadwal</Button>
        </Link>
      </div>
    </main>
  );
}
