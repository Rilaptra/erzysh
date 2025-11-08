// src/lib/hooks/useKonturProject.ts
"use client";

import { useMemo } from "react";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { toast } from "sonner";
import { Point } from "@/lib/utils/marching-squares";
import {
  calculateInterpolationPoints,
  groupInterpolationPoints,
  SegmentData,
} from "@/lib/utils/kontur";
import { CELL_SIZE } from "@/lib/utils/drawing";

// --- TIPE DATA & STATE AWAL ---
type ProfilePoint = { distance: number; elevation: number };

const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 20;

type GridData = (number | null)[][];
type ProjectState = {
  gridSize: { rows: number; cols: number };
  gridData: GridData;
  // GANTI roadPath DENGAN crossSectionLine
  crossSectionLine: { p1: Point; p2: Point };
};
type SettingsState = {
  contourInterval: number;
  gridDimension: number;
};

// Fungsi interpolasi linear sederhana
const lerp = (a: number, b: number, t: number) => a + t * (b - a);

// --- HOOK UTAMA ---
export function useKonturProject() {
  const [project, setProject] = useLocalStorageState<ProjectState>(
    "konturProject", // KUNCI LOCALSTORAGE TETAP SAMA
    {
      gridSize: { rows: 7, cols: 10 },
      gridData: Array(7)
        .fill(null)
        .map(() => Array(10).fill(null)),
      // Inisialisasi garis potongan default
      crossSectionLine: {
        p1: { x: CELL_SIZE * 2, y: CELL_SIZE * 1 },
        p2: { x: CELL_SIZE * 2, y: CELL_SIZE * 5 },
      },
    },
  );

  const [settings, setSettings] = useLocalStorageState<SettingsState>(
    "konturSettings", // KUNCI LOCALSTORAGE TETAP SAMA
    {
      contourInterval: 5,
      gridDimension: 10,
    },
  );

  // --- Fungsi-fungsi lama (adjustGrid, clearAllPoints, dll) tetap sama ---
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
          `Ukuran grid antara ${MIN_GRID_SIZE}x${MIN_GRID_SIZE} dan ${MAX_GRID_SIZE}x${MAX_GRID_SIZE}.`,
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

  // +++ FUNGSI BARU: Kalkulasi Profil Potongan Memanjang dengan Bilinear Interpolation +++
  const profileData = useMemo<ProfilePoint[]>(() => {
    const { gridData, gridSize, crossSectionLine } = project;
    const { p1, p2 } = crossSectionLine;
    const profile: ProfilePoint[] = [];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lineLengthPx = Math.sqrt(dx * dx + dy * dy);
    if (lineLengthPx === 0) return [];

    const numSteps = Math.ceil(lineLengthPx); // Ambil sampel setiap pixel

    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps;
      const currentX = lerp(p1.x, p2.x, t);
      const currentY = lerp(p1.y, p2.y, t);

      // Konversi ke koordinat grid
      const gridX = currentX / CELL_SIZE;
      const gridY = currentY / CELL_SIZE;

      const j = Math.floor(gridX); // Kolom
      const i_row = Math.floor(gridY); // Baris

      if (
        i_row < 0 ||
        i_row >= gridSize.rows - 1 ||
        j < 0 ||
        j >= gridSize.cols - 1
      ) {
        continue;
      }

      const tl = gridData[i_row][j];
      const tr = gridData[i_row][j + 1];
      const bl = gridData[i_row + 1][j];
      const br = gridData[i_row + 1][j + 1];

      if (tl === null || tr === null || bl === null || br === null) continue;

      const tx = gridX - j; // Fraksi horizontal
      const ty = gridY - i_row; // Fraksi vertikal

      // Bilinear Interpolation
      const topElev = lerp(tl, tr, tx);
      const bottomElev = lerp(bl, br, tx);
      const elevation = lerp(topElev, bottomElev, ty);

      const distance = t * lineLengthPx * (settings.gridDimension / CELL_SIZE);
      profile.push({ distance, elevation });
    }

    return profile;
  }, [project, settings.gridDimension]);

  // Kalkulasi untuk detail interpolasi tidak berubah
  const interpolationResults = useMemo(
    () =>
      calculateInterpolationPoints(
        project.gridData,
        project.gridSize,
        settings.contourInterval,
        settings.gridDimension,
      ),
    [
      project.gridData,
      project.gridSize,
      settings.contourInterval,
      settings.gridDimension,
    ],
  );
  const nestedInterpolationResults = useMemo(() => {
    const grouped = groupInterpolationPoints(interpolationResults);
    const nested: {
      vertical: Record<string, SegmentData[]>;
      horizontal: Record<string, SegmentData[]>;
    } = { vertical: {}, horizontal: {} };

    for (const [key, value] of Object.entries(grouped.horizontal)) {
      const rowIndex = key.split("_")[0].split(",")[0];
      if (!nested.horizontal[rowIndex]) nested.horizontal[rowIndex] = [];
      nested.horizontal[rowIndex].push(value);
    }
    for (const [key, value] of Object.entries(grouped.vertical)) {
      const colIndex = key.split("_")[0].split(",")[1];
      if (!nested.vertical[colIndex]) nested.vertical[colIndex] = [];
      nested.vertical[colIndex].push(value);
    }
    return nested;
  }, [interpolationResults]);

  return {
    project,
    settings,
    setProject, // Export setter utama untuk diubah dari canvas
    setSettings,
    handleGridDataChange,
    adjustGrid,
    clearAllPoints,
    nestedInterpolationResults,
    profileData,
  };
}
