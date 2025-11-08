// src/lib/utils/kontur.ts

export interface InterpolationPoint {
  from: [number, number];
  to: [number, number];
  elev1: number;
  elev2: number;
  contourLevel: number;
  distance: number;
  formula: string;
  orientation: "Horizontal" | "Vertikal";
}

export interface SegmentData {
  elev1: number;
  elev2: number;
  points: { contourLevel: number; distance: number; formula: string }[];
}

export interface GroupedInterpolationResults {
  vertical: Record<string, SegmentData>;
  horizontal: Record<string, SegmentData>;
}

export function calculateInterpolationPoints(
  gridData: (number | null)[][],
  gridSize: { rows: number; cols: number },
  contourInterval: number,
  gridDimension: number,
): InterpolationPoint[] {
  const results: InterpolationPoint[] = [];
  if (contourInterval <= 0 || gridDimension <= 0) return results;

  const processSegment = (
    e1: number,
    e2: number,
    orientation: "Horizontal" | "Vertikal",
    from: [number, number],
    to: [number, number],
  ) => {
    const minElev = Math.min(e1, e2);
    const maxElev = Math.max(e1, e2);
    for (
      let lvl = Math.ceil(minElev / contourInterval) * contourInterval;
      lvl < maxElev;
      lvl += contourInterval
    ) {
      if (lvl === e1 || lvl === e2) continue;

      // +++ BUAT STRING FORMULA DENGAN SINTAKS LATEX +++
      // Kita pake double backslash (\\) karena di dalam string JavaScript,
      // backslash tunggal adalah escape character.
      const formula = `\\frac{${lvl.toLocaleString("id-ID", { maximumFractionDigits: 2 })} - ${e1.toLocaleString("id-ID", { maximumFractionDigits: 2 })}}{${(e2 - e1).toLocaleString("id-ID", { maximumFractionDigits: 2 })}} \\times ${gridDimension}`;

      results.push({
        from,
        to,
        elev1: e1,
        elev2: e2,
        contourLevel: lvl,
        distance: (Math.abs(lvl - e1) / Math.abs(e2 - e1)) * gridDimension,
        formula,
        orientation,
      });
    }
  };

  for (let i = 0; i < gridSize.rows; i++) {
    for (let j = 0; j < gridSize.cols; j++) {
      // Horizontal check
      if (j < gridSize.cols - 1) {
        const [e1, e2] = [gridData[i][j], gridData[i][j + 1]];
        if (e1 !== null && e2 !== null && e1 !== e2) {
          processSegment(e1, e2, "Horizontal", [i, j], [i, j + 1]);
        }
      }
      // Vertical check
      if (i < gridSize.rows - 1) {
        const [e1, e2] = [gridData[i][j], gridData[i + 1][j]];
        if (e1 !== null && e2 !== null && e1 !== e2) {
          processSegment(e1, e2, "Vertikal", [i, j], [i + 1, j]);
        }
      }
    }
  }
  return results;
}

// ... (fungsi groupInterpolationPoints tidak berubah)
export function groupInterpolationPoints(
  interpolationResults: InterpolationPoint[],
): GroupedInterpolationResults {
  return interpolationResults.reduce<GroupedInterpolationResults>(
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
        formula: point.formula,
      });
      group[key].points.sort((a, b) => a.contourLevel - b.contourLevel);
      return acc;
    },
    { vertical: {}, horizontal: {} },
  );
}
