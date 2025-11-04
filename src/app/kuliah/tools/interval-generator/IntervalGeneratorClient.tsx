// src/app/kuliah/tools/interval-generator/IntervalGeneratorClient.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Rocket, ArrowRightLeft } from "lucide-react";

// --- 👇 REFACTOR #1: Custom Hook untuk LocalStorage Persistence ---
function usePersistentState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    // Cek hanya di client-side
    if (typeof window === "undefined") {
      return defaultValue;
    }
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    // Cek hanya di client-side
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
}

// Tipe untuk hasil perhitungan
interface Result {
  p: string;
  distanceFromStart: number;
  formulaFromStart: string;
  distanceFromEnd: number;
  formulaFromEnd: string;
}

function selisihKontur(titikA: number, titikB: number) {
  return titikA > titikB
    ? {
        result: titikA - titikB,
        format: `(${titikA.toFixed(2)} - ${titikB.toFixed(2)})`,
      }
    : {
        result: titikB - titikA,
        format: `(${titikB.toFixed(2)} - ${titikA.toFixed(2)})`,
      };
}

// --- 👇 REFACTOR #2: Logika Perhitungan Dipisah ke Fungsi Murni ---
function calculateIntervals(
  b: number,
  c: number,
  a: number,
  dimension: number,
): Result[] {
  // Validasi di dalam fungsi logika
  if (isNaN(b) || isNaN(c) || isNaN(a) || isNaN(dimension)) {
    throw new Error("Semua field (b, c, a, dimensi) harus diisi dengan angka.");
  }
  if (a <= 0) throw new Error("Interval (a) harus lebih besar dari 0.");
  if (b === c)
    throw new Error(
      "Ketinggian Awal (b) tidak boleh sama dengan Ketinggian Akhir (c).",
    );
  if (dimension === 0) throw new Error("Dimensi tidak boleh 0!");

  const newResults: Result[] = [];
  const distanceDenominator = Math.abs(c - b);

  // Menentukan batas bawah dan atas untuk looping
  const minHeight = Math.min(b, c);
  const maxHeight = Math.max(b, c);

  // Pembulatan ke kelipatan 5 terdekat di bawahnya dari nilai terkecil
  const startReal = Math.floor(minHeight / 5) * 5;

  for (let current = startReal + a; current < maxHeight; current += a) {
    if (current <= minHeight) {
      continue;
    }

    const p = current;

    const deltaPB = selisihKontur(p, b);
    const deltaCP = selisihKontur(c, p);

    // Jarak dari titik b (bisa positif/negatif tergantung urutan)
    const distanceFromStart =
      (deltaPB.result / distanceDenominator) * dimension;
    // Jarak dari titik c
    const distanceFromEnd = (deltaCP.result / distanceDenominator) * dimension;

    newResults.push({
      p: p.toLocaleString("id-ID", { maximumFractionDigits: 4 }),
      distanceFromStart: distanceFromStart,
      formulaFromStart: `${deltaPB.format} / (${c.toFixed(2)} - ${b.toFixed(2)}) * ${dimension}`,
      distanceFromEnd: distanceFromEnd,
      formulaFromEnd: `${deltaCP.format} / (${c.toFixed(2)} - ${b.toFixed(2)}) * ${dimension}`,
    });
  }
  return newResults;
}

// Komponen Utama
export default function IntervalGeneratorClient() {
  const [startNum, setStartNum] = usePersistentState(
    "intervalGen_startNum",
    "",
  );
  const [endNum, setEndNum] = usePersistentState("intervalGen_endNum", "");
  const [intervalNum, setIntervalNum] = usePersistentState(
    "intervalGen_intervalNum",
    "",
  );
  const [dimensi, setDimensi] = usePersistentState("intervalGen_dimensi", "");

  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  // --- 👇 REFACTOR #3: UX Improvement - Auto clear results on input change ---
  useEffect(() => {
    setError(null);
    setResults([]);
  }, [startNum, endNum, intervalNum, dimensi]);

  const handleGenerate = useCallback(() => {
    try {
      const b = parseFloat(startNum);
      const c = parseFloat(endNum);
      const a = parseFloat(intervalNum);
      const dimension = parseFloat(dimensi);

      const newResults = calculateIntervals(b, c, a, dimension);
      setResults(newResults);

      if (newResults.length > 0) {
        toast.success(`Berhasil menghasilkan ${newResults.length} titik!`);
      } else {
        toast.info("Tidak ada titik yang ditemukan dalam rentang tersebut.");
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }, [startNum, endNum, intervalNum, dimensi]);

  const handleSwap = () => {
    setStartNum(endNum);
    setEndNum(startNum);
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            🚀 Generator Interval & Jarak Khusus
          </CardTitle>
          <CardDescription>
            Hasil titik kontur di antara {startNum || "b"} dan {endNum || "c"}{" "}
            dengan interval {intervalNum || "a"} & dimensi {dimensi || "d"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="startNum">Ketinggian Awal</Label>
                <Input
                  type="number"
                  id="startNum"
                  placeholder="Contoh: 125"
                  value={startNum}
                  onChange={(e) => setStartNum(e.target.value)}
                />
              </div>

              {/* --- 👇 REFACTOR #4: Tombol Swap --- */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                className="mb-1"
                aria-label="Tukar nilai b dan c"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>

              <div className="flex-1">
                <Label htmlFor="endNum">Ketinggian Akhir</Label>
                <Input
                  type="number"
                  id="endNum"
                  placeholder="Contoh: 129"
                  value={endNum}
                  onChange={(e) => setEndNum(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="intervalNum">Interval Kontur</Label>
              <Input
                type="number"
                step="any"
                id="intervalNum"
                placeholder="Contoh: 2.5"
                value={intervalNum}
                onChange={(e) => setIntervalNum(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dimensionNum">Dimensi Kotak Grid</Label>
              <Input
                type="number"
                step="any"
                id="dimensionNum"
                placeholder="Contoh: 3 (cm)"
                value={dimensi}
                onChange={(e) => setDimensi(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleGenerate} className="mt-6 w-full">
            <Rocket className="mr-2 h-4 w-4" />
            Hasilkan Angka & Hitung Jarak
          </Button>

          {error && (
            <p className="mt-4 text-center text-sm text-red-500">{error}</p>
          )}

          {results.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h2 className="mb-3 text-lg font-semibold">
                Hasil Titik dan Informasi Jarak:
              </h2>
              <div className="grid grid-cols-1 gap-4 pr-2">
                {results.map((item, index) => (
                  <div
                    key={index}
                    className="bg-muted border-primary rounded-r-lg border-l-4 p-4"
                  >
                    <p className="font-bold">
                      Titik Kontur:{" "}
                      <span className="text-primary font-mono">{item.p}</span>
                    </p>
                    <hr className="border-border/50 my-2" />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Jarak dari {startNum} ke {endNum}:
                        </p>
                        <p className="text-foreground font-mono wrap-break-word">
                          {item.distanceFromStart.toLocaleString("id-ID", {
                            maximumFractionDigits: 4,
                          })}
                          {" ≈ "}
                          {item.distanceFromStart.toLocaleString("id-ID", {
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-muted-foreground/70 mt-1 text-xs wrap-break-word">
                          Rumus: {item.formulaFromStart}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Jarak dari {endNum} ke {startNum}:
                        </p>
                        <p className="text-foreground font-mono wrap-break-word">
                          {item.distanceFromEnd.toLocaleString("id-ID", {
                            maximumFractionDigits: 4,
                          })}
                          {` ≈ ${item.distanceFromEnd.toLocaleString("id-ID", {
                            maximumFractionDigits: 2,
                          })}`}
                        </p>
                        <p className="text-muted-foreground/70 mt-1 text-xs wrap-break-word">
                          Rumus: {item.formulaFromEnd}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
