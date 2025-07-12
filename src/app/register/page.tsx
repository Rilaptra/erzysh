// src/app/register/page.tsx
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const container = useRef(null);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Animasi
  useGSAP(
    () => {
      gsap.from(".auth-card", {
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: "power3.out",
      });
      // Animasi background sama seperti di landing page
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
    },
    { scope: container },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create account.");
      }

      // Jika berhasil, redirect ke halaman login untuk sign in
      router.push("/login");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      ref={container}
      className="bg-dark-shale relative flex min-h-screen items-center justify-center overflow-hidden p-4"
    >
      {/* Background Animasi */}
      <div className="absolute inset-0 z-0">
        <div className="gsap-blob-1 bg-teal-muted/20 absolute top-1/4 left-1/4 h-72 w-72 rounded-full blur-3xl filter"></div>
        <div className="gsap-blob-2 bg-gunmetal/50 absolute top-1/2 right-1/4 h-56 w-56 rounded-full blur-3xl filter"></div>
      </div>

      <Card className="auth-card bg-gunmetal/50 border-gunmetal text-off-white z-10 w-full max-w-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription className="text-off-white/70">
            Enter your details to get started.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-dark-shale border-teal-muted/30 focus:border-teal-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-dark-shale border-teal-muted/30 focus:border-teal-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-dark-shale border-teal-muted/30 focus:border-teal-muted"
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-red-500">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="bg-teal-muted text-dark-shale hover:bg-teal-muted/90 mt-4 w-full"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-teal-muted hover:text-teal-muted/80 underline"
              >
                Sign In
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
