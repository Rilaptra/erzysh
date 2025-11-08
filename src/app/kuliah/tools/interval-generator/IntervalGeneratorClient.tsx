// src/app/kuliah/tools/interval-generator/IntervalGeneratorClient.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
// +++ LANGKAH 1: IMPORT KOMPONEN LATEX +++
import { InlineMath } from "react-katex";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Rocket,
  Calculator,
  Plus,
  Trash2,
  ChevronDown,
  ArrowRight,
  Eraser,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { softColors } from "@/lib/utils.client";

interface Result {
  p: string;
  distanceFromStart: number;
  formulaFromStart: string;
  distanceFromEnd: number;
  formulaFromEnd: string;
}

interface InputPair {
  id: number;
  start: string;
  end: string;
}

interface ResultGroup {
  pair: InputPair;
  results: Result[];
}

// +++ LANGKAH 2: UPDATE FUNGSI KALKULASI UNTUK MENGHASILKAN LATEX +++
function calculateIntervals(
  b: number,
  c: number,
  a: number,
  dimension: number,
): Result[] {
  if (isNaN(b) || isNaN(c) || isNaN(a) || isNaN(dimension)) {
    throw new Error("Semua field (b, c, a, dimensi) harus diisi dengan angka.");
  }
  if (a <= 0) throw new Error("Interval (a) harus lebih besar dari 0.");
  if (b === c) return [];
  if (dimension === 0) throw new Error("Dimensi tidak boleh 0!");

  const newResults: Result[] = [];
  const distanceDenominator = Math.abs(c - b);
  const minHeight = Math.min(b, c);
  const maxHeight = Math.max(b, c);
  // Mulai dari kelipatan interval terdekat di bawah nilai minimum
  const startReal = Math.floor(minHeight / a) * a;

  for (let current = startReal + a; current < maxHeight; current += a) {
    if (current <= minHeight) continue;

    const p = current;

    // String formula dalam format LaTeX. Double backslash (\\) diperlukan.
    const formulaStartLatex = `\\frac{${p.toLocaleString("id-ID", { maximumFractionDigits: 2 })} - ${b.toLocaleString("id-ID", { maximumFractionDigits: 2 })}}{${(c - b).toLocaleString("id-ID", { maximumFractionDigits: 2 })} } \\times ${dimension}`;
    const formulaEndLatex = `\\frac{${c.toLocaleString("id-ID", { maximumFractionDigits: 2 })} - ${p.toLocaleString("id-ID", { maximumFractionDigits: 2 })}}{${(c - b).toLocaleString("id-ID", { maximumFractionDigits: 2 })}}\\times ${dimension}`;

    newResults.push({
      p: p.toLocaleString("id-ID", { maximumFractionDigits: 4 }),
      distanceFromStart: (Math.abs(p - b) / distanceDenominator) * dimension,
      formulaFromStart: formulaStartLatex, // Simpan string LaTeX
      distanceFromEnd: (Math.abs(c - p) / distanceDenominator) * dimension,
      formulaFromEnd: formulaEndLatex, // Simpan string LaTeX
    });
  }
  return newResults;
}

// +++ LANGKAH 3: UPDATE KOMPONEN UI UNTUK MERENDER LATEX +++
const ResultCard = ({
  group,
  colorsIndex,
}: {
  group: ResultGroup;
  colorsIndex: number;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between"
      >
        <h3 className="font-semibold">
          Hasil untuk:{" "}
          <span className="text-primary font-mono">
            {group.pair.start || "..."} → {group.pair.end || "..."}
          </span>{" "}
          ({group.results.length} titik)
        </h3>
        <ChevronDown
          className={cn(
            "h-5 w-5 transition-transform",
            !isOpen && "-rotate-90",
          )}
        />
      </button>
      {isOpen && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {group.results.map((item, index) => (
            <div
              key={index}
              className={cn(
                "bg-muted rounded-r-lg border-l-4 p-4",
                softColors[colorsIndex % softColors.length],
              )}
            >
              <p className="font-bold">
                Titik Kontur:{" "}
                <span className="text-primary font-mono">{item.p}</span> m
              </p>
              <hr className="my-2" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Jarak dari titik awal ({group.pair.start}):
                  </p>
                  <p className="text-foreground font-mono text-lg">
                    {item.distanceFromStart.toLocaleString("id-ID", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    cm
                  </p>
                  {/* Tampilkan rumus LaTeX di sini */}
                  <div className="text-muted-foreground mt-1 text-lg">
                    <InlineMath math={item.formulaFromStart} />
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Jarak dari titik akhir ({group.pair.end}):
                  </p>
                  <p className="text-foreground font-mono text-lg">
                    {item.distanceFromEnd.toLocaleString("id-ID", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    cm
                  </p>
                  {/* Tampilkan rumus LaTeX di sini */}
                  <div className="text-muted-foreground mt-1 text-lg">
                    <InlineMath math={item.formulaFromEnd} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function IntervalGeneratorClient() {
  const [isMounted, setIsMounted] = useState(false);

  const [pairs, setPairs] = useState<InputPair[]>([
    { id: 1, start: "", end: "" },
  ]);
  const [intervalNum, setIntervalNum] = useState("2.5");
  const [dimensi, setDimensi] = useState("3");
  const [results, setResults] = useState<ResultGroup[]>([]);
  const [, setError] = useState<string | null>(null);

  const nextId = useRef(2);

  const endInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  useEffect(() => {
    const lastPair = pairs[pairs.length - 1];
    if (lastPair) {
      const lastInput = endInputRefs.current[lastPair.id];
      lastInput?.focus();
    }
  }, [pairs.length]);

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedPairs = localStorage.getItem("intervalGen_pairs");
      if (storedPairs) {
        const parsedPairs = JSON.parse(storedPairs);
        setPairs(parsedPairs);

        const maxId = parsedPairs.reduce(
          (max: number, p: InputPair) => (p.id > max ? p.id : max),
          0,
        );
        nextId.current = maxId + 1;
      }
      const storedInterval = localStorage.getItem("intervalGen_intervalNum");
      if (storedInterval) setIntervalNum(JSON.parse(storedInterval));

      const storedDimensi = localStorage.getItem("intervalGen_dimensi");
      if (storedDimensi) setDimensi(JSON.parse(storedDimensi));

      const storedResults = localStorage.getItem("intervalGen_results");
      if (storedResults) setResults(JSON.parse(storedResults));
    } catch (error) {
      console.error("Failed to parse localStorage data:", error);
      toast.error("Gagal memuat data dari sesi sebelumnya.");
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("intervalGen_pairs", JSON.stringify(pairs));
    localStorage.setItem(
      "intervalGen_intervalNum",
      JSON.stringify(intervalNum),
    );
    localStorage.setItem("intervalGen_dimensi", JSON.stringify(dimensi));
    localStorage.setItem("intervalGen_results", JSON.stringify(results));
  }, [pairs, intervalNum, dimensi, results, isMounted]);

  const handlePairChange = (
    id: number,
    field: "start" | "end",
    value: string,
  ) => {
    setPairs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
    setResults([]);
  };

  const handleAddPair = () => {
    setPairs((prev) => [
      ...prev,
      {
        id: nextId.current++,
        start: prev[prev.length - 1]?.end || "",
        end: "",
      },
    ]);
  };

  const handleRemovePair = (id: number) => {
    if (pairs.length > 1) {
      setPairs((prev) => prev.filter((p) => p.id !== id));
    } else {
      toast.warning("Setidaknya harus ada satu baris input.");
    }
  };

  const handleClearInputs = () => {
    if (pairs.length <= 1 && pairs[0].start === "" && pairs[0].end === "") {
      toast.info("Input sudah kosong.");
      return;
    }
    setPairs([{ id: nextId.current++, start: "", end: "" }]);
    toast.success("Semua baris input telah dibersihkan.");
  };

  const handleGenerate = useCallback(() => {
    try {
      const a = parseFloat(intervalNum);
      const dimension = parseFloat(dimensi);
      const newResultGroups: ResultGroup[] = [];
      let totalPoints = 0;

      for (const pair of pairs) {
        if (!pair.start && !pair.end) continue;
        const b = parseFloat(pair.start);
        const c = parseFloat(pair.end);

        const pairResults = calculateIntervals(b, c, a, dimension);
        newResultGroups.push({ pair, results: pairResults });
        totalPoints += pairResults.length;
      }

      setResults(newResultGroups);

      if (totalPoints > 0) {
        toast.success(`Berhasil menghasilkan ${totalPoints} total titik!`);
      } else {
        toast.info("Tidak ada titik yang ditemukan dari input yang diberikan.");
      }
    } catch (err) {
      setError((err as Error).message);
      toast.error("Oops, terjadi kesalahan!", {
        description: (err as Error).message,
      });
    }
  }, [pairs, intervalNum, dimensi]);

  const handleClearResults = () => {
    setResults([]);
    toast.success("Hasil perhitungan telah dibersihkan.");
  };

  if (!isMounted) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold">
            <Calculator className="text-teal-muted h-7 w-7" />
            Batch Interval Generator
          </CardTitle>
          <CardDescription>
            Hitung beberapa rentang titik kontur sekaligus secara efisien.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pengaturan Global */}
          <div className="bg-muted/50 mb-6 space-y-2 rounded-lg border p-4">
            <h3 className="font-semibold">Pengaturan Global</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="intervalNum" className="mb-2">
                  Interval Kontur (a)
                </Label>
                <Input
                  type="number"
                  id="intervalNum"
                  placeholder="Contoh: 2.5"
                  value={intervalNum}
                  onChange={(e) => {
                    setIntervalNum(e.target.value);
                    setResults([]);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="dimensionNum" className="mb-2">
                  Dimensi Grid (d)
                </Label>
                <Input
                  type="number"
                  id="dimensionNum"
                  placeholder="Contoh: 3 (cm)"
                  value={dimensi}
                  onChange={(e) => {
                    setDimensi(e.target.value);
                    setResults([]);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Input Pairs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Pasangan Titik Awal (b) & Akhir (c)</Label>
              {/* ✨ FITUR BARU 2: Tombol untuk clear semua input */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearInputs}
                className="text-destructive hover:bg-destructive/10 h-auto px-2 py-1"
              >
                <XCircle className="mr-1 h-4 w-4" />
                Bersihkan Semua
              </Button>
            </div>
            {pairs.map((pair) => (
              <div key={pair.id} className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Awal (b)"
                  value={pair.start}
                  onChange={(e) =>
                    handlePairChange(pair.id, "start", e.target.value)
                  }
                />
                <ArrowRight className="text-muted-foreground h-5 w-5 shrink-0" />
                <Input
                  type="number"
                  placeholder="Akhir (c)"
                  value={pair.end}
                  ref={(el) => {
                    endInputRefs.current[pair.id] = el;
                  }}
                  onChange={(e) =>
                    handlePairChange(pair.id, "end", e.target.value)
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePair(pair.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={handleAddPair}
              className="w-full border-dashed"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Baris
            </Button>
          </div>

          <Button
            onClick={handleGenerate}
            className="bg-teal-muted hover:bg-teal-muted/60 mt-3 w-full text-base"
          >
            <span className="flex w-full items-center justify-center gap-1">
              <Rocket className="h-5 w-5" />
              Generate Semua
            </span>
          </Button>

          {results.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Hasil Perhitungan</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearResults}
                  className="text-muted-foreground"
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  Bersihkan
                </Button>
              </div>
              <div className="space-y-4">
                {results.map((group, index) => (
                  <ResultCard
                    key={group.pair.id}
                    group={group}
                    colorsIndex={index}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
