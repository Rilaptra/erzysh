// src/components/Layout/Footer.tsx
"use client";

import Link from "next/link";
import { Github, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-background/20 pb-safe border-t backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
          {/* Left: Brand & Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <span className="text-lg font-bold tracking-tight">Erzysh</span>
              <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                BETA
              </span>
            </div>
            <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm md:justify-start">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              System Operational
            </div>
          </div>

          {/* Center: Socials (Di Mobile pindah ke tengah urutannya) */}
          <div className="order-last flex gap-4 md:order-0">
            <Link
              href="https://github.com/Rilaptra"
              target="_blank"
              className="group bg-muted/50 text-muted-foreground hover:bg-foreground hover:text-background rounded-full p-3 transition-all hover:scale-110 active:scale-95"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </Link>
            <Link
              href="https://erzysh.vercel.app"
              target="_blank"
              className="group bg-muted/50 text-muted-foreground rounded-full p-3 transition-all hover:scale-110 hover:bg-blue-600 hover:text-white active:scale-95"
              aria-label="Portfolio"
            >
              <Globe className="h-5 w-5" />
            </Link>
          </div>

          {/* Right: Credits */}
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Rizqi Lasheva</p>
            <p className="text-muted-foreground/50 text-xs">
              &copy; {new Date().getFullYear()} Erzysh System.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
