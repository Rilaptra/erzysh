// src/app/login/page.tsx
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
  LogIn,
  User,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const containerRef = useRef(null);
  const router = useRouter();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- ANIMASI GSAP (DIPERBAIKI) ---
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Set Initial State (Sembunyikan dulu)
      gsap.set(".auth-element", { y: 20, autoAlpha: 0 });
      gsap.set(".brand-element", { x: -50, autoAlpha: 0 });

      // 2. Animasi Form Muncul (auth-element)
      gsap.to(".auth-element", {
        y: 0,
        autoAlpha: 1, // autoAlpha otomatis handle opacity & visibility
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2,
      });

      // 3. Animasi Branding Muncul (brand-element)
      gsap.to(".brand-element", {
        x: 0,
        autoAlpha: 1,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
      });

      // 4. Blob Background Floating
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
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Login failed");
      }

      toast.success("Welcome back! Redirecting...");
      router.push("/database");
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
      {/* === LEFT SIDE: BRANDING / VISUAL === */}
      <div className="bg-muted/10 border-border/50 relative hidden w-1/2 items-center justify-center border-r p-12 lg:flex">
        <div className="absolute inset-0 overflow-hidden">
          <div className="blob absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-teal-500/20 blur-[80px]" />
          <div className="blob absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-purple-500/20 blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="brand-element bg-background/50 border-border text-muted-foreground invisible mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-amber-400" /> Secure Access Portal
          </div>
          <h1 className="brand-element invisible mb-4 text-5xl leading-tight font-black tracking-tighter">
            Welcome to <br />
            <span className="bg-linear-to-r from-teal-500 to-indigo-500 bg-clip-text text-transparent">
              Eryzsh System.
            </span>
          </h1>
          <p className="brand-element text-muted-foreground invisible text-lg leading-relaxed">
            Kelola database, pantau jadwal kuliah, dan akses tools teknik sipil
            dalam satu dashboard terintegrasi.
          </p>
        </div>
      </div>

      {/* === RIGHT SIDE: FORM === */}
      <div className="relative flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden lg:hidden">
          <div className="blob absolute top-0 right-0 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="blob absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="auth-element invisible text-3xl font-bold tracking-tight">
              Sign in
            </h2>
            <p className="auth-element text-muted-foreground invisible mt-2">
              Masukan kredensial akun Eryzsh kamu.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="auth-element invisible space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="group relative">
                  <User className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4 transition-colors group-focus-within:text-teal-500" />
                  <Input
                    id="username"
                    placeholder="Contoh: Rilaptra"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="bg-background/50 border-muted-foreground/20 h-10 pl-10 transition-all focus-visible:ring-teal-500/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="#"
                    className="tabindex-[-1] text-xs text-teal-600 hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>
                <div className="group relative">
                  <Lock className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4 transition-colors group-focus-within:text-teal-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-background/50 border-muted-foreground/20 h-10 pr-10 pl-10 transition-all focus-visible:ring-teal-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-2.5 right-3 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* PENTING: Class 'auth-element' tetap ada, tapi di-handle via gsap.set initial state */}
            <Button
              type="submit"
              className="auth-element invisible h-11 w-full bg-linear-to-r from-teal-600 to-teal-500 font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] hover:from-teal-500 hover:to-teal-400 hover:shadow-teal-500/30"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {loading ? "Verifying..." : "Sign In"}
            </Button>
          </form>

          <p className="auth-element text-muted-foreground invisible text-center text-sm">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="group inline-flex items-center gap-1 font-semibold text-teal-600 transition-colors hover:text-teal-500"
            >
              Daftar Sekarang{" "}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
