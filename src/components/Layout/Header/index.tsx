"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Database", href: "/database" },
  { name: "Kuliah", href: "/kuliah" },
];

export default function Header() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const headerRef = useRef(null);
  const logoContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopNavRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const actionButtonsRef = useRef<HTMLDivElement | null>(null);

  // --- GSAP Animations ---

  // Initial page load animations
  useGSAP(() => {
    gsap.fromTo(
      headerRef.current,
      { y: -60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
    );

    gsap.fromTo(
      logoContainerRef.current,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.6, delay: 0.2, ease: "power2.out" },
    );

    gsap.fromTo(
      desktopNavRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, delay: 0.4, ease: "power2.out" },
    );

    gsap.fromTo(
      actionButtonsRef.current,
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.5, delay: 0.5, ease: "power2.out" },
    );
  }, []);

  // Mobile menu animation (Slide from right)
  useGSAP(
    () => {
      const menu = mobileMenuRef.current;
      if (isMobileMenuOpen) {
        gsap.set(menu, { display: "block" });
        gsap.to(menu, {
          x: 0, // Slide in to original position
          opacity: 1,
          duration: 0.4,
          ease: "power3.out",
        });
        gsap.fromTo(
          ".mobile-nav-link",
          { opacity: 0, x: 20 }, // Slide from right
          {
            opacity: 1,
            x: 0,
            duration: 0.4,
            ease: "power2.out",
            stagger: 0.08,
            delay: 0.2,
          },
        );
      } else {
        // Animate out
        gsap.to(menu, {
          x: "100%", // Slide out to the right
          opacity: 0,
          duration: 0.3,
          ease: "power3.in",
          onComplete: () => {
            gsap.set(menu, { display: "none" });
          },
        });
      }
    },
    { dependencies: [isMobileMenuOpen], scope: mobileMenuRef },
  );

  // Effect to close mobile menu on route change
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header
        ref={headerRef}
        className="border-border/30 sticky top-0 z-50 w-full border-b backdrop-blur-md"
        style={{
          backgroundColor:
            theme === "dark"
              ? "rgba(15, 15, 15, 0.6)" // dark mode
              : "rgba(255, 255, 255, 0.6)", // light mode
        }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div ref={logoContainerRef}>
            <Link href="/" className="text-primary text-xl font-bold">
              Eryzsh
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav
            ref={desktopNavRef}
            className="hidden items-center gap-6 text-sm font-medium sm:flex"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`hover:text-primary transition-colors ${
                  pathname.startsWith(item.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Action Buttons: Theme Toggle & Mobile Menu Toggle */}
          <div ref={actionButtonsRef} className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div
        ref={mobileMenuRef}
        className="fixed top-16 right-0 z-40 hidden h-screen w-4/5 max-w-sm translate-x-full transform opacity-0 sm:hidden"
        style={{
          backgroundColor:
            theme === "dark" ? "rgb(15, 15, 15)" : "rgb(255, 255, 255)",
        }}
      >
        <nav className="flex flex-col items-center gap-8 pt-12">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mobile-nav-link text-lg font-medium"
            >
              <span
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
      </div>
    </>
  );
}
