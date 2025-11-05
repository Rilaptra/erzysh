"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Minus,
  Map,
  Trash2,
  Undo,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  marchingSquares,
  connectLines,
  Point,
} from "@/lib/utils/marching-squares";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/cn";

const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 20;
const CELL_SIZE = 80;

type ThemeColors = {
  grid: string;
  text: string;
  point: string;
  road: string;
  roadPoint: string;
  contour: string;
};

// --- ✨ FUNGSI BARU UNTUK GAMBAR KURVA CATMULL-ROM ---
function drawCatmullRom(ctx: CanvasRenderingContext2D, points: Point[], tension = 0.5) {
  if (points.length < 2) return;

  // Ubah point dari grid-space ke canvas-space
  const pts = points.map(p => ({ x: p.x * CELL_SIZE, y: p.y * CELL_SIZE }));

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  if (points.length === 2) {
    // Jika hanya 2 titik, gambar garis lurus saja
    ctx.lineTo(pts[1].x, pts[1].y);
  } else {
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i === 0 ? pts[i] : pts[i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i === pts.length - 2 ? pts[i + 1] : pts[i + 2];

      // Rumus Catmull-Rom untuk mendapatkan titik kontrol Bézier
      const cp1x = p1.x + ((p2.x - p0.x) / 6) * (1 - tension) * 2;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * (1 - tension) * 2;
      
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * (1 - tension) * 2;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * (1 - tension) * 2;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }
  
  ctx.stroke();
}


export default function KonturTraseClient() {
  const [gridSize, setGridSize] = useState({ rows: 7, cols: 10 });
  const [gridData, setGridData] = useState<(number | null)[][]>(() =>
    Array(7)
      .fill(null)
      .map(() => Array(10).fill(null)),
  );
  const [contourInterval, setContourInterval] = useState(5);
  const [roadPath, setRoadPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // State baru untuk trase otomatis
  const [autoRoadElevation, setAutoRoadElevation] = useState<number | null>(
    null,
  );
  const [autoRoadWidth, setAutoRoadWidth] = useState(5); // dalam 'meter' virtual
  const [autoRoadPaths, setAutoRoadPaths] = useState<Point[][]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const [themeColors, setThemeColors] = useState<ThemeColors | null>(null);

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    setThemeColors({
      grid: root.getPropertyValue("--color-border").trim() || "#334155",
      text: root.getPropertyValue("--color-foreground").trim() || "#e2e8f0",
      point:
        root.getPropertyValue("--color-muted-foreground").trim() || "#94a3b8",
      road: "#ef4444",
      roadPoint: "#f97316",
      contour: root.getPropertyValue("--color-primary").trim() || "#f1f5f9",
    });
  }, [theme]);

  const handleGridDataChange = (row: number, col: number, value: string) => {
    const newGridData = gridData.map((r, i) =>
      i === row
        ? r.map((c, j) =>
            j === col ? (value === "" ? null : parseFloat(value)) : c,
          )
        : r,
    );
    setGridData(newGridData);
  };

  const adjustGrid = (type: "row" | "col", amount: 1 | -1) => {
    const newSize = { ...gridSize };
    const key = type === "row" ? "rows" : "cols";
    newSize[key] += amount;

    if (newSize[key] < MIN_GRID_SIZE || newSize[key] > MAX_GRID_SIZE) {
      toast.warning(
        `Ukuran grid maksimal ${MAX_GRID_SIZE}x${MAX_GRID_SIZE} dan minimal ${MIN_GRID_SIZE}x${MIN_GRID_SIZE}.`,
      );
      return;
    }

    setGridSize(newSize);
    const newGridData = Array(newSize.rows)
      .fill(null)
      .map((_, r) =>
        Array(newSize.cols)
          .fill(null)
          .map((_, c) => gridData[r]?.[c] ?? null),
      );
    setGridData(newGridData);
  };

  const clearAllPoints = () => {
    setGridData(
      Array(gridSize.rows)
        .fill(null)
        .map(() => Array(gridSize.cols).fill(null)),
    );
    toast.success("Semua titik elevasi telah dihapus.");
  };

  const clearRoad = () => {
    setRoadPath([]);
    setAutoRoadPaths([]);
    setAutoRoadElevation(null);
    toast.success("Trase jalan telah dihapus.");
  };

  const undoLastRoadPoint = () => {
    setRoadPath((prev) => prev.slice(0, -1));
  };

  const handleGenerateAutoRoad = () => {
    if (autoRoadElevation === null) {
      toast.error("Masukkan nilai Ketinggian Jalan terlebih dahulu.");
      return;
    }
    setRoadPath([]); // Hapus trase manual
    const roadLines = marchingSquares(gridData, autoRoadElevation);
    const connectedPaths = connectLines(roadLines);
    setAutoRoadPaths(connectedPaths);
    toast.success(
      `Trase jalan otomatis untuk elevasi ${autoRoadElevation}m berhasil dibuat!`,
    );
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !themeColors) return;

    canvas.width = (gridSize.cols - 1) * CELL_SIZE;
    canvas.height = (gridSize.rows - 1) * CELL_SIZE;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Gambar Grid & Titik
    ctx.strokeStyle = themeColors.grid;
    ctx.fillStyle = themeColors.text;
    ctx.lineWidth = 1;
    ctx.font = "12px sans-serif";
    for (let i = 0; i < gridSize.rows; i++) {
      for (let j = 0; j < gridSize.cols; j++) {
        const x = j * CELL_SIZE;
        const y = i * CELL_SIZE;
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
        ctx.fillStyle = themeColors.point;
        ctx.fill();
        const value = gridData[i][j];
        if (value !== null) {
          ctx.fillStyle = themeColors.text;
          ctx.fillText(value.toString(), x + 8, y - 8);
        }
      }
    }

    // 2. Gambar Garis Kontur (melengkung)
    if (contourInterval > 0) {
      const allValues = gridData.flat().filter((v) => v !== null) as number[];
      if (allValues.length > 0) {
        const minElev = Math.min(...allValues);
        const maxElev = Math.max(...allValues);

        ctx.strokeStyle = themeColors.contour;
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

    // 3. Gambar Trase Jalan (Otomatis)
    if (autoRoadPaths.length > 0) {
      ctx.strokeStyle = themeColors.road;
      ctx.lineWidth = autoRoadWidth; // Gunakan lebar dari input
      ctx.lineCap = "round";
      autoRoadPaths.forEach((path) => drawCatmullRom(ctx, path));
      ctx.lineCap = "butt"; // Reset
    }

    // 4. Gambar Trase Jalan (Manual)
    if (roadPath.length > 0) {
      ctx.strokeStyle = themeColors.road;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(roadPath[0].x, roadPath[0].y);
      roadPath.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();

      roadPath.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = themeColors.roadPoint;
        ctx.fill();
      });
    }
  }, [
    gridSize,
    gridData,
    contourInterval,
    roadPath,
    autoRoadPaths,
    autoRoadWidth,
    themeColors,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setAutoRoadPaths([]); // Hapus trase otomatis saat menggambar manual
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setRoadPath((prev) => [...prev, { x, y }]);
  };

  const inputGrid = useMemo(
    () => (
      <div className="overflow-auto p-1">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridSize.cols}, minmax(70px, 1fr))`,
            gap: "8px",
          }}
        >
          {gridData.map((row, i) =>
            row.map((cell, j) => (
              <Input
                key={`${i}-${j}`}
                type="number"
                value={cell === null ? "" : cell}
                onChange={(e) => handleGridDataChange(i, j, e.target.value)}
                className="h-10 w-full text-center font-mono"
                placeholder="Elev."
              />
            )),
          )}
        </div>
      </div>
    ),
    [gridSize, gridData],
  );

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-bold">
          <Map className="text-primary" />
          Visualisasi Kontur & Trase Jalan
        </h1>
        <p className="text-muted-foreground mt-2">
          Input data ketinggian, atur parameter, dan gambar trase jalan untuk
          visualisasi real-time.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>1. Atur Grid & Elevasi</CardTitle>
              <CardDescription>
                Tentukan ukuran grid dan isi nilai elevasi pada setiap titik.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ukuran Grid</Label>
                <div className="flex items-center gap-2">
                  <span>
                    {gridSize.rows} x {gridSize.cols}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => adjustGrid("row", 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => adjustGrid("row", -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => adjustGrid("col", 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => adjustGrid("col", -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {inputGrid}
              <Button
                variant="destructive"
                className="w-full"
                onClick={clearAllPoints}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Hapus Semua Elevasi
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>2. Atur Visualisasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="interval">Interval Kontur (meter)</Label>
                <Input
                  id="interval"
                  type="number"
                  value={contourInterval}
                  onChange={(e) =>
                    setContourInterval(parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <Label className="flex items-center gap-2 font-semibold">
                  <Sparkles className="text-primary h-4 w-4" />
                  Trase Jalan Otomatis
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="road-elev">Ketinggian (m)</Label>
                    <Input
                      id="road-elev"
                      type="number"
                      placeholder="e.g., 145"
                      onChange={(e) =>
                        setAutoRoadElevation(
                          e.target.value === ""
                            ? null
                            : parseFloat(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="road-width">Lebar (px)</Label>
                    <Input
                      id="road-width"
                      type="number"
                      value={autoRoadWidth}
                      onChange={(e) =>
                        setAutoRoadWidth(parseFloat(e.target.value) || 1)
                      }
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleGenerateAutoRoad}>
                  Generate Trase
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Gambar Trase Jalan Manual</Label>
                <div className="flex flex-nowrap gap-2">
                  <Button
                    className="w-fit"
                    variant={isDrawing ? "default" : "outline"}
                    onClick={() => setIsDrawing(!isDrawing)}
                  >
                    <span className="flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4" />{" "}
                      {isDrawing
                        ? "Mode Gambar: Aktif"
                        : "Mode Gambar: Nonaktif"}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={undoLastRoadPoint}
                    disabled={roadPath.length === 0}
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={clearRoad}
                disabled={roadPath.length === 0 && autoRoadPaths.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Hapus Trase Jalan
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
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
        </div>
      </div>
    </main>
  );
}
