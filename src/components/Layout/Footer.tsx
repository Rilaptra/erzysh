// src/components/Layout/Footer.tsx
"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 w-full border-t backdrop-blur">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Copyright by{" "}
            <Link
              href="https://github.com/Rilaptra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary font-medium underline-offset-4 transition-colors hover:underline"
            >
              Rizqi Lasheva (Erzy.sh)
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
