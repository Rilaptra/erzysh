// src/app/page.tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogIn } from "lucide-react";

export default function Home() {
  const container = useRef(null);

  useGSAP(
    () => {
      // Timeline untuk animasi konten utama
      const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
      tl.from(".gsap-reveal-text", {
        y: 100,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
      }).fromTo(
        ".gsap-fade-in",
        {
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
        },
        {
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
        },
        "-=0.5",
      );

      // --- ANIMASI BACKGROUND BARU ---

      // 1. Animasi untuk blob latar belakang
      gsap.to(".gsap-blob-1", {
        x: "random(-150, 150)",
        y: "random(-100, 100)",
        scale: 1.2,
        duration: 8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      gsap.to(".gsap-blob-2", {
        x: "random(-100, 100)",
        y: "random(-150, 150)",
        scale: 1.1,
        duration: 10,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      // 2. Update animasi kurva SVG menjadi bergelombang
      gsap.to(".gsap-curve", {
        y: "-=15",
        ease: "sine.inOut",
        duration: 4,
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.3,
          from: "start",
        },
      });
    },
    { scope: container },
  );

  return (
    <main
      ref={container}
      className="bg-dark-shale text-off-white relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
    >
      {/* Kontainer untuk Blob Animator */}
      <div className="absolute inset-0 z-0">
        <div className="gsap-blob-1 bg-teal-muted/20 absolute top-1/4 left-1/4 h-72 w-72 rounded-full blur-3xl filter"></div>
        <div className="gsap-blob-2 bg-gunmetal/50 absolute top-1/2 right-1/4 h-56 w-56 rounded-full blur-3xl filter"></div>
      </div>

      {/* Konten Utama */}
      <div className="z-10 flex flex-col items-center justify-center px-4 text-center">
        <div className="overflow-hidden pb-4">
          <h1 className="gsap-reveal-text from-off-white bg-gradient-to-b to-gray-400 bg-clip-text text-5xl font-bold tracking-tighter text-transparent md:text-7xl">
            Erzysh
          </h1>
        </div>
        <div className="overflow-hidden pb-2">
          <p className="gsap-reveal-text text-off-white/80 max-w-2xl text-lg md:text-xl">
            A creative Database-as-a-Service, uniquely powered by Discord.
            <br />
            Your data, reimagined.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link href="/login">
            <Button className="gsap-fade-in bg-teal-muted text-dark-shale hover:bg-teal-muted/90 h-12 px-6 text-base font-semibold">
              <LogIn className="mr-2 size-5" />
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button
              variant="outline"
              className="gsap-fade-in text-dark-shale border-gunmetal hover:bg-gunmetal/80 h-12 px-6 text-base font-semibold"
            >
              Get Started
              <ArrowRight className="ml-2 size-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Elemen Desain Kurva SVG */}
      <div className="absolute bottom-0 left-0 z-0 h-auto w-full">
        <svg
          className="h-auto w-full"
          viewBox="0 0 1440 320"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Kurva Latar Belakang */}
          <path
            className="gsap-curve"
            fill="#31363F" // Warna gunmetal
            d="M0,224L60,202.7C120,181,240,139,360,144C480,149,600,203,720,202.7C840,203,960,149,1080,117.3C1200,85,1320,75,1380,69.3L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          ></path>
          {/* Kurva Aksen */}
          <path
            className="gsap-curve"
            fill="#76ABAE" // Warna teal-muted
            d="M0,256L80,240C160,224,320,192,480,197.3C640,203,800,245,960,250.7C1120,256,1280,224,1360,208L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          ></path>
        </svg>
      </div>
    </main>
  );
}
