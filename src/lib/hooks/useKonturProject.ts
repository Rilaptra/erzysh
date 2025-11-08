// src/lib/hooks/useKonturProject.ts
"use client";

import { useState, useMemo } from "react";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { toast } from "sonner";
import {
  Point,
  marchingSquares,
  connectLines,
} from "@/lib/utils/marching-squares";
import {
  calculateInterpolationPoints,
  groupInterpolationPoints,
  SegmentData,
} from "@/lib/utils/kontur";
import { CELL_SIZE } from "@/lib/utils/drawing";

// Tipe Data
type ProfilePoint = { distance: number; elevation: number };
type GridData = (number | null)[][];
type ProjectState = {
  gridSize: { rows: number; cols: number };
  gridData: GridData;
  crossSectionLine: { p1: Point; p2: Point };
};
type SettingsState = {
  contourInterval: number;
  gridDimension: number;
};
type ContourDataState = {
  paths: Point[][];
  interpolationResults: {
    vertical: Record<string, SegmentData[]>;
    horizontal: Record<string, SegmentData[]>;
  };
};

const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 20;

const lerp = (a: number, b: number, t: number) => a + t * (b - a);

// +++ DEFINISIKAN POSISI DEFAULT DI SINI +++
const DEFAULT_CROSS_SECTION_LINE = {
  p1: { x: CELL_SIZE * 2, y: CELL_SIZE * 1 },
  p2: { x: CELL_SIZE * 2, y: CELL_SIZE * 5 },
};

// --- HOOK UTAMA ---
export function useKonturProject() {
  const [project, setProject] = useLocalStorageState<ProjectState>(
    "konturProject",
    {
      gridSize: { rows: 7, cols: 10 },
      gridData: Array(7)
        .fill(null)
        .map(() => Array(10).fill(null)),
      crossSectionLine: DEFAULT_CROSS_SECTION_LINE, // Gunakan posisi default
    },
  );

  const [settings, setSettings] = useLocalStorageState<SettingsState>(
    "konturSettings",
    {
      contourInterval: 5,
      gridDimension: 10,
    },
  );

  const [contourData, setContourData] = useState<ContourDataState>({
    paths: [],
    interpolationResults: { vertical: {}, horizontal: {} },
  });

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
    setContourData({
      paths: [],
      interpolationResults: { vertical: {}, horizontal: {} },
    });
    toast.success("Semua titik elevasi telah dihapus.");
  };

  const profileData = useMemo<ProfilePoint[]>(() => {
    const { gridData, gridSize, crossSectionLine } = project;
    const { p1, p2 } = crossSectionLine;
    const profile: ProfilePoint[] = [];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lineLengthPx = Math.sqrt(dx * dx + dy * dy);
    if (lineLengthPx === 0) return [];
    const numSteps = Math.ceil(lineLengthPx);
    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps;
      const currentX = lerp(p1.x, p2.x, t);
      const currentY = lerp(p1.y, p2.y, t);
      const gridX = currentX / CELL_SIZE;
      const gridY = currentY / CELL_SIZE;
      const j = Math.floor(gridX);
      const i_row = Math.floor(gridY);
      if (
        i_row < 0 ||
        i_row >= gridSize.rows - 1 ||
        j < 0 ||
        j >= gridSize.cols - 1
      )
        continue;
      const tl = gridData[i_row][j];
      const tr = gridData[i_row][j + 1];
      const bl = gridData[i_row + 1][j];
      const br = gridData[i_row + 1][j + 1];
      if (tl === null || tr === null || bl === null || br === null) continue;
      const tx = gridX - j;
      const ty = gridY - i_row;
      const topElev = lerp(tl, tr, tx);
      const bottomElev = lerp(bl, br, tx);
      const elevation = lerp(topElev, bottomElev, ty);
      const distance = t * lineLengthPx * (settings.gridDimension / CELL_SIZE);
      profile.push({ distance, elevation });
    }
    return profile;
  }, [project, settings.gridDimension]);

  const handleCalculateContours = () => {
    toast.info("Menghitung kontur...");
    const allValues = project.gridData
      .flat()
      .filter((v) => v !== null) as number[];
    let calculatedPaths: Point[][] = [];
    if (allValues.length > 0 && settings.contourInterval > 0) {
      const minElev = Math.min(...allValues);
      const maxElev = Math.max(...allValues);
      for (
        let level =
          Math.ceil(minElev / settings.contourInterval) *
          settings.contourInterval;
        level <= maxElev;
        level += settings.contourInterval
      ) {
        const lines = marchingSquares(project.gridData, level);
        const paths = connectLines(lines);
        calculatedPaths.push(...paths);
      }
    }
    const interpolationResults = calculateInterpolationPoints(
      project.gridData,
      project.gridSize,
      settings.contourInterval,
      settings.gridDimension,
    );
    const grouped = groupInterpolationPoints(interpolationResults);
    const nested: ContourDataState["interpolationResults"] = {
      vertical: {},
      horizontal: {},
    };
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
    setContourData({
      paths: calculatedPaths,
      interpolationResults: nested,
    });
    toast.success("Kontur berhasil digenerate!");
  };

  // +++ FUNGSI BARU UNTUK RESET POSISI +++
  const resetCrossSectionLine = () => {
    setProject((prev) => ({
      ...prev,
      crossSectionLine: DEFAULT_CROSS_SECTION_LINE,
    }));
    toast.success("Posisi garis potongan direset.");
  };

  return {
    project,
    settings,
    contourData,
    setProject,
    setSettings,
    handleGridDataChange,
    adjustGrid,
    clearAllPoints,
    profileData,
    handleCalculateContours,
    resetCrossSectionLine, // Export fungsi reset
  };
}
