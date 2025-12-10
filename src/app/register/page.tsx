// src/app/register/page.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  UserPlus,
  User,
  Lock,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

export default function RegisterPage() {
  const containerRef = useRef(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [passMatch, setPassMatch] = useState(true);

  // --- ANIMASI GSAP (DIPERBAIKI) ---
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Set Initial State (Start Invisible)
      gsap.set(".auth-element", { y: 20, autoAlpha: 0 });
      gsap.set(".brand-element", { x: 50, autoAlpha: 0 });

      // 2. Animate Form (auth-element)
      gsap.to(".auth-element", {
        y: 0,
        autoAlpha: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2,
      });

      // 3. Animate Branding (brand-element)
      gsap.to(".brand-element", {
        x: 0,
        autoAlpha: 1,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
      });

      // 4. Background Blobs
      gsap.to(".blob", {
        x: "random(-30, 30)",
        y: "random(-30, 30)",
        scale: "random(0.9, 1.1)",
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 1,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [id]: value };
      if (id === "confirmPassword" || id === "password") {
        if (id === "password" && newData.confirmPassword) {
          setPassMatch(value === newData.confirmPassword);
        } else if (id === "confirmPassword") {
          setPassMatch(value === newData.password);
        }
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passMatch) {
      toast.error("Password tidak cocok!");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Registration failed");
      }

      toast.success("Akun berhasil dibuat! Silakan login.");
      router.push("/login");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      ref={containerRef}
      className="bg-background text-foreground flex min-h-screen w-full overflow-hidden"
    >
      {/* === LEFT SIDE: FORM === */}
      <div className="relative order-1 flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden lg:hidden">
          <div className="blob absolute top-0 left-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="w-full max-w-md space-y-8">
          <Link
            href="/login"
            className="auth-element text-muted-foreground hover:text-foreground invisible mb-4 inline-flex items-center text-sm transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Login
          </Link>

          <div className="text-center lg:text-left">
            <h2 className="auth-element invisible text-3xl font-bold tracking-tight">
              Create Account
            </h2>
            <p className="auth-element text-muted-foreground invisible mt-2">
              Bergabung untuk mengakses fitur eksklusif.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="auth-element invisible space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="group relative">
                  <User className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4 transition-colors group-focus-within:text-indigo-500" />
                  <Input
                    id="username"
                    placeholder="Pilih username unik"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="bg-background/50 border-muted-foreground/20 h-10 pl-10 transition-all focus-visible:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="group relative">
                  <Lock className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4 transition-colors group-focus-within:text-indigo-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 8 karakter"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-background/50 border-muted-foreground/20 h-10 pl-10 transition-all focus-visible:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <div className="group relative">
                  <ShieldCheck
                    className={cn(
                      "absolute top-2.5 left-3 h-4 w-4 transition-colors",
                      passMatch && formData.confirmPassword
                        ? "text-green-500"
                        : "text-muted-foreground group-focus-within:text-indigo-500",
                    )}
                  />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ulangi password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={cn(
                      "bg-background/50 border-muted-foreground/20 h-10 pl-10 transition-all focus-visible:ring-offset-0",
                      !passMatch && formData.confirmPassword
                        ? "border-red-500 focus-visible:ring-red-500/30"
                        : "focus-visible:ring-indigo-500/30",
                    )}
                  />
                </div>
                {!passMatch && formData.confirmPassword && (
                  <p className="animate-pulse text-xs text-red-500">
                    Password tidak cocok
                  </p>
                )}
              </div>
            </div>

            {/* Tombol Register diperbaiki dengan autoAlpha */}
            <Button
              type="submit"
              className="auth-element invisible h-11 w-full bg-linear-to-r from-indigo-600 to-indigo-500 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:from-indigo-500 hover:to-indigo-400"
              disabled={loading || !passMatch}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
        </div>
      </div>

      {/* === RIGHT SIDE: BRANDING / VISUAL (Desktop Only) === */}
      <div className="bg-muted/10 border-border/50 relative order-2 hidden w-1/2 items-center justify-center border-l p-12 lg:flex">
        <div className="absolute inset-0 overflow-hidden">
          <div className="blob absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-indigo-500/20 blur-[80px]" />
          <div className="blob absolute bottom-1/4 left-1/4 h-64 w-64 rounded-full bg-cyan-500/20 blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-lg text-right">
          <div className="brand-element bg-background/50 border-border text-muted-foreground invisible mb-6 ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium backdrop-blur-md">
            <CheckCircle2 className="h-4 w-4 text-green-500" /> Join the
            Community
          </div>
          <h1 className="brand-element invisible mb-4 text-5xl leading-tight font-black tracking-tighter">
            Start Your <br />
            <span className="bg-linear-to-l from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
              Journey Here.
            </span>
          </h1>
          <p className="brand-element text-muted-foreground invisible text-lg leading-relaxed">
            Daftarkan diri Anda untuk mulai menggunakan berbagai alat bantu
            hitung dan manajemen kuliah yang powerful.
          </p>
        </div>
      </div>
    </main>
  );
}
