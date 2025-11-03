// src/app/kuliah/tools/interval-generator/IntervalGeneratorClient.tsx
"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Rocket, MoveHorizontal } from "lucide-react"; // <-- Tambah ikon baru

// --- 👇 PERBAIKAN #1: Interface Result di-update ---
interface Result {
  p: string;
  distanceFromStart: string;
  formulaFromStart: string;
  distanceFromEnd: string;
  formulaFromEnd: string;
}

export default function IntervalGeneratorClient() {
  const [startNum, setStartNum] = useState("");
  const [endNum, setEndNum] = useState("");
  const [intervalNum, setIntervalNum] = useState("");
  const [dimensi, setDimensi] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  const handleGenerate = useCallback(() => {
    // Reset
    setError(null);
    setResults([]);

    // Parse & Validate
    const b = parseFloat(startNum);
    const c = parseFloat(endNum);
    const a = parseFloat(intervalNum);
    const dimension = parseFloat(dimensi);

    if (isNaN(b) || isNaN(c) || isNaN(a) || isNaN(dimension)) {
      setError("Semua field (b, c, a, dimensi) harus diisi dengan angka.");
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
    if (dimension === 0) {
      setError("Dimensi tidak boleh 0!");
      return;
    }

    // Generate points & calculate distances
    const newResults: Result[] = [];
    const distanceDenominator = Math.abs(c - b);
    
    const startReal = Math.floor(b / 5) * 5;

    for (let current = startReal + a; current < c; current += a) {
      if (current <= b) {
        continue;
      }

      const p = current;

      // --- 👇 PERBAIKAN #2: Hitung kedua jarak ---
      // Jarak dari titik awal (b)
      const distanceNumeratorFromStart = p - b;
      const distanceFromStart = (distanceNumeratorFromStart / distanceDenominator) * dimension;

      // Jarak dari titik akhir (c)
      const distanceNumeratorFromEnd = c - p;
      const distanceFromEnd = (distanceNumeratorFromEnd / distanceDenominator) * dimension;

      newResults.push({
        p: p.toLocaleString('id-ID', { maximumFractionDigits: 4 }),
        distanceFromStart: distanceFromStart.toLocaleString('id-ID', { maximumFractionDigits: 8 }),
        formulaFromStart: `(${p.toFixed(2)} - ${b.toFixed(2)}) / (${c.toFixed(2)} - ${b.toFixed(2)}) * ${dimension}`,
        distanceFromEnd: distanceFromEnd.toLocaleString('id-ID', { maximumFractionDigits: 8 }),
        formulaFromEnd: `(${c.toFixed(2)} - ${p.toFixed(2)}) / (${c.toFixed(2)} - ${b.toFixed(2)}) * ${dimension}`,
      });
    }

    setResults(newResults);
    if (newResults.length > 0) {
      toast.success(`Berhasil menghasilkan ${newResults.length} titik!`);
    } else {
      toast.info("Tidak ada titik yang ditemukan dalam rentang tersebut.");
    }
  }, [startNum, endNum, intervalNum, dimensi]);

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
            <div>
              <Label htmlFor="startNum">Ketinggian Awal (b)</Label>
              <Input type="number" id="startNum" placeholder="Contoh: 125" value={startNum} onChange={(e) => setStartNum(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endNum">Ketinggian Akhir (c)</Label>
              <Input type="number" id="endNum" placeholder="Contoh: 129" value={endNum} onChange={(e) => setEndNum(e.target.value)} />
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
              <p className="text-muted-foreground text-xs mb-4">
                Jarak dihitung dengan interpolasi linear terhadap dimensi peta (d).
              </p>
              <div className="grid grid-cols-1 gap-4 max-h-[28rem] overflow-y-auto pr-2">
                {results.map((item, index) => (
                  // --- 👇 PERBAIKAN #3: Tampilan Kartu Hasil di-update ---
                  <div key={index} className="bg-muted border-l-4 border-primary p-4 rounded-r-lg">
                    <p className="font-bold">
                      Titik Kontur (p): <span className="font-mono text-primary">{item.p}</span>
                    </p>
                    <hr className="my-2 border-border/50" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Jarak dari Titik Awal */}
                      <div>
                        <p className="text-sm text-muted-foreground">Jarak dari Awal (b):</p>
                        <p className="font-mono text-foreground break-words">{item.distanceFromStart}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1 break-words">
                          Formula: {item.formulaFromStart}
                        </p>
                      </div>
                      {/* Jarak dari Titik Akhir */}
                      <div>
                        <p className="text-sm text-muted-foreground">Jarak dari Akhir (c):</p>
                        <p className="font-mono text-foreground break-words">{item.distanceFromEnd}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1 break-words">
                          Formula: {item.formulaFromEnd}
                        </p>
                      </div>
                    </div>
                    {/* Total Dimensi */}
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
                      <span>Jarak dari Awal</span>
                      <MoveHorizontal className="h-4 w-4" />
                      <span>Jarak dari Akhir = {dimensi}</span>
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
