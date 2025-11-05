"use client";

import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // ✨ Impor Accordion
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
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import {
  marchingSquares,
  connectLines,
  Point,
} from "@/lib/utils/marching-squares";
import { useTheme } from "@/components/ThemeProvider";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { cn } from "@/lib/cn";
import { softColors } from "@/lib/utils.client"; // ✨ Impor Palet Warna

// --- KONSTANTA & TIPE DATA ---
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
interface InterpolationPoint {
  from: [number, number];
  to: [number, number];
  elev1: number;
  elev2: number;
  contourLevel: number;
  distance: number;
  orientation: "Horizontal" | "Vertikal";
}

// --- FUNGSI HELPER ---
function drawCatmullRom(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  tension = 0.5,
) {
  if (points.length < 2) return;
  const pts = points.map((p) => ({ x: p.x * CELL_SIZE, y: p.y * CELL_SIZE }));
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  if (points.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
  } else {
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i === 0 ? pts[i] : pts[i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i === pts.length - 2 ? pts[i + 1] : pts[i + 2];
      const cp1x = p1.x + ((p2.x - p0.x) / 6) * (1 - tension) * 2;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * (1 - tension) * 2;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * (1 - tension) * 2;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * (1 - tension) * 2;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }
  ctx.stroke();
}

// --- KOMPONEN UTAMA ---
export default function KonturTraseClient() {
  const [project, setProject] = useLocalStorageState("konturProject", {
    gridSize: { rows: 7, cols: 10 },
    gridData: Array(7)
      .fill(null)
      .map(() => Array(10).fill(null)) as (number | null)[][],
    roadPath: [] as Point[],
  });

  const [settings, setSettings] = useLocalStorageState("konturSettings", {
    contourInterval: 5,
    gridDimension: 10,
    isDrawing: false,
    autoRoadElevation: null as number | null,
    autoRoadWidth: 5,
  });

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

  // --- LOGIKA KALKULASI & RENDER ---

  const handleGridDataChange = (row: number, col: number, value: string) => {
    const newGridData = project.gridData.map((r, i) =>
      i === row
        ? r.map((c, j) =>
            j === col ? (value === "" ? null : parseFloat(value)) : c,
          )
        : r,
    );
    setProject((prev) => ({ ...prev, gridData: newGridData }));
  };

  const adjustGrid = (type: "row" | "col", amount: 1 | -1) => {
    setProject((prev) => {
      const newSize = { ...prev.gridSize };
      const key = type === "row" ? "rows" : "cols";
      newSize[key] += amount;

      if (newSize[key] < MIN_GRID_SIZE || newSize[key] > MAX_GRID_SIZE) {
        toast.warning(
          `Ukuran grid maksimal ${MAX_GRID_SIZE}x${MAX_GRID_SIZE} dan minimal ${MIN_GRID_SIZE}x${MIN_GRID_SIZE}.`,
        );
        return prev;
      }

      const newGridData = Array(newSize.rows)
        .fill(null)
        .map((_, r) =>
          Array(newSize.cols)
            .fill(null)
            .map((_, c) => prev.gridData[r]?.[c] ?? null),
        );

      return { ...prev, gridSize: newSize, gridData: newGridData };
    });
  };

  const clearAllPoints = () => {
    setProject((prev) => ({
      ...prev,
      gridData: Array(prev.gridSize.rows)
        .fill(null)
        .map(() => Array(prev.gridSize.cols).fill(null)),
    }));
    toast.success("Semua titik elevasi telah dihapus.");
  };

  const clearRoad = () => {
    setProject((prev) => ({ ...prev, roadPath: [] }));
    setAutoRoadPaths([]);
    setSettings((prev) => ({ ...prev, autoRoadElevation: null }));
    toast.success("Trase jalan telah dihapus.");
  };

  const undoLastRoadPoint = () =>
    setProject((prev) => ({ ...prev, roadPath: prev.roadPath.slice(0, -1) }));

  const handleGenerateAutoRoad = () => {
    if (settings.autoRoadElevation === null) {
      toast.error("Masukkan nilai Ketinggian Jalan terlebih dahulu.");
      return;
    }
    setProject((prev) => ({ ...prev, roadPath: [] }));
    const roadLines = marchingSquares(
      project.gridData,
      settings.autoRoadElevation,
    );
    const connectedPaths = connectLines(roadLines);
    setAutoRoadPaths(connectedPaths);
    toast.success(
      `Trase jalan otomatis untuk elevasi ${settings.autoRoadElevation}m berhasil dibuat!`,
    );
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !themeColors) return;

    canvas.width = (project.gridSize.cols - 1) * CELL_SIZE;
    canvas.height = (project.gridSize.rows - 1) * CELL_SIZE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Gambar Grid & Titik
    ctx.strokeStyle = themeColors.grid;
    ctx.fillStyle = themeColors.text;
    ctx.lineWidth = 1;
    ctx.font = "12px sans-serif";
    for (let i = 0; i < project.gridSize.rows; i++) {
      for (let j = 0; j < project.gridSize.cols; j++) {
        const x = j * CELL_SIZE;
        const y = i * CELL_SIZE;
        if (j < project.gridSize.cols - 1) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + CELL_SIZE, y);
          ctx.stroke();
        }
        if (i < project.gridSize.rows - 1) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + CELL_SIZE);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = themeColors.point;
        ctx.fill();
        const value = project.gridData[i][j];
        if (value !== null) {
          ctx.fillStyle = themeColors.text;
          ctx.fillText(value.toString(), x + 8, y - 8);
        }
      }
    }

    // 2. Gambar Garis Kontur
    if (settings.contourInterval > 0) {
      const allValues = project.gridData
        .flat()
        .filter((v) => v !== null) as number[];
      if (allValues.length > 0) {
        const minElev = Math.min(...allValues);
        const maxElev = Math.max(...allValues);
        ctx.strokeStyle = themeColors.contour;
        ctx.lineWidth = 1.5;
        for (
          let level =
            Math.ceil(minElev / settings.contourInterval) *
            settings.contourInterval;
          level <= maxElev;
          level += settings.contourInterval
        ) {
          const lines = marchingSquares(project.gridData, level);
          const paths = connectLines(lines);
          paths.forEach((path) => drawCatmullRom(ctx, path));
        }
      }
    }

    // 3. Gambar Trase Jalan (Otomatis & Manual)
    if (autoRoadPaths.length > 0) {
      ctx.strokeStyle = themeColors.road;
      ctx.lineWidth = settings.autoRoadWidth;
      ctx.lineCap = "round";
      autoRoadPaths.forEach((path) => drawCatmullRom(ctx, path));
      ctx.lineCap = "butt";
    }
    if (project.roadPath.length > 0) {
      ctx.strokeStyle = themeColors.road;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(project.roadPath[0].x, project.roadPath[0].y);
      project.roadPath.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();
      project.roadPath.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = themeColors.roadPoint;
        ctx.fill();
      });
    }
  }, [project, settings, autoRoadPaths, themeColors]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setAutoRoadPaths([]);
    if (!settings.isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setProject((prev) => ({ ...prev, roadPath: [...prev.roadPath, { x, y }] }));
  };

  const interpolationResults = useMemo(() => {
    const results: InterpolationPoint[] = [];
    if (settings.contourInterval <= 0 || settings.gridDimension <= 0)
      return results;
    const { gridData, gridSize } = project;
    for (let i = 0; i < gridSize.rows; i++) {
      for (let j = 0; j < gridSize.cols; j++) {
        // Horizontal check
        if (j < gridSize.cols - 1) {
          const [e1, e2] = [gridData[i][j], gridData[i][j + 1]];
          if (e1 !== null && e2 !== null && e1 !== e2) {
            for (
              let lvl =
                Math.ceil(Math.min(e1, e2) / settings.contourInterval) *
                settings.contourInterval;
              lvl < Math.max(e1, e2);
              lvl += settings.contourInterval
            ) {
              if (lvl === e1 || lvl === e2) continue;
              results.push({
                from: [i, j],
                to: [i, j + 1],
                elev1: e1,
                elev2: e2,
                contourLevel: lvl,
                distance:
                  (Math.abs(lvl - e1) / Math.abs(e2 - e1)) *
                  settings.gridDimension,
                orientation: "Horizontal",
              });
            }
          }
        }
        // Vertical check
        if (i < gridSize.rows - 1) {
          const [e1, e2] = [gridData[i][j], gridData[i + 1][j]];
          if (e1 !== null && e2 !== null && e1 !== e2) {
            for (
              let lvl =
                Math.ceil(Math.min(e1, e2) / settings.contourInterval) *
                settings.contourInterval;
              lvl < Math.max(e1, e2);
              lvl += settings.contourInterval
            ) {
              if (lvl === e1 || lvl === e2) continue;
              results.push({
                from: [i, j],
                to: [i + 1, j],
                elev1: e1,
                elev2: e2,
                contourLevel: lvl,
                distance:
                  (Math.abs(lvl - e1) / Math.abs(e2 - e1)) *
                  settings.gridDimension,
                orientation: "Vertikal",
              });
            }
          }
        }
      }
    }
    return results;
  }, [
    project.gridData,
    project.gridSize,
    settings.contourInterval,
    settings.gridDimension,
  ]);

  const groupedInterpolationResults = useMemo(() => {
    return interpolationResults.reduce(
      (acc, point) => {
        const key = `${point.from.join(",")}_${point.to.join(",")}`;
        const group =
          point.orientation === "Vertikal" ? acc.vertical : acc.horizontal;

        if (!group[key]) {
          group[key] = {
            elev1: point.elev1,
            elev2: point.elev2,
            points: [],
          };
        }
        group[key].points.push({
          contourLevel: point.contourLevel,
          distance: point.distance,
        });
        // Sort points by contour level
        group[key].points.sort((a, b) => a.contourLevel - b.contourLevel);
        return acc;
      },
      {
        vertical: {} as Record<
          string,
          {
            elev1: number;
            elev2: number;
            points: { contourLevel: number; distance: number }[];
          }
        >,
        horizontal: {} as Record<
          string,
          {
            elev1: number;
            elev2: number;
            points: { contourLevel: number; distance: number }[];
          }
        >,
      },
    );
  }, [interpolationResults]);

  const inputGrid = useMemo(
    () => (
      <div className="overflow-auto p-1">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${project.gridSize.cols}, minmax(70px, 1fr))`,
            gap: "8px",
          }}
        >
          {project.gridData.map((row, i) =>
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
    [project.gridSize.cols, project.gridData],
  );

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      {/* ... bagian header, grid, dan visualisasi ... (tidak ada perubahan di sini) */}
      <header className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-bold">
          <Map className="text-primary" /> Visualisasi Kontur & Trase Jalan
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ukuran Grid</Label>
                <div className="flex items-center gap-2">
                  <span>
                    {project.gridSize.rows} x {project.gridSize.cols}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interval">Interval Kontur (m)</Label>
                  <Input
                    id="interval"
                    type="number"
                    value={settings.contourInterval}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        contourInterval: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="dimension">Dimensi Grid (cm)</Label>
                  <Input
                    id="dimension"
                    type="number"
                    value={settings.gridDimension}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        gridDimension: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
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
                      value={settings.autoRoadElevation ?? ""}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          autoRoadElevation:
                            e.target.value === ""
                              ? null
                              : parseFloat(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="road-width">Lebar (px)</Label>
                    <Input
                      id="road-width"
                      type="number"
                      value={settings.autoRoadWidth}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          autoRoadWidth: parseFloat(e.target.value) || 1,
                        }))
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
                <div className="flex items-center gap-2">
                  <Button
                    className="grow"
                    variant={settings.isDrawing ? "default" : "outline"}
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        isDrawing: !prev.isDrawing,
                      }))
                    }
                  >
                    <MousePointerClick className="mr-2 h-4 w-4" />{" "}
                    {settings.isDrawing
                      ? "Mode Gambar: Aktif"
                      : "Mode Gambar: Nonaktif"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={undoLastRoadPoint}
                    disabled={project.roadPath.length === 0}
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={clearRoad}
                disabled={
                  project.roadPath.length === 0 && autoRoadPaths.length === 0
                }
              >
                <Trash2 className="mr-2 h-4 w-4" /> Hapus Trase Jalan
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-8 lg:col-span-3">
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
                    settings.isDrawing ? "cursor-crosshair" : "cursor-default",
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- 🎨 BLOK PERHITUNGAN DENGAN FITUR COLLAPSE & WARNA --- */}
        <div className="space-y-6 lg:col-span-3">
          {interpolationResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="text-primary h-5 w-5" />
                  Detail Titik Interval Kontur per Segmen
                </CardTitle>
                <CardDescription>
                  Klik untuk melihat detail jarak titik potong kontur pada
                  setiap segmen grid.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion
                  type="multiple"
                  className="w-full space-y-4"
                  defaultValue={["segmen-vertikal"]}
                >
                  {/* --- ACCORDION UNTUK SEGMEN VERTIKAL --- */}
                  <AccordionItem value="segmen-vertikal">
                    <AccordionTrigger className="text-lg font-semibold">
                      ⇕ Segmen Vertikal
                    </AccordionTrigger>
                    <AccordionContent>
                      <Accordion type="multiple" className="space-y-2">
                        {Object.values(
                          groupedInterpolationResults.vertical,
                        ).map((segment, idx) => (
                          <AccordionItem
                            key={`v-seg-${idx}`}
                            value={`v-seg-${idx}`}
                            className={cn(
                              "bg-background/30 rounded-md border-l-4 px-4",
                              softColors[idx % softColors.length],
                            )}
                          >
                            <AccordionTrigger className="font-mono text-sm font-medium no-underline hover:no-underline">
                              {`${segment.elev1.toFixed(2)} m → ${segment.elev2.toFixed(2)} m`}
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              <div className="overflow-hidden rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Titik Kontur</TableHead>
                                      <TableHead className="text-right">
                                        Jarak dari Awal (cm)
                                      </TableHead>
                                      <TableHead className="text-right">
                                        Jarak dari Akhir (cm)
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {segment.points.map((p) => {
                                      const distA = p.distance;
                                      const distB =
                                        settings.gridDimension - p.distance;
                                      return (
                                        <TableRow key={p.contourLevel}>
                                          <TableCell className="font-mono">
                                            {p.contourLevel.toFixed(2)} m
                                          </TableCell>
                                          <TableCell
                                            className="text-right font-mono"
                                            dangerouslySetInnerHTML={{
                                              __html: `${distA.toFixed(4)}&nbsp;&asymp;&nbsp;${distA.toFixed(1)}`,
                                            }}
                                          />
                                          <TableCell
                                            className="text-right font-mono"
                                            dangerouslySetInnerHTML={{
                                              __html: `${distB.toFixed(4)}&nbsp;&asymp;&nbsp;${distB.toFixed(1)}`,
                                            }}
                                          />
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>

                  {/* --- ACCORDION UNTUK SEGMEN HORIZONTAL --- */}
                  <AccordionItem value="segmen-horizontal">
                    <AccordionTrigger className="text-lg font-semibold">
                      ⇔ Segmen Horizontal
                    </AccordionTrigger>
                    <AccordionContent>
                      <Accordion type="multiple" className="space-y-2">
                        {Object.values(
                          groupedInterpolationResults.horizontal,
                        ).map((segment, idx) => (
                          <AccordionItem
                            key={`h-seg-${idx}`}
                            value={`h-seg-${idx}`}
                            className={cn(
                              "bg-background/30 rounded-md border-l-4 px-4",
                              softColors[(idx + 2) % softColors.length], // Offset warna biar beda
                            )}
                          >
                            <AccordionTrigger className="font-mono text-sm font-medium no-underline hover:no-underline">
                              {`${segment.elev1.toFixed(2)} m → ${segment.elev2.toFixed(2)} m`}
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              <div className="overflow-hidden rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Titik Kontur</TableHead>
                                      <TableHead className="text-right">
                                        Jarak dari Awal (cm)
                                      </TableHead>
                                      <TableHead className="text-right">
                                        Jarak dari Akhir (cm)
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {segment.points.map((p) => {
                                      const distA = p.distance;
                                      const distB =
                                        settings.gridDimension - p.distance;
                                      return (
                                        <TableRow key={p.contourLevel}>
                                          <TableCell className="font-mono">
                                            {p.contourLevel.toFixed(2)} m
                                          </TableCell>
                                          <TableCell
                                            className="text-right font-mono"
                                            dangerouslySetInnerHTML={{
                                              __html: `${distA.toFixed(4)}&nbsp;&asymp;&nbsp;${distA.toFixed(1)}`,
                                            }}
                                          />
                                          <TableCell
                                            className="text-right font-mono"
                                            dangerouslySetInnerHTML={{
                                              __html: `${distB.toFixed(4)}&nbsp;&asymp;&nbsp;${distB.toFixed(1)}`,
                                            }}
                                          />
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

// Dummy component untuk placeholder jika tabelnya jadi komponen terpisah
// const SegmentTable = ({
//   points,
//   gridDimension,
// }: {
//   points: { contourLevel: number; distance: number }[];
//   gridDimension: number;
// }) => (
//   <div className="overflow-hidden rounded-md border">
//     <Table>
//       <TableHeader>
//         <TableRow>
//           <TableHead>Titik Kontur</TableHead>
//           <TableHead className="text-right">Jarak dari Awal (cm)</TableHead>
//           <TableHead className="text-right">Jarak dari Akhir (cm)</TableHead>
//         </TableRow>
//       </TableHeader>
//       <TableBody>
//         {points.map((p) => {
//           const distA = p.distance;
//           const distB = gridDimension - p.distance;
//           return (
//             <TableRow key={p.contourLevel}>
//               <TableCell className="font-mono">
//                 {p.contourLevel.toFixed(2)} m
//               </TableCell>
//               <TableCell
//                 className="text-right font-mono"
//                 dangerouslySetInnerHTML={{
//                   __html: `${distA.toFixed(4)}&nbsp;&asymp;&nbsp;${distA.toFixed(1)}`,
//                 }}
//               />
//               <TableCell
//                 className="text-right font-mono"
//                 dangerouslySetInnerHTML={{
//                   __html: `${distB.toFixed(4)}&nbsp;&asymp;&nbsp;${distB.toFixed(1)}`,
//                 }}
//               />
//             </TableRow>
//           );
//         })}
//       </TableBody>
//     </Table>
//   </div>
// );
