// src/app/kuliah/tools/interval-generator/IntervalGeneratorClient.tsx
"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Rocket } from "lucide-react";

interface Result {
  p: string;
  distance: string;
  formula: string;
}

export default function IntervalGeneratorClient() {
  const [startNum, setStartNum] = useState("");
  const [endNum, setEndNum] = useState("");
  const [intervalNum, setIntervalNum] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  const handleGenerate = useCallback(() => {
    // 1. Reset
    setError(null);
    setResults([]);

    // 2. Parse & Validate
    const b = parseFloat(startNum); // Angka Awal (b)
    const c = parseFloat(endNum);   // Angka Akhir (c)
    const a = parseFloat(intervalNum); // Interval (a)

    if (isNaN(b) || isNaN(c) || isNaN(a)) {
      setError("Semua field (b, c, a) harus diisi dengan angka.");
      return;
    }
    if (a <= 0) {
      setError("Interval (a) harus lebih besar dari 0.");
      return;
    }
    if (b >= c) {
      setError("Angka Awal (b) harus lebih kecil dari Angka Akhir (c).");
      return;
    }
    if (b === a) {
      setError("Angka Awal (b) tidak boleh sama dengan Interval (a) karena menyebabkan pembagi nol.");
      return;
    }

    // 3. Generate points & calculate distance
    const newResults: Result[] = [];
    const distanceDenominator = Math.abs(c - b);
    
    // Logika pembulatan aneh dari kode asli, diterjemahkan langsung
    const startReal = b % 5 !== 0 ? b + ((b % 10 > 5) ? - (b % 5) : 5 - (b % 5)) : b;

    for (let current = startReal + a; current < c; current += a) {
      if (current <= b || current >= c) {
        continue; // Hanya ambil titik di dalam rentang (b, c)
      }

      const p = current;
      const distanceNumerator = p - b;
      const distance = (distanceNumerator / distanceDenominator) * 3;

      newResults.push({
        p: p.toLocaleString('id-ID', { maximumFractionDigits: 4 }),
        distance: distance.toLocaleString('id-ID', { maximumFractionDigits: 8 }),
        formula: `(${(p - b).toFixed(2)}) / (${distanceDenominator.toFixed(2)}) * 3`,
      });
    }

    setResults(newResults);
    if (newResults.length > 0) {
      toast.success(`Berhasil menghasilkan ${newResults.length} titik!`);
    } else {
      toast.info("Tidak ada titik yang ditemukan dalam rentang tersebut.");
    }
  }, [startNum, endNum, intervalNum]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            🚀 Generator Interval & Jarak Khusus
          </CardTitle>
          <CardDescription>
            Hasil $p$ di antara $b$ dan $c$ dengan interval $a$.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="startNum">Angka Awal (b)</Label>
              <Input type="number" id="startNum" placeholder="Contoh: 125" value={startNum} onChange={(e) => setStartNum(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endNum">Angka Akhir (c)</Label>
              <Input type="number" id="endNum" placeholder="Contoh: 129" value={endNum} onChange={(e) => setEndNum(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="intervalNum">Interval (a)</Label>
              <Input type="number" step="any" id="intervalNum" placeholder="Contoh: 2.5" value={intervalNum} onChange={(e) => setIntervalNum(e.target.value)} />
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
              <p className="text-muted-foreground text-xs mb-4">
                Jarak dihitung dengan formula: {`{ (p - b) / (c - b) * 3 }`}
              </p>
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto pr-2">
                {results.map((item, index) => (
                  <div key={index} className="bg-muted border-l-4 border-primary p-4 rounded-r-lg">
                    <p className="font-bold">Titik (p): <span className="font-mono text-primary">{item.p}</span></p>
                    <hr className="my-2 border-border/50" />
                    <p className="text-sm text-muted-foreground">Jarak Khusus:</p>
                    <p className="font-mono text-foreground break-words">{item.distance}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1 break-words">Formula: {item.formula}</p>
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
