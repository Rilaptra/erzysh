// src/app/page.tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Database,
  CalendarRange,
  Wrench,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/cn";

// Data Fitur untuk Grid
const features = [
  {
    title: "Discord DBaaS",
    desc: "Simpan data JSON & file unlimited menggunakan infrastruktur Discord.",
    icon: <Database className="h-6 w-6" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    delay: 0.1,
  },
  {
    title: "Smart Schedule",
    desc: "Jadwal kuliah & UAS terintegrasi dengan kalender akademik.",
    icon: <CalendarRange className="h-6 w-6" />,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
    delay: 0.2,
  },
  {
    title: "Engineering Tools",
    desc: "Kalkulator Sipil, Kontur, & Mekanika Bahan dalam satu tempat.",
    icon: <Wrench className="h-6 w-6" />,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    delay: 0.3,
  },
  {
    title: "Secure Auth",
    desc: "Sistem login aman dengan enkripsi & proteksi berlapis.",
    icon: <ShieldCheck className="h-6 w-6" />,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    delay: 0.4,
  },
];

export default function LandingPage() {
  const container = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      // 1. Initial State
      gsap.set(".hero-text", { y: 50, autoAlpha: 0 });
      gsap.set(".feature-card", { y: 30, autoAlpha: 0 });
      gsap.set(".cta-button", { scale: 0.9, autoAlpha: 0 });

      // 2. Animasi Hero
      tl.to(".hero-text", {
        y: 0,
        autoAlpha: 1,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
      })
        .to(
          ".cta-button",
          {
            scale: 1,
            autoAlpha: 1,
            duration: 0.5,
            ease: "back.out(1.7)",
          },
          "-=0.5",
        )
        .to(
          ".feature-card",
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
          },
          "-=0.3",
        );

      // 3. Background Blobs Animation
      gsap.to(".blob", {
        x: "random(-50, 50)",
        y: "random(-50, 50)",
        scale: "random(0.9, 1.1)",
        rotation: "random(-20, 20)",
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 2,
      });
    },
    { scope: container },
  );

  return (
    <main
      ref={container}
      className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center overflow-hidden selection:bg-teal-500/30"
    >
      {/* === DYNAMIC BACKGROUND === */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="blob absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 opacity-70 blur-[100px]" />
        <div className="blob absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-teal-500/10 opacity-70 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />{" "}
        {/* Optional Grid Pattern */}
      </div>

      <div className="relative z-10 container px-4 md:px-6">
        {/* === HERO SECTION === */}
        <div className="mb-16 flex flex-col items-center space-y-8 pt-20 text-center">
          <div className="hero-text inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-sm font-medium text-teal-500 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Gen Academic Dashboard</span>
          </div>

          <h1 className="hero-text mx-auto max-w-4xl text-5xl leading-tight font-black tracking-tighter md:text-7xl lg:text-8xl">
            Manage Data <br />
            <span className="bg-linear-to-r from-teal-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Like a Pro.
            </span>
          </h1>

          <p className="hero-text text-muted-foreground max-w-[600px] text-lg leading-relaxed md:text-xl">
            Platform all-in-one untuk manajemen tugas kuliah, database berbasis
            Discord, dan tools teknik sipil yang powerful.
          </p>

          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button
                size="lg"
                className="cta-button bg-foreground text-background hover:bg-foreground/90 h-12 rounded-full px-8 text-base font-bold transition-transform hover:scale-105"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/kuliah/tools">
              <Button
                variant="outline"
                size="lg"
                className="cta-button border-foreground/20 hover:bg-foreground/5 h-12 rounded-full px-8 text-base backdrop-blur-sm"
              >
                <Terminal className="mr-2 h-4 w-4" />
                Explore Tools
              </Button>
            </Link>
          </div>
        </div>

        {/* === FEATURES GRID (BENTO STYLE) === */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 pb-20 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <div
              key={i}
              className={cn(
                "feature-card group border-border/50 bg-card/30 relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                feature.bg,
              )}
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative z-10 flex h-full flex-col">
                <div
                  className={cn(
                    "bg-background/50 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 shadow-sm transition-transform group-hover:scale-110",
                    feature.color,
                  )}
                >
                  {feature.icon}
                </div>
                <h3 className="text-foreground mb-2 text-xl font-bold">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* === FOOTER DECORATION === */}
        <div className="via-border absolute bottom-0 left-0 h-px w-full bg-linear-to-r from-transparent to-transparent opacity-50" />
      </div>
    </main>
  );
}
