"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import gsap from "gsap";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Database", href: "/database" },
  { name: "Kuliah", href: "/kuliah" },
];

export default function Header() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const headerRef = useRef(null);
  const navLinksRef = useRef<(HTMLSpanElement | null)[]>([]);
  const logoContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
      );
    }

    if (logoContainerRef.current) {
      gsap.fromTo(
        logoContainerRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.6, delay: 0.2, ease: "power2.out" },
      );
    }

    navLinksRef.current.forEach((link, i) => {
      if (link) {
        gsap.fromTo(
          link,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            delay: 0.3 + i * 0.1,
            ease: "power2.out",
          },
        );
      }
    });
  }, []);

  return (
    <header
      ref={headerRef}
      className="border-border/30 fixed top-0 z-50 w-full border-b backdrop-blur-md"
      style={{
        backgroundColor:
          theme === "dark"
            ? "rgba(15, 15, 15, 0.6)" // dark mode
            : "rgba(255, 255, 255, 0.6)", // light mode
      }}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div ref={logoContainerRef}>
          <Link href="/" className="text-primary text-xl font-bold">
            Eryzsh DB
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="hidden gap-6 text-sm font-medium sm:flex">
          {navItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              passHref
              className="cursor-pointer select-none"
            >
              <span
                ref={(el) => {
                  navLinksRef.current[index] = el;
                }}
                className={`hover:text-primary transition-colors ${
                  pathname.startsWith(item.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
