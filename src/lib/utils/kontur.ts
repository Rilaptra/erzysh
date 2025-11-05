// src/lib/utils/kontur.ts

export interface InterpolationPoint {
  from: [number, number];
  to: [number, number];
  elev1: number;
  elev2: number;
  contourLevel: number;
  distance: number;
  orientation: "Horizontal" | "Vertikal";
}

export interface GroupedInterpolationResults {
  vertical: Record<string, SegmentData>;
  horizontal: Record<string, SegmentData>;
}

export interface SegmentData {
  elev1: number;
  elev2: number;
  points: { contourLevel: number; distance: number }[];
}

/**
 * Calculates the interpolation points for contour lines within a grid.
 * @param gridData The 2D array of elevation data.
 * @param gridSize The dimensions of the grid { rows, cols }.
 * @param contourInterval The interval between contour lines.
 * @param gridDimension The real-world dimension of a grid cell.
 * @returns An array of calculated interpolation points.
 */
export function calculateInterpolationPoints(
  gridData: (number | null)[][],
  gridSize: { rows: number; cols: number },
  contourInterval: number,
  gridDimension: number,
): InterpolationPoint[] {
  const results: InterpolationPoint[] = [];
  if (contourInterval <= 0 || gridDimension <= 0) return results;

  for (let i = 0; i < gridSize.rows; i++) {
    for (let j = 0; j < gridSize.cols; j++) {
      // Horizontal check
      if (j < gridSize.cols - 1) {
        const [e1, e2] = [gridData[i][j], gridData[i][j + 1]];
        if (e1 !== null && e2 !== null && e1 !== e2) {
          const minElev = Math.min(e1, e2);
          const maxElev = Math.max(e1, e2);
          for (
            let lvl = Math.ceil(minElev / contourInterval) * contourInterval;
            lvl < maxElev;
            lvl += contourInterval
          ) {
            if (lvl === e1 || lvl === e2) continue;
            results.push({
              from: [i, j],
              to: [i, j + 1],
              elev1: e1,
              elev2: e2,
              contourLevel: lvl,
              distance:
                (Math.abs(lvl - e1) / Math.abs(e2 - e1)) * gridDimension,
              orientation: "Horizontal",
            });
          }
        }
      }
      // Vertical check
      if (i < gridSize.rows - 1) {
        const [e1, e2] = [gridData[i][j], gridData[i + 1][j]];
        if (e1 !== null && e2 !== null && e1 !== e2) {
          const minElev = Math.min(e1, e2);
          const maxElev = Math.max(e1, e2);
          for (
            let lvl = Math.ceil(minElev / contourInterval) * contourInterval;
            lvl < maxElev;
            lvl += contourInterval
          ) {
            if (lvl === e1 || lvl === e2) continue;
            results.push({
              from: [i, j],
              to: [i + 1, j],
              elev1: e1,
              elev2: e2,
              contourLevel: lvl,
              distance:
                (Math.abs(lvl - e1) / Math.abs(e2 - e1)) * gridDimension,
              orientation: "Vertikal",
            });
          }
        }
      }
    }
  }
  return results;
}

/**
 * Groups raw interpolation points by their segment.
 * @param interpolationResults The array of calculated interpolation points.
 * @returns An object with points grouped into vertical and horizontal segments.
 */
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
      });
      // Sort points by contour level for consistent display
      group[key].points.sort((a, b) => a.contourLevel - b.contourLevel);
      return acc;
    },
    { vertical: {}, horizontal: {} },
  );
}
