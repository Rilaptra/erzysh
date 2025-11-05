// src/app/kuliah/tools/page.tsx
"use client";

import { useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { useSearchParams } from "next/navigation";
// --- 👇 PERBAIKAN DI SINI: Impor semua ikon yang dibutuhkan ---
import {
  Calculator,
  ClipboardCheck,
  FileInput,
  Camera,
  GraduationCap,
  BetweenHorizontalStart,
} from "lucide-react";

function ToolButtons() {
  const searchParams = useSearchParams();

  // Pastikan array ini punya semua tools yang lo mau
  const toolList = [
    {
      href: "/kuliah/tools/interval-generator",
      label: "Generator Interval",
      icon: <BetweenHorizontalStart className="mr-2 h-4 w-4 text-teal-muted" />,
      adminOnly: false,
    },
    {
      href: "/kuliah/tools/survey-dashboard",
      label: "Dashboard Survey",
      icon: <ClipboardCheck className="mr-2 h-4 w-4 text-teal-muted" />,
      adminOnly: false,
    },
    {
      href: "/kuliah/tools/iut-calculator",
      label: "Kalkulator IUT",
      icon: <Calculator className="mr-2 h-4 w-4 text-teal-muted" />,
      adminOnly: false,
    },
    {
      href: "/kuliah/tools/photo-formatter",
      label: "Photo to Docs Formatter (Tugas Prodi)",
      icon: <Camera className="mr-2 h-4 w-4 text-teal-muted" />,
      adminOnly: true,
    },
    {
      href: "/kuliah/tools/checklist-teksip",
      label: "Checklist Nama Teksip 25 (Tugas Foto)",
      icon: <FileInput className="mr-2 h-4 w-4 text-teal-muted" />,
      adminOnly: false,
    },
    {
      href: "/kuliah/tools/sipadu-leaked",
      label: "Sipadu Leaked",
      icon: <GraduationCap className="mr-2 h-4 w-4 text-teal-muted" />, // Pastikan ini ada jika tool-nya ada
      adminOnly: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {toolList.map((tool) => {
        // Tampilkan tool jika tidak admin-only, atau jika admin=true di URL
        if (!tool.adminOnly || searchParams.get("admin") === "true") {
          return (
            <Link href={tool.href} key={tool.href}>
              <Button
                variant="outline"
                className="h-12 w-full justify-start text-base"
              >
                {tool.icon}
                {tool.label}
              </Button>
            </Link>
          );
        }
        return null;
      })}
    </div>
  );
}

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
      <h1 className="text-primary mb-8 text-4xl font-bold">Tools Kuliah</h1>
      <Suspense
        fallback={
          <div className="bg-muted h-12 w-64 animate-pulse rounded-md" />
        }
      >
        <ToolButtons />
      </Suspense>
    </main>
  );
}
