// src/lib/hooks/useKonturProject.ts
"use client";

import { useState, useMemo, useCallback } from "react";
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
import * as XLSX from "xlsx";
import { ComboboxOption } from "@/components/ui/combobox"; // +++ IMPORT TIPE BARU +++

// ... (Tipe data, konstanta, dan fungsi lerp tetap sama) ...
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
// +++ TIPE BARU UNTUK ARAH PENCARIAN +++
export type SearchDirection =
  | "sepanjang_garis_p1_p2"
  | "sepanjang_garis_p2_p1"
  | "atas"
  | "bawah"
  | "kiri"
  | "kanan";

const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 20;
const lerp = (a: number, b: number, t: number) => a + t * (b - a);
const DEFAULT_CROSS_SECTION_LINE = {
  p1: { x: CELL_SIZE * 2, y: CELL_SIZE * 1 },
  p2: { x: CELL_SIZE * 2, y: CELL_SIZE * 5 },
};

export function useKonturProject() {
  const [project, setProject] = useLocalStorageState<ProjectState>(
    "konturProject",
    {
      gridSize: { rows: 7, cols: 10 },
      gridData: Array(7)
        .fill(null)
        .map(() => Array(10).fill(null)),
      crossSectionLine: DEFAULT_CROSS_SECTION_LINE,
    },
  );

  const [settings, setSettings] = useLocalStorageState<SettingsState>(
    "konturSettings",
    { contourInterval: 5, gridDimension: 10 },
  );

  const [contourData, setContourData] = useState<ContourDataState>({
    paths: [],
    interpolationResults: { vertical: {}, horizontal: {} },
  });

  // +++ 1. STATE BARU UNTUK SNIPER MODE +++
  const [targetElevation, setTargetElevation] = useState("");
  const [pointToMove, setPointToMove] = useState<"p1" | "p2">("p1");
  // +++ GANTI TIPE STATE ARAH PENCARIAN +++
  const [searchDirection, setSearchDirection] = useState<SearchDirection>(
    "sepanjang_garis_p1_p2",
  );

  const elevationOptions = useMemo<ComboboxOption[]>(() => {
    const optionsMap = new Map<string, ComboboxOption>();

    // a. Tambahkan elevasi dari titik grid
    project.gridData.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell !== null) {
          const value = `${cell}_${i},${j}`; // Format: "elevasi_baris,kolom"
          const label = `${cell} m (Grid B:${i + 1}, K:${j + 1})`;
          if (!optionsMap.has(label)) {
            // Hindari duplikat label
            optionsMap.set(label, { value, label });
          }
        }
      });
    });

    // b. Tambahkan elevasi dari hasil interpolasi horizontal
    Object.entries(contourData.interpolationResults.horizontal).forEach(
      ([, segments]) => {
        segments.forEach((segment) => {
          segment.points.forEach((point) => {
            const label = `${point.contourLevel.toFixed(2)} m (Kontur Horizontal)`;
            const value = String(point.contourLevel); // Cukup nilainya, karena lokasi pastinya tidak di titik grid
            if (!optionsMap.has(label)) {
              optionsMap.set(label, { value, label });
            }
          });
        });
      },
    );

    // c. Tambahkan elevasi dari hasil interpolasi vertikal
    Object.entries(contourData.interpolationResults.vertical).forEach(
      ([, segments]) => {
        segments.forEach((segment) => {
          segment.points.forEach((point) => {
            const label = `${point.contourLevel.toFixed(2)} m (Kontur Vertikal)`;
            const value = String(point.contourLevel);
            if (!optionsMap.has(label)) {
              optionsMap.set(label, { value, label });
            }
          });
        });
      },
    );

    const sortedOptions = Array.from(optionsMap.values()).sort((a, b) => {
      const elevA = parseFloat(a.value.split("_")[0]);
      const elevB = parseFloat(b.value.split("_")[0]);
      return elevA - elevB;
    });

    return sortedOptions;
  }, [project.gridData, contourData.interpolationResults]);

  // ... (fungsi handleGridDataChange, adjustGrid, clearAllPoints, parseAndSetGridData, handleExportToExcel tetap sama)
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
  const parseAndSetGridData = useCallback((text: string) => {
    if (!text.trim()) {
      toast.info("Text area kosong, tidak ada data yang di-parse.");
      return;
    }
    const parsedData = text
      .trim()
      .split("\n")
      .map((row) =>
        row.split("\t").map((cell) => {
          const cleanedCell = cell.trim().replace(",", ".");
          const num = parseFloat(cleanedCell);
          return isNaN(num) ? null : num;
        }),
      );
    const newRows = Math.max(
      MIN_GRID_SIZE,
      Math.min(MAX_GRID_SIZE, parsedData.length),
    );
    const newCols = Math.max(
      MIN_GRID_SIZE,
      Math.min(MAX_GRID_SIZE, Math.max(...parsedData.map((r) => r.length), 0)),
    );
    const newGridData = Array(newRows)
      .fill(null)
      .map((_, r) =>
        Array(newCols)
          .fill(null)
          .map((_, c) => parsedData[r]?.[c] ?? null),
      );
    setProject((prev) => ({
      ...prev,
      gridSize: { rows: newRows, cols: newCols },
      gridData: newGridData,
    }));
    toast.success(
      `Data berhasil di-parse! Grid diatur ke ${newRows}x${newCols}.`,
    );
  }, []);

  const handleExportToExcel = useCallback(() => {
    try {
      if (project.gridData.flat().every((cell) => cell === null)) {
        toast.warning("Tidak ada data elevasi untuk diekspor.");
        return;
      }
      const dataForSheet = project.gridData.map((row) =>
        row.map((cell) => (cell === null ? "" : cell)),
      );
      const worksheet = XLSX.utils.aoa_to_sheet(dataForSheet);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Elevasi");
      const fileName = `Data_Kontur_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("Data berhasil diekspor ke Excel!");
    } catch (error) {
      console.error("Gagal export ke Excel:", error);
      toast.error("Terjadi kesalahan saat membuat file Excel.");
    }
  }, [project.gridData]);

  // +++ 2. UPGRADE FUNGSI UPDATE POSISI UNTUK MEM-PARSE VALUE BARU +++
  const updateCrossSectionPointByValue = useCallback(
    (pointKey: "p1" | "p2", selectedValue: string) => {
      // Cek apakah value mengandung info lokasi (format: "elevasi_baris,kolom")
      if (selectedValue.includes("_")) {
        const [_, coords] = selectedValue.split("_");
        const [rowStr, colStr] = coords.split(",");
        const row = parseInt(rowStr, 10);
        const col = parseInt(colStr, 10);

        if (!isNaN(row) && !isNaN(col)) {
          setProject((prev) => ({
            ...prev,
            crossSectionLine: {
              ...prev.crossSectionLine,
              [pointKey]: { x: col * CELL_SIZE, y: row * CELL_SIZE },
            },
          }));
          toast.success(
            `Titik ${pointKey.toUpperCase()} dipindahkan ke Grid (B:${row + 1}, K:${col + 1}).`,
          );
          return;
        }
      }

      // Jika tidak ada info lokasi, anggap sebagai input manual atau dari kontur
      const targetElevation = parseFloat(selectedValue);
      if (isNaN(targetElevation)) {
        toast.warning("Nilai elevasi tidak valid.");
        return;
      }

      // Cari titik grid terdekat (fallback jika hanya angka yang dimasukkan)
      for (let i = 0; i < project.gridSize.rows; i++) {
        for (let j = 0; j < project.gridSize.cols; j++) {
          if (project.gridData[i][j] === targetElevation) {
            setProject((prev) => ({
              ...prev,
              crossSectionLine: {
                ...prev.crossSectionLine,
                [pointKey]: { x: j * CELL_SIZE, y: i * CELL_SIZE },
              },
            }));
            toast.success(
              `Titik ${pointKey.toUpperCase()} dipindahkan ke elevasi ${targetElevation}.`,
            );
            return;
          }
        }
      }

      toast.error(`Elevasi ${targetElevation} tidak ditemukan di titik grid.`);
    },
    [project.gridData, project.gridSize, setProject],
  );

  // ... (sisa hook, seperti profileData, handleCalculateContours, dll. tetap sama) ...
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

  // +++ FUNGSI HELPER BARU UNTUK VALIDASI POSISI GRID +++
  const isPointOnGrid = (
    point: Point,
  ): { onGrid: boolean; i?: number; j?: number } => {
    const j = point.x / CELL_SIZE;
    const i = point.y / CELL_SIZE;
    const epsilon = 1e-5;
    const onGrid =
      Math.abs(j - Math.round(j)) < epsilon &&
      Math.abs(i - Math.round(i)) < epsilon;
    return {
      onGrid,
      i: onGrid ? Math.round(i) : undefined,
      j: onGrid ? Math.round(j) : undefined,
    };
  };

  // +++ 1. LOGIKA INTI: SMART SUGGESTIONS UNTUK ELEVASI TARGET +++
  const targetElevationSuggestions = useMemo<ComboboxOption[]>(() => {
    const suggestions = new Set<string>();
    const referencePoint = project.crossSectionLine[pointToMove];
    const { onGrid, i: refRow, j: refCol } = isPointOnGrid(referencePoint);

    // a. Sugesti berdasarkan perpotongan garis potongan dengan kontur
    if (profileData.length > 0) {
      const minElev = Math.min(...profileData.map((p) => p.elevation));
      const maxElev = Math.max(...profileData.map((p) => p.elevation));
      for (
        let level =
          Math.ceil(minElev / settings.contourInterval) *
          settings.contourInterval;
        level <= maxElev;
        level += settings.contourInterval
      ) {
        suggestions.add(level.toFixed(2));
      }
    }

    // b. Sugesti ortogonal jika titik referensi ada di grid
    if (onGrid) {
      const addSuggestionFromSegment = (
        elev1: number | null,
        elev2: number | null,
      ) => {
        if (elev1 === null || elev2 === null) return;
        const min = Math.min(elev1, elev2);
        const max = Math.max(elev1, elev2);
        for (
          let level =
            Math.ceil(min / settings.contourInterval) *
            settings.contourInterval;
          level < max;
          level += settings.contourInterval
        ) {
          suggestions.add(level.toFixed(2));
        }
      };

      // Atas
      if (refRow! > 0)
        addSuggestionFromSegment(
          project.gridData[refRow!][refCol!],
          project.gridData[refRow! - 1][refCol!],
        );
      // Bawah
      if (refRow! < project.gridSize.rows - 1)
        addSuggestionFromSegment(
          project.gridData[refRow!][refCol!],
          project.gridData[refRow! + 1][refCol!],
        );
      // Kiri
      if (refCol! > 0)
        addSuggestionFromSegment(
          project.gridData[refRow!][refCol!],
          project.gridData[refRow!][refCol! - 1],
        );
      // Kanan
      if (refCol! < project.gridSize.cols - 1)
        addSuggestionFromSegment(
          project.gridData[refRow!][refCol!],
          project.gridData[refRow!][refCol! + 1],
        );
    }

    return Array.from(suggestions).map((val) => ({
      value: val,
      label: `${val} m`,
    }));
  }, [
    project.crossSectionLine,
    pointToMove,
    profileData,
    project.gridData,
    settings.contourInterval,
  ]);

  // +++ 2. FUNGSI INTI UNTUK "SNIPER MODE" +++
  const findAndMovePointToElevation = useCallback(() => {
    const target = parseFloat(targetElevation);
    if (isNaN(target)) {
      toast.error("Input elevasi target tidak valid.");
      return;
    }

    // A. PENCARIAN DI SEPANJANG GARIS POTONGAN (Logika ini tidak berubah)
    if (searchDirection.startsWith("sepanjang_garis")) {
      if (profileData.length < 2) {
        toast.error("Garis potongan tidak valid atau tidak memiliki data.");
        return;
      }

      let found = false;
      for (let i = 0; i < profileData.length - 1; i++) {
        const pA = profileData[i];
        const pB = profileData[i + 1];

        // Cek apakah target berada di antara elevasi pA dan pB
        if (
          (pA.elevation <= target && target <= pB.elevation) ||
          (pB.elevation <= target && target <= pA.elevation)
        ) {
          // Lakukan interpolasi linear untuk menemukan jarak yang tepat
          const elevRange = pB.elevation - pA.elevation;
          if (Math.abs(elevRange) < 1e-6) continue; // Hindari pembagian dengan nol

          const t = (target - pA.elevation) / elevRange;
          const interpolatedDistanceCm = lerp(pA.distance, pB.distance, t);

          // Konversi jarak (cm) kembali ke rasio (0-1) di sepanjang garis potongan
          const totalLineDistanceCm =
            profileData[profileData.length - 1].distance;
          const lineRatio = interpolatedDistanceCm / totalLineDistanceCm;

          // Gunakan rasio untuk menemukan koordinat (x,y) di kanvas
          const { p1, p2 } = project.crossSectionLine;
          const newPoint = {
            x: lerp(p1.x, p2.x, lineRatio),
            y: lerp(p1.y, p2.y, lineRatio),
          };

          // Update state project
          setProject((prev) => ({
            ...prev,
            crossSectionLine: {
              ...prev.crossSectionLine,
              [pointToMove]: newPoint,
            },
          }));

          toast.success(
            `Titik ${pointToMove.toUpperCase()} berhasil dipindahkan ke elevasi ${target}m.`,
          );
          found = true;
          break; // Hentikan setelah menemukan segmen pertama yang cocok
        }
      }

      if (!found) {
        toast.warning(
          `Elevasi ${target}m tidak ditemukan di sepanjang garis potongan.`,
        );
      }
      return;
    }

    // 1. Titik referensi adalah titik yang AKAN DIPINDAHKAN.
    const pointToUpdate = pointToMove;
    const referencePoint = project.crossSectionLine[pointToMove];
    const refPointValidation = isPointOnGrid(referencePoint);
    if (!refPointValidation.onGrid) {
      toast.error("Pencarian Ortogonal Gagal", {
        description: `Titik yang akan dipindah (${pointToMove.toUpperCase()}) harus berada di titik grid. Atur titik awal P1 dan P2 untuk mengunci posisinya.`,
      });
      return;
    }

    const { i: startRow, j: startCol } = refPointValidation;
    let newPoint: Point | null = null;

    const searchOrthogonal = (isVertical: boolean, step: number) => {
      const limit = isVertical ? project.gridSize.rows : project.gridSize.cols;
      const start = isVertical ? startRow! : startCol!;

      // 2. Loop dimulai dari titik referensi ke arah yang ditentukan
      for (let k = start + step; k >= 0 && k < limit; k += step) {
        const prev_k = k - step;

        const pA_elev =
          project.gridData[isVertical ? prev_k : startRow!][
            isVertical ? startCol! : prev_k
          ];
        const pB_elev =
          project.gridData[isVertical ? k : startRow!][
            isVertical ? startCol! : k
          ];

        if (pA_elev === null || pB_elev === null) continue;

        if (
          (pA_elev <= target && target <= pB_elev) ||
          (pB_elev <= target && target <= pA_elev)
        ) {
          const elevRange = pB_elev - pA_elev;
          if (Math.abs(elevRange) < 1e-6) {
            // Jika elevasi sama, dan sama dengan target, kita ambil titik akhir segmen
            if (Math.abs(pB_elev - target) < 1e-6) {
              newPoint = {
                x: isVertical ? startCol! * CELL_SIZE : k * CELL_SIZE,
                y: isVertical ? k * CELL_SIZE : startRow! * CELL_SIZE,
              };
              return;
            }
            continue;
          }

          const t = (target - pA_elev) / elevRange;

          if (isVertical) {
            newPoint = {
              x: startCol! * CELL_SIZE,
              y: lerp(prev_k * CELL_SIZE, k * CELL_SIZE, t),
            };
          } else {
            newPoint = {
              x: lerp(prev_k * CELL_SIZE, k * CELL_SIZE, t),
              y: startRow! * CELL_SIZE,
            };
          }
          return;
        }
      }
    };

    switch (searchDirection) {
      case "atas":
        searchOrthogonal(true, -1);
        break;
      case "bawah":
        searchOrthogonal(true, 1);
        break;
      case "kiri":
        searchOrthogonal(false, -1);
        break;
      case "kanan":
        searchOrthogonal(false, 1);
        break;
    }

    if (newPoint) {
      setProject((prev) => ({
        ...prev,
        crossSectionLine: {
          ...prev.crossSectionLine,
          [pointToUpdate]: newPoint,
        },
      }));
      toast.success(
        `Titik ${pointToUpdate.toUpperCase()} berhasil dipindahkan ke elevasi ${target}m.`,
      );
    } else {
      toast.warning(
        `Elevasi ${target}m tidak ditemukan ke arah '${searchDirection}'.`,
      );
    }
  }, [targetElevation, project, pointToMove, searchDirection, setProject]);

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
    elevationOptions, // +++ GANTI uniqueElevations DENGAN elevationOptions
    setProject,
    setSettings,
    handleGridDataChange,
    adjustGrid,
    clearAllPoints,
    parseAndSetGridData,
    handleExportToExcel,
    updateCrossSectionPointByValue, // +++ GANTI NAMA FUNGSI
    profileData,
    handleCalculateContours,
    resetCrossSectionLine,

    // +++ 3. EXPORT STATE & FUNGSI BARU +++
    targetElevation,
    setTargetElevation,
    pointToMove,
    setPointToMove,

    searchDirection,
    setSearchDirection,
    findAndMovePointToElevation,

    targetElevationSuggestions,
  };
}
