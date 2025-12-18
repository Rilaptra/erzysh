// src/app/not-found.tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Ghost, Terminal } from "lucide-react";

export default function NotFound() {
  const container = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      // 1. Initial State
      gsap.set(".not-found-content", { y: 40, autoAlpha: 0 });
      gsap.set(".ghost-icon", { y: -30, autoAlpha: 0, scale: 0.8 });
      gsap.set(".decoration-line", { scaleX: 0 });

      // 2. Animations
      tl.to(".ghost-icon", {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        duration: 1.2,
        ease: "back.out(1.7)",
      })
        .to(
          ".not-found-content",
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
          },
          "-=0.7",
        )
        .to(
          ".decoration-line",
          {
            scaleX: 1,
            duration: 1,
            ease: "expo.inOut",
          },
          "-=0.5",
        );

      // 3. Floating Ghost Animation
      gsap.to(".ghost-icon", {
        y: -15,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // 4. Background Blobs Animation
      gsap.to(".blob", {
        x: "random(-60, 60)",
        y: "random(-60, 60)",
        scale: "random(0.8, 1.2)",
        duration: 12,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 3,
      });
    },
    { scope: container },
  );

  return (
    <div
      ref={container}
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-20 selection:bg-teal-500/30"
    >
      {/* === DYNAMIC BACKGROUND === */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="blob absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-teal-500/5 opacity-70 blur-[120px]" />
        <div className="blob absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/5 opacity-70 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-size-[40px_40px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Ghost Icon */}
        <div className="ghost-icon group relative mb-8">
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-teal-500/10 blur-2xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-teal-500/10 bg-teal-500/5 text-teal-500/80 backdrop-blur-xl transition-transform duration-500 group-hover:scale-110 sm:h-28 sm:w-28">
            <Ghost size={56} strokeWidth={1} />
            <div className="bg-background border-border absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border">
              <span className="text-[10px] font-bold">404</span>
            </div>
          </div>
        </div>

        <h1 className="not-found-content mb-2 text-7xl font-black tracking-tighter sm:text-8xl md:text-9xl">
          <span className="bg-linear-to-r from-teal-400 via-blue-500 to-purple-600 bg-clip-text text-transparent opacity-80">
            Lost
          </span>
          <span className="text-foreground/10">.</span>
        </h1>

        <div className="not-found-content mx-auto mb-6 flex items-center gap-3">
          <div className="decoration-line h-px w-8 bg-linear-to-r from-transparent to-teal-500/30 sm:w-12" />
          <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-teal-500/60 uppercase sm:text-xs">
            Protocol: 404_VOID
          </span>
          <div className="decoration-line h-px w-8 bg-linear-to-l from-transparent to-teal-500/30 sm:w-12" />
        </div>

        <p className="not-found-content text-muted-foreground/80 mb-10 max-w-[450px] px-4 text-base leading-relaxed sm:text-lg">
          Oops! Wrong direction!
        </p>

        <div className="not-found-content flex flex-col gap-4 sm:flex-row">
          <Link href="/">
            <Button
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 h-12 rounded-full px-8 text-base font-bold shadow-md transition-all hover:scale-105 active:scale-95 sm:h-14 sm:px-10"
            >
              <Home className="mr-2 h-5 w-5" />
              Main Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="border-foreground/10 hover:bg-foreground/5 h-12 rounded-full px-8 text-base backdrop-blur-sm transition-all active:scale-95 sm:h-14 sm:px-10"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Go Back
          </Button>
        </div>
      </div>

      {/* Decorative accent - Moved into flow to avoid overlap */}
      <div className="not-found-content text-muted-foreground/20 mt-20 flex items-center gap-4 font-mono text-[10px] font-bold tracking-widest">
        <div className="flex items-center gap-2">
          <Terminal size={12} />
          <span>STATUS: REDIRECT_WAITING</span>
        </div>
        <div className="bg-border h-1 w-1 rounded-full" />
        <span>V.2.0.404</span>
      </div>
    </div>
  );
}
