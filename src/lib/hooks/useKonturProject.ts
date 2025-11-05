// src/lib/hooks/useKonturProject.ts
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

// Constants
const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 20;

type GridData = (number | null)[][];
type ProjectState = {
  gridSize: { rows: number; cols: number };
  gridData: GridData;
  roadPath: Point[];
};
type SettingsState = {
  contourInterval: number;
  gridDimension: number;
  isDrawing: boolean;
  autoRoadElevation: number | null;
  autoRoadWidth: number;
};

// The Hook
export function useKonturProject() {
  const [project, setProject] = useLocalStorageState<ProjectState>(
    "konturProject",
    {
      gridSize: { rows: 7, cols: 10 },
      gridData: Array(7)
        .fill(null)
        .map(() => Array(10).fill(null)),
      roadPath: [],
    },
  );

  const [settings, setSettings] = useLocalStorageState<SettingsState>(
    "konturSettings",
    {
      contourInterval: 5,
      gridDimension: 10,
      isDrawing: false,
      autoRoadElevation: null,
      autoRoadWidth: 5,
    },
  );

  const [autoRoadPaths, setAutoRoadPaths] = useState<Point[][]>([]);

  // --- (Handlers & Actions remain the same, no changes needed here) ---
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

  const clearRoad = () => {
    setProject((prev) => ({ ...prev, roadPath: [] }));
    setAutoRoadPaths([]);
    setSettings((prev) => ({ ...prev, autoRoadElevation: null }));
    toast.success("Trase jalan telah dihapus.");
  };

  const undoLastRoadPoint = () => {
    setProject((prev) => ({ ...prev, roadPath: prev.roadPath.slice(0, -1) }));
  };

  const addRoadPoint = (point: Point) => {
    setAutoRoadPaths([]);
    setProject((prev) => ({ ...prev, roadPath: [...prev.roadPath, point] }));
  };

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

  // --- Memoized Calculations ---
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

  const groupedInterpolationResults = useMemo(
    () => groupInterpolationPoints(interpolationResults),
    [interpolationResults],
  );

  // ✨ --- NEW: Create nested results for the UI --- ✨
  const nestedInterpolationResults = useMemo(() => {
    const nested: {
      vertical: Record<string, SegmentData[]>;
      horizontal: Record<string, SegmentData[]>;
    } = { vertical: {}, horizontal: {} };

    // Group horizontal segments by their row index
    for (const [key, value] of Object.entries(
      groupedInterpolationResults.horizontal,
    )) {
      const rowIndex = key.split("_")[0].split(",")[0]; // Parses "i,j_..." to get "i"
      if (!nested.horizontal[rowIndex]) {
        nested.horizontal[rowIndex] = [];
      }
      nested.horizontal[rowIndex].push(value);
    }

    // Group vertical segments by their column index
    for (const [key, value] of Object.entries(
      groupedInterpolationResults.vertical,
    )) {
      const colIndex = key.split("_")[0].split(",")[1]; // Parses "i,j_..." to get "j"
      if (!nested.vertical[colIndex]) {
        nested.vertical[colIndex] = [];
      }
      nested.vertical[colIndex].push(value);
    }

    return nested;
  }, [groupedInterpolationResults]);

  return {
    // State
    project,
    settings,
    autoRoadPaths,

    // Setters
    setSettings,

    // Handlers
    handleGridDataChange,
    adjustGrid,
    clearAllPoints,
    clearRoad,
    undoLastRoadPoint,
    addRoadPoint,
    handleGenerateAutoRoad,

    // Memoized Results
    // We export the new nested one for the UI
    nestedInterpolationResults,
  };
}
