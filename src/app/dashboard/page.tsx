"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { cn } from "@/lib/cn";

export default function DashboardPage() {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [paddingTop, setPaddingTop] = useState(64); // default header height

  useEffect(() => {
    const header = document.querySelector("header");
    if (header) {
      setPaddingTop(header.clientHeight);
    }

    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
        },
      );
    }
  }, []);

  return (
    <main
      className={cn(
        "min-h-screen w-full px-4 py-6 transition-colors",
        "bg-background text-foreground",
      )}
      style={{ paddingTop }}
    >
      <div className="container mx-auto">
        <h1
          ref={titleRef}
          className="text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Dashboard
        </h1>

        <div className="border-border bg-muted/50 mt-6 rounded-lg border p-6 shadow-lg backdrop-blur-md">
          <p className="text-muted-foreground">
            Selamat datang di Eryzsh DB! 🎉 Di sini kamu bisa mengelola data,
            jadwal kuliah, dan lainnya lewat antarmuka modern.
          </p>
        </div>
      </div>
    </main>
  );
}
