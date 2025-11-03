// src/app/kuliah/tools/interval-generator/IntervalGeneratorClient.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Rocket, ArrowRightLeft } from "lucide-react";

// --- 👇 REFACTOR #1: Custom Hook untuk LocalStorage Persistence ---
function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
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
  distanceFromStart: string;
  formulaFromStart: string;
  distanceFromEnd: string;
  formulaFromEnd: string;
}

// --- 👇 REFACTOR #2: Logika Perhitungan Dipisah ke Fungsi Murni ---
function calculateIntervals(b: number, c: number, a: number, dimension: number): Result[] {
  // Validasi di dalam fungsi logika
  if (isNaN(b) || isNaN(c) || isNaN(a) || isNaN(dimension)) {
    throw new Error("Semua field (b, c, a, dimensi) harus diisi dengan angka.");
  }
  if (a <= 0) throw new Error("Interval (a) harus lebih besar dari 0.");
  if (b === c) throw new Error("Ketinggian Awal (b) tidak boleh sama dengan Ketinggian Akhir (c).");
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

    // Jarak dari titik b (bisa positif/negatif tergantung urutan)
    const distanceFromStart = ((p - b) / distanceDenominator) * dimension;
    // Jarak dari titik c
    const distanceFromEnd = ((c - p) / distanceDenominator) * dimension;

    newResults.push({
      p: p.toLocaleString('id-ID', { maximumFractionDigits: 4 }),
      distanceFromStart: distanceFromStart.toLocaleString('id-ID', { maximumFractionDigits: 8 }),
      formulaFromStart: `(${p.toFixed(2)} - ${b.toFixed(2)}) / (${c.toFixed(2)} - ${b.toFixed(2)}) * ${dimension}`,
      distanceFromEnd: distanceFromEnd.toLocaleString('id-ID', { maximumFractionDigits: 8 }),
      formulaFromEnd: `(${c.toFixed(2)} - ${p.toFixed(2)}) / (${c.toFixed(2)} - ${b.toFixed(2)}) * ${dimension}`,
    });
  }
  return newResults;
}


// Komponen Utama
export default function IntervalGeneratorClient() {
  const [startNum, setStartNum] = usePersistentState("intervalGen_startNum", "");
  const [endNum, setEndNum] = usePersistentState("intervalGen_endNum", "");
  const [intervalNum, setIntervalNum] = usePersistentState("intervalGen_intervalNum", "");
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
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            🚀 Generator Interval & Jarak Khusus
          </CardTitle>
          <CardDescription>
            Hasil titik kontur di antara {startNum || 'b'} dan {endNum || 'c'} dengan interval {intervalNum || 'a'} & dimensi {dimensi || 'd'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="startNum">Ketinggian Awal (b)</Label>
                <Input type="number" id="startNum" placeholder="Contoh: 125" value={startNum} onChange={(e) => setStartNum(e.target.value)} />
              </div>
              
              {/* --- 👇 REFACTOR #4: Tombol Swap --- */}
              <Button variant="outline" size="icon" onClick={handleSwap} className="mb-1" aria-label="Tukar nilai b dan c">
                <ArrowRightLeft className="h-4 w-4" />
              </Button>

              <div className="flex-1">
                <Label htmlFor="endNum">Ketinggian Akhir (c)</Label>
                <Input type="number" id="endNum" placeholder="Contoh: 129" value={endNum} onChange={(e) => setEndNum(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="intervalNum">Interval Kontur (a)</Label>
              <Input type="number" step="any" id="intervalNum" placeholder="Contoh: 2.5" value={intervalNum} onChange={(e) => setIntervalNum(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="dimensionNum">Dimensi Peta (d)</Label>
              <Input type="number" step="any" id="dimensionNum" placeholder="Contoh: 3 (cm)" value={dimensi} onChange={(e) => setDimensi(e.target.value)} />
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full mt-6">
            <Rocket className="mr-2 h-4 w-4" />
            Hasilkan Angka & Hitung Jarak
          </Button>

          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

          {results.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h2 className="text-lg font-semibold mb-3">Hasil Titik dan Informasi Jarak:</h2>
              <div className="grid grid-cols-1 gap-4 max-h-[28rem] overflow-y-auto pr-2">
                {results.map((item, index) => (
                  <div key={index} className="bg-muted border-l-4 border-primary p-4 rounded-r-lg">
                    <p className="font-bold">
                      Titik Kontur (p): <span className="font-mono text-primary">{item.p}</span>
                    </p>
                    <hr className="my-2 border-border/50" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Jarak dari Awal (b):</p>
                        <p className="font-mono text-foreground break-words">{item.distanceFromStart}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1 break-words">
                          Formula: {item.formulaFromStart}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Jarak dari Akhir (c):</p>
                        <p className="font-mono text-foreground break-words">{item.distanceFromEnd}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1 break-words">
                          Formula: {item.formulaFromEnd}
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
