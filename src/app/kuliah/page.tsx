// src/app/kuliah/page.tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  CalendarRange,
  Wrench,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import gsap from "gsap";

const menus = [
  {
    href: "/kuliah/jadwal",
    title: "Jadwal & Akademik",
    desc: "Cek jadwal harian, UAS, dan kalender akademik.",
    icon: <CalendarRange className="h-8 w-8 md:h-12 md:w-12" />,
    gradient: "from-teal-500/20 to-emerald-500/20",
    border: "group-hover:border-teal-500/50",
    text: "group-hover:text-teal-400",
  },
  {
    href: "/kuliah/tugas",
    title: "Tugas",
    desc: "Pantau deadline dan status tugas kuliah.",
    icon: <BookOpenCheck className="h-8 w-8 md:h-12 md:w-12" />,
    gradient: "from-blue-500/20 to-indigo-500/20",
    border: "group-hover:border-blue-500/50",
    text: "group-hover:text-blue-400",
  },
  {
    href: "/kuliah/tools",
    title: "Engineering Tools",
    desc: "Utilitas teknik sipil, hitung kontur, dan lainnya.",
    icon: <Wrench className="h-8 w-8 md:h-12 md:w-12" />,
    gradient: "from-purple-500/20 to-pink-500/20",
    border: "group-hover:border-purple-500/50",
    text: "group-hover:text-purple-400",
  },
];

export default function KuliahPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Menggunakan gsap.context untuk cleanup yang aman di React
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Set awal elemen biar gak "flash" (kedip) sebelum animasi
      gsap.set(".hero-element", { autoAlpha: 0, y: 50 });
      gsap.set(".glass-tile", { autoAlpha: 0, y: 100 });

      // 2. Animasi Hero Text (Menggunakan fromTo untuk kepastian posisi)
      tl.to(".hero-element", {
        duration: 1,
        autoAlpha: 1, // autoAlpha handle opacity + visibility
        y: 0,
        ease: "power3.out",
        stagger: 0.15,
      })
        // 3. Animasi Kartu
        .to(
          ".glass-tile",
          {
            duration: 0.8,
            autoAlpha: 1,
            y: 0,
            ease: "back.out(1.2)", // Efek membal sedikit biar smooth
            stagger: 0.15,
          },
          "-=0.5",
        ); // Mulai sedikit lebih awal sebelum animasi text selesai

      // 4. Animasi Blob Background (Looping)
      gsap.to(".blob", {
        x: "random(-50, 50)",
        y: "random(-50, 50)",
        scale: "random(0.9, 1.1)",
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 2,
      });
    }, containerRef);

    return () => ctx.revert(); // Wajib untuk React Strict Mode!
  }, []);

  return (
    <main
      ref={containerRef}
      className="bg-background relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden p-4 md:p-8"
    >
      {/* --- DYNAMIC BACKGROUND --- */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
        <div className="blob absolute top-0 left-1/4 h-96 w-96 rounded-full bg-teal-500/10 blur-[100px] dark:bg-teal-500/20" />
        <div className="blob absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-purple-500/10 blur-[100px] dark:bg-purple-500/20" />
        <div className="blob absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* --- HERO SECTION --- */}
      {/* Tambahkan z-10 biar di atas background, dan padding bottom biar text gak kepotong */}
      <div className="relative z-10 mx-auto mb-16 max-w-3xl px-4 text-center">
        {/* Badge */}
        <div className="hero-element mb-6 flex justify-center opacity-0">
          <div className="bg-muted/50 border-border text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-amber-400" /> Portal Akademik
            Mahasiswa
          </div>
        </div>

        {/* Main Title */}
        <h1 className="hero-element from-foreground to-foreground/60 mb-6 bg-linear-to-b bg-clip-text pb-2 text-5xl font-black tracking-tighter text-transparent opacity-0 md:text-7xl">
          Everything You Need.
        </h1>

        {/* Subtitle */}
        <p className="hero-element text-muted-foreground mx-auto max-w-xl text-lg leading-relaxed opacity-0 md:text-xl">
          Satu pintu untuk jadwal, tugas, dan alat bantu teknik sipil.
        </p>
      </div>

      {/* --- TILES / GLASS CARDS --- */}
      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 gap-6 px-2 md:grid-cols-3">
        {menus.map((menu, i) => (
          <Link href={menu.href} key={i} className="group h-full">
            <div
              className={cn(
                "glass-tile flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/40 p-8 opacity-0 shadow-lg backdrop-blur-xl transition-all duration-500 dark:border-white/5 dark:bg-black/20",
                "hover:-translate-y-1 hover:scale-[1.02] hover:border-white/20 hover:bg-white/60 hover:shadow-2xl dark:hover:bg-black/40",
                menu.border,
              )}
            >
              {/* Gradient Glow on Hover */}
              <div
                className={cn(
                  "absolute inset-0 -z-10 rounded-3xl bg-linear-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                  menu.gradient,
                )}
              />

              <div className="mb-8 flex items-start justify-between">
                <div
                  className={cn(
                    "bg-background/50 rounded-2xl border border-white/10 p-4 shadow-sm transition-colors duration-300",
                    menu.text,
                  )}
                >
                  {menu.icon}
                </div>
                <div className="transform rounded-full bg-white/10 p-2 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100">
                  <ArrowUpRight className="text-muted-foreground group-hover:text-foreground h-5 w-5" />
                </div>
              </div>

              <div>
                <h2 className="group-hover:text-primary mb-2 text-2xl font-bold transition-colors">
                  {menu.title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                  {menu.desc}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
