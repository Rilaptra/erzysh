// src/components/Tools/KonturTraseJalan/KonturCanvas.tsx
"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/components/ThemeProvider"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { Point, marchingSquares, connectLines } from "@/lib/utils/marching-squares";
import { drawCatmullRom, CELL_SIZE } from "@/lib/utils/drawing";

type KonturCanvasProps = {
  // ... (props remain the same)
  gridSize: { rows: number; cols: number };
  gridData: (number | null)[][];
  roadPath: Point[];
  autoRoadPaths: Point[][];
  contourInterval: number;
  autoRoadWidth: number;
  isDrawing: boolean;
  onCanvasClick: (point: Point) => void;
};

// ✨ PALET WARNA DEDIKASI UNTUK CANVAS ✨
// Warna-warna ini dipilih manual untuk kontras maksimal di kedua tema.
const darkColors = {
  grid: "#334155",      // slate-700
  text: "#e2e8f0",      // slate-200
  point: "#94a3b8",     // slate-400
  contour: "#64748b",   // slate-500
  road: "#ef4444",      // red-500
  roadPoint: "#f97316", // orange-500
};

const lightColors = {
  grid: "#cbd5e1",      // slate-300
  text: "#334155",      // slate-700
  point: "#475569",     // slate-600
  contour: "#94a3b8",   // slate-400
  road: "#ef4444",      // red-500
  roadPoint: "#f97316", // orange-500
};


export function KonturCanvas({
  gridSize,
  gridData,
  roadPath,
  autoRoadPaths,
  contourInterval,
  autoRoadWidth,
  isDrawing,
  onCanvasClick,
}: KonturCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme: resolvedTheme } = useTheme(); // ✨ Dapatkan tema yang aktif (light/dark)

  // ✨ Pilih palet warna berdasarkan tema menggunakan useMemo
  const colors = useMemo(
    () => (resolvedTheme === "dark" ? darkColors : lightColors),
    [resolvedTheme],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    // ❌ Hapus semua logika getComputedStyle. Kita sudah punya object `colors`.

    canvas.width = (gridSize.cols - 1) * CELL_SIZE;
    canvas.height = (gridSize.rows - 1) * CELL_SIZE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Gambar Grid & Titik
    ctx.strokeStyle = colors.grid;
    ctx.fillStyle = colors.text;
    ctx.lineWidth = 1;
    ctx.font = "12px sans-serif";
    for (let i = 0; i < gridSize.rows; i++) {
      for (let j = 0; j < gridSize.cols; j++) {
        const x = j * CELL_SIZE;
        const y = i * CELL_SIZE;
        // ... (logika gambar grid tetap sama)
        if (j < gridSize.cols - 1) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + CELL_SIZE, y);
          ctx.stroke();
        }
        if (i < gridSize.rows - 1) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + CELL_SIZE);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = colors.point;
        ctx.fill();
        const value = gridData[i][j];
        if (value !== null) {
          ctx.fillStyle = colors.text;
          ctx.fillText(value.toString(), x + 8, y - 8);
        }
      }
    }

    // 2. Gambar Garis Kontur
    if (contourInterval > 0) {
      const allValues = gridData.flat().filter((v) => v !== null) as number[];
      if (allValues.length > 0) {
        const minElev = Math.min(...allValues);
        const maxElev = Math.max(...allValues);
        ctx.strokeStyle = colors.contour; // ✨ Gunakan warna dari palet
        ctx.lineWidth = 1.5;
        for (
          let level = Math.ceil(minElev / contourInterval) * contourInterval;
          level <= maxElev;
          level += contourInterval
        ) {
          const lines = marchingSquares(gridData, level);
          const paths = connectLines(lines);
          paths.forEach((path) => drawCatmullRom(ctx, path));
        }
      }
    }
    
    // 3. Gambar Trase Jalan (logika tetap sama, hanya sumber warna yang berubah)
    if (autoRoadPaths.length > 0) {
      ctx.strokeStyle = colors.road;
      ctx.lineWidth = autoRoadWidth;
      // ...
      ctx.lineCap = "round";
      autoRoadPaths.forEach((path) => drawCatmullRom(ctx, path));
      ctx.lineCap = "butt";
    }
    if (roadPath.length > 0) {
      ctx.strokeStyle = colors.road;
      ctx.lineWidth = 3;
      // ...
      ctx.beginPath();
      ctx.moveTo(roadPath[0].x, roadPath[0].y);
      roadPath.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();
      roadPath.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = colors.roadPoint;
        ctx.fill();
      });
    }
  }, [gridSize, gridData, roadPath, autoRoadPaths, contourInterval, autoRoadWidth, colors]); // ✨ Tambahkan `colors` ke dependency array

  useEffect(() => {
    draw();
  }, [draw]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // ... (fungsi ini tidak berubah)
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    onCanvasClick({ x, y });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualisasi Peta</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-card-foreground/5 w-full overflow-auto rounded-md border p-2">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className={cn(
              "transition-cursor m-auto",
              isDrawing ? "cursor-crosshair" : "cursor-default",
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}