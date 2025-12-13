// src/app/kuliah/tools/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  ClipboardCheck,
  FileInput,
  Camera,
  GraduationCap,
  BetweenHorizontalStart,
  Map,
  Construction,
  Ruler,
  Search,
  Lock,
  Unlock,
  Terminal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { useDevMode } from "@/lib/hooks/useDevMode";

const categoryColors: Record<string, string> = {
  Survey:
    "text-teal-500 group-hover:text-teal-400 bg-teal-500/10 group-hover:bg-teal-500/20 border-teal-200/20 group-hover:border-teal-500/50",
  Admin:
    "text-rose-500 group-hover:text-rose-400 bg-rose-500/10 group-hover:bg-rose-500/20 border-rose-200/20 group-hover:border-rose-500/50",
  Data: "text-amber-500 group-hover:text-amber-400 bg-amber-500/10 group-hover:bg-amber-500/20 border-amber-200/20 group-hover:border-amber-500/50",
  Teknik:
    "text-indigo-500 group-hover:text-indigo-400 bg-indigo-500/10 group-hover:bg-indigo-500/20 border-indigo-200/20 group-hover:border-indigo-500/50",
};

const tools = [
  {
    href: "/kuliah/tools/interval-generator",
    label: "Generator Interval",
    icon: BetweenHorizontalStart,
    desc: "Hitung interval kontur otomatis.",
    cat: "Survey",
  },
  {
    href: "/kuliah/tools/survey-dashboard",
    label: "Dashboard Survey",
    icon: ClipboardCheck,
    desc: "Analisis data survey perjalanan.",
    cat: "Survey",
  },
  {
    href: "/kuliah/tools/iut-calculator",
    label: "Kalkulator IUT",
    icon: Calculator,
    desc: "Hitung poligon dan azimuth.",
    cat: "Survey",
  },
  {
    href: "/kuliah/tools/photo-formatter",
    label: "Photo Formatter",
    icon: Camera,
    desc: "Format foto lapangan ke DOCX.",
    cat: "Admin",
    admin: true,
  },
  {
    href: "/kuliah/tools/checklist-teksip",
    label: "Checklist Teksip",
    icon: FileInput,
    desc: "Cek kelengkapan tugas angkatan.",
    cat: "Admin",
  },
  {
    href: "/kuliah/tools/sipadu-leaked",
    label: "Sipadu Viewer",
    icon: GraduationCap,
    desc: "Data publik mahasiswa.",
    cat: "Data",
    admin: true,
  },
  {
    href: "/kuliah/tools/kontur-trase-jalan",
    label: "Vis. Kontur & Trase",
    icon: Map,
    desc: "Simulasi peta kontur jalan.",
    cat: "Teknik",
  },
  {
    href: "/kuliah/tools/jembatan-balsa",
    label: "Sim. Jembatan Balsa",
    icon: Construction,
    desc: "Analisis beban jembatan kayu.",
    cat: "Teknik",
    admin: true,
  },
  {
    href: "/kuliah/tools/mekban-solver",
    label: "MekaBahan Solver",
    icon: Ruler,
    desc: "Hitung SFD, BMD, dan inersia.",
    cat: "Teknik",
  },
];

export default function ToolsPage() {
  const [search, setSearch] = useState("");
  const { isDevMode, unlockDevMode, lockDevMode } = useDevMode();

  const [isUnlockOpen, setIsUnlockOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockDevMode(passwordInput);
    if (success) {
      setIsUnlockOpen(false);
      setPasswordInput("");
    }
  };

  const filteredTools = tools.filter((t) => {
    if (t.admin && !isDevMode) return false;
    const matchesSearch =
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.desc.toLowerCase().includes(search.toLowerCase()) ||
      t.cat.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <main className="bg-background relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-teal-500/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center md:text-left">
            <h1 className="mb-2 text-3xl font-black tracking-tight md:text-4xl">
              Engineering{" "}
              <span className="bg-linear-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent">
                Toolkit
              </span>
            </h1>
            <p className="text-muted-foreground">
              Kumpulan alat bantu produktivitas kuliah.
            </p>
          </div>

          <div className="group relative w-full md:w-72">
            <div className="absolute -inset-0.5 rounded-lg bg-linear-to-r from-teal-500 to-indigo-500 opacity-20 blur transition duration-500 group-hover:opacity-50" />
            <div className="bg-background border-border relative flex items-center rounded-lg border">
              <Search className="text-muted-foreground ml-3 h-4 w-4" />
              <Input
                placeholder="Cari tools..."
                className="placeholder:text-muted-foreground/50 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filteredTools.length === 0 ? (
          <div className="text-muted-foreground animate-in fade-in zoom-in-95 flex flex-col items-center justify-center py-20 duration-500">
            <div className="bg-muted/50 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Search className="h-8 w-8 opacity-50" />
            </div>
            <p>Tidak ada tools yang cocok dengan "{search}"</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 grid grid-cols-1 gap-4 duration-700 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map((tool, i) => {
              const colorClass =
                categoryColors[tool.cat] || "text-foreground bg-muted";

              return (
                <Link
                  href={tool.href}
                  key={i}
                  className="group relative block touch-manipulation"
                >
                  <div
                    className={cn(
                      "relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/50 shadow-sm backdrop-blur-md transition-all duration-300 active:scale-95 md:hover:-translate-y-1 md:hover:shadow-xl dark:border-white/5 dark:bg-black/20",
                      tool.admin &&
                        "border-rose-500/20 dark:border-rose-500/20",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0 left-0 h-1 w-full bg-linear-to-r opacity-0 transition-opacity group-hover:opacity-100",
                        tool.cat === "Survey"
                          ? "from-teal-400 to-emerald-500"
                          : tool.cat === "Admin"
                            ? "from-rose-400 to-red-500"
                            : tool.cat === "Teknik"
                              ? "from-indigo-400 to-blue-500"
                              : "from-amber-400 to-orange-500",
                      )}
                    />

                    <div className="flex h-full flex-col p-5">
                      <div className="mb-4 flex items-start justify-between">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-500",
                            colorClass,
                            "group-hover:shadow-[0_0_20px_-5px_currentColor]",
                          )}
                        >
                          <div className="animate-[bounce_3s_infinite]">
                            <tool.icon className="h-6 w-6" />
                          </div>
                        </div>
                        <span
                          className={cn(
                            "bg-background/50 rounded-md border px-2 py-1 text-[10px] font-bold tracking-wider uppercase",
                            tool.admin
                              ? "border-rose-200 text-rose-500 dark:border-rose-900"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          {tool.admin ? (
                            <span className="flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Admin
                            </span>
                          ) : (
                            tool.cat
                          )}
                        </span>
                      </div>

                      <h3 className="group-hover:text-primary mb-2 text-lg font-bold transition-colors">
                        {tool.label}
                      </h3>
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed right-6 bottom-6 z-50">
        {isDevMode ? (
          <Button
            variant="outline"
            size="icon"
            onClick={lockDevMode}
            className="rounded-full border-rose-500/50 text-rose-500 shadow-lg hover:bg-rose-500/10 hover:text-rose-600"
            title="Lock Developer Mode"
          >
            <Lock className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsUnlockOpen(true)}
            className="text-muted-foreground/30 hover:text-foreground/50 text-xs"
          >
            <Terminal className="mr-2 h-3 w-3" />
            v2.0.0
          </Button>
        )}
      </div>

      <Dialog open={isUnlockOpen} onOpenChange={setIsUnlockOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-indigo-500" /> Unlock Dev Mode
            </DialogTitle>
            <DialogDescription>
              Masukan sandi untuk mengakses fitur experimental & admin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUnlockSubmit} className="space-y-4 py-2">
            <Input
              type="password"
              placeholder="Enter Access Code"
              className="text-center font-mono tracking-widest"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Unlock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
