// src/components/Layout/Header/index.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Moon, Sun, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import gsap from "gsap";
import { cn } from "@/lib/cn";
import { useHeaderContext } from "@/context/HeaderContext";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Database", href: "/database" },
  { name: "Kuliah", href: "/kuliah" },
];

export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { headerContent, headerActions } = useHeaderContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const headerRef = useRef(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // --- 1. Lock Body Scroll saat Menu Terbuka ---
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // --- 2. Animasi Masuk Desktop (GSAP Set + To) ---
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".nav-brand", { y: -20, autoAlpha: 0 });
      gsap.set(".nav-item", { y: -20, autoAlpha: 0 });
      gsap.set(".nav-action", { x: 20, autoAlpha: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(".nav-brand", { y: 0, autoAlpha: 1, duration: 0.8 })
        .to(
          ".nav-item",
          { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 },
          "-=0.6",
        )
        .to(".nav-action", { x: 0, autoAlpha: 1, duration: 0.8 }, "-=0.6");
    }, headerRef);
    return () => ctx.revert();
  }, []);

  // --- 3. Animasi Mobile Menu ---
  useEffect(() => {
    const menu = mobileMenuRef.current;
    if (!menu) return;

    if (isMobileMenuOpen) {
      // Pastikan display flex sebelum animasi mulai
      gsap.set(menu, { display: "flex", x: "100%" });

      // Buka Menu
      gsap.to(menu, {
        x: "0%",
        duration: 0.5,
        ease: "expo.out",
      });

      // Animasi Link (Stagger)
      gsap.set(".mobile-link", { x: 50, autoAlpha: 0 });
      gsap.to(".mobile-link", {
        x: 0,
        autoAlpha: 1,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.2,
        ease: "back.out(1.2)",
      });
    } else {
      // Tutup Menu
      gsap.to(menu, {
        x: "100%",
        duration: 0.4,
        ease: "expo.in",
        onComplete: () => {
          gsap.set(menu, { display: "none" });
        },
      });
    }
  }, [isMobileMenuOpen]);

  // Tutup menu saat pindah halaman
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        ref={headerRef}
        className="border-border/40 bg-background/80 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur-xl"
      >
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-8">
          {/* BAGIAN KIRI: LOGO */}
          <div className="flex flex-1 justify-start">
            <div className="nav-brand flex items-center gap-3">
              <Link
                href="/"
                className="relative flex h-9 w-9 overflow-hidden rounded-lg shadow-lg shadow-teal-500/20 transition-transform active:scale-95"
              >
                <Image
                  src="/icon-192x192.png"
                  alt="Erzysh Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </Link>
              <Link href="/" className="text-xl font-bold tracking-tight">
                Erzy
                <span className="bg-linear-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">
                  sh
                </span>
              </Link>
            </div>
          </div>

          {/* BAGIAN TENGAH: NAVIGASI atau DYNAMIC CONTENT */}
          <div className="flex flex-1 items-center justify-center">
            {headerContent ? (
              <div className="animate-in fade-in zoom-in slide-in-from-top-4 duration-500">
                {headerContent}
              </div>
            ) : (
              <nav className="hidden items-center justify-center gap-1 md:flex">
                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "nav-item hover:bg-muted/50 relative rounded-full px-4 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "text-foreground bg-muted/80 shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.name}
                      {isActive && (
                        <span className="absolute inset-x-0 -bottom-[19px] mx-auto h-[2px] w-1/2 rounded-t-full bg-teal-500" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* BAGIAN KANAN: ACTIONS */}
          <div className="flex flex-1 justify-end">
            <div className="nav-action flex items-center gap-2">
              {/* Dynamic Action from Page (e.g. UploadStatus) */}
              {headerActions && (
                <div className="animate-in fade-in slide-in-from-right-4 mr-2 duration-500">
                  {headerActions}
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:bg-muted rounded-full transition-transform active:scale-90"
              >
                <Sun className="h-5 w-5 scale-100 rotate-0 text-amber-500 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-5 w-5 scale-0 rotate-90 text-blue-400 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* TOMBOL MENU MOBILE */}
              <Button
                variant="ghost"
                size="icon"
                className="z-50 rounded-full transition-transform active:scale-90 md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE MENU OVERLAY */}
      <div
        ref={mobileMenuRef}
        className="bg-background/95 fixed inset-0 z-40 hidden flex-col px-6 pt-24 backdrop-blur-2xl"
      >
        {/* Background Decor */}
        <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-teal-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col gap-4">
          <p className="mobile-link text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mobile-link group hover:border-border/50 flex items-center justify-between border-b border-transparent py-2 text-3xl font-black tracking-tight transition-all",
                  isActive
                    ? "border-l-4 border-l-teal-500 bg-linear-to-r from-teal-500 to-blue-500 bg-clip-text pl-2 text-transparent"
                    : "text-foreground/80 hover:text-foreground hover:pl-2",
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
                <ChevronRight
                  className={cn(
                    "h-6 w-6 transition-transform group-hover:translate-x-1",
                    isActive ? "text-blue-500" : "text-muted-foreground/30",
                  )}
                />
              </Link>
            );
          })}
        </div>

        <div className="relative z-10 mt-auto mb-8 space-y-6">
          <div className="mobile-link bg-muted/50 rounded-2xl border border-white/5 p-4">
            <p className="text-sm font-medium">Logged in as User</p>
            <p className="text-muted-foreground text-xs">Erzysh System User</p>
          </div>

          <div className="mobile-link border-border/50 border-t pt-6 text-center">
            <p className="text-muted-foreground text-xs">
              &copy; 2025 Erzysh System
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
