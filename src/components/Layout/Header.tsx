// src/components/Layout/Header.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Moon,
  Sun,
  Menu,
  X,
  ChevronRight,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import gsap from "gsap";
import { cn } from "@/lib/cn";
import { useHeaderContext } from "@/context/HeaderContext";
import useSWR, { useSWRConfig } from "swr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Database", href: "/database" },
  { name: "Kuliah", href: "/kuliah" },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { headerContent, headerActions } = useHeaderContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { mutate } = useSWRConfig();

  const { data: user, isLoading } = useSWR("/api/auth/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const headerRef = useRef(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await mutate("/api/auth/me", null, { revalidate: false });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

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

  useEffect(() => {
    const menu = mobileMenuRef.current;
    if (!menu) return;

    if (isMobileMenuOpen) {
      gsap.set(menu, { display: "flex", x: "100%" });
      gsap.to(menu, { x: "0%", duration: 0.5, ease: "expo.out" });

      // Animasi elemen di dalam menu mobile
      gsap.set(".mobile-element", { x: 50, autoAlpha: 0 });
      gsap.to(".mobile-element", {
        x: 0,
        autoAlpha: 1,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.2,
        ease: "back.out(1.2)",
      });
    } else {
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header
        ref={headerRef}
        className="border-border/40 bg-background/80 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur-xl"
      >
        <div className="relative container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          {/* BAGIAN KIRI: LOGO */}
          <div className="flex shrink-0 items-center">
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
              {/* Sembunyikan Text Logo di Mobile jika ada content header agar tidak sempit */}
              <Link
                href="/"
                className={cn(
                  "text-xl font-bold tracking-tight",
                  headerContent && "block",
                )}
              >
                Erzy
                <span className="bg-linear-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">
                  sh
                </span>
              </Link>
            </div>
          </div>

          {/* BAGIAN TENGAH: NAVIGASI atau DYNAMIC CONTENT */}
          <div className="absolute top-1/2 left-1/2 flex flex-1 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden px-2">
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
          </div>

          {/* BAGIAN KANAN: ACTIONS & USER PROFILE */}
          <div className="flex shrink-0">
            <div className="nav-action flex items-center gap-2">
              {/* Dynamic Action from Page (e.g. UploadStatus) */}
              {headerActions && (
                <div className="animate-in fade-in slide-in-from-right-4 mr-1 duration-500">
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

              {/* DESKTOP ONLY: USER AVATAR DROPDOWN */}
              {/* Kita sembunyikan ini di mobile (hidden md:block) agar header bersih */}
              <div className="hidden md:block">
                {user && !isLoading ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="group hover:bg-muted/50 relative ml-1 flex h-9 items-center gap-2 rounded-full px-2 pr-3 pl-2"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-blue-500 text-xs font-bold text-white shadow-md ring-2 ring-transparent transition-all group-hover:ring-teal-500/30">
                          {getInitials(user.username)}
                        </div>
                        <div className="hidden text-left text-xs lg:block">
                          <p className="max-w-[80px] truncate font-semibold">
                            {user.username}
                          </p>
                        </div>
                        <ChevronDown className="text-muted-foreground h-3 w-3 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm leading-none font-medium">
                            {user.username}
                          </p>
                          <p className="text-muted-foreground text-xs leading-none">
                            {user.isAdmin ? "Administrator" : "User"}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : isLoading ? (
                  <div className="bg-muted ml-1 h-9 w-9 animate-pulse rounded-full" />
                ) : (
                  <Link href="/login">
                    <Button size="sm" className="ml-2 rounded-full px-4">
                      Login
                    </Button>
                  </Link>
                )}
              </div>

              {/* TOMBOL MENU MOBILE */}
              <Button
                variant="ghost"
                size="icon"
                className="z-50 ml-1 rounded-full transition-transform active:scale-90 md:hidden"
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
        <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-teal-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />

        {/* 1. USER PROFILE SECTION (DI MOBILE MENU) */}
        {/* Ini yang membuat header bersih, profile dipindah ke sini */}
        <div className="mobile-element mb-8">
          {user ? (
            <div className="bg-card/50 flex items-center gap-4 rounded-2xl border border-white/10 p-4 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-blue-500 text-lg font-bold text-white shadow-lg">
                {getInitials(user.username)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-lg font-bold">{user.username}</p>
                <p className="text-muted-foreground flex items-center gap-1 text-xs">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
                  {user.isAdmin ? "Administrator" : "Online"}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full rounded-xl bg-teal-600 py-6 text-lg shadow-lg hover:bg-teal-700">
                Login to Account
              </Button>
            </Link>
          )}
        </div>

        {/* 2. NAVIGATION LINKS */}
        <div className="relative z-10 flex flex-col gap-4">
          <p className="mobile-element text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mobile-element group hover:border-border/50 flex items-center justify-between border-b border-transparent py-3 text-3xl font-black tracking-tight transition-all",
                  isActive
                    ? "border-l-4 border-l-teal-500 bg-linear-to-r from-teal-500 to-blue-500 bg-clip-text pl-4 text-transparent"
                    : "text-foreground/80 hover:text-foreground hover:pl-4",
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

        {/* 3. FOOTER */}
        <div className="mobile-element relative z-10 mt-auto mb-8 space-y-6">
          <div className="border-border/50 border-t pt-6 text-center">
            <p className="text-muted-foreground text-xs">
              &copy; 2025 Erzysh System
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
