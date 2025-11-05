// src/lib/utils/marching-squares.ts

export interface Point {
  x: number;
  y: number;
}

export interface Line {
  p1: Point;
  p2: Point;
}

function lerp(
  p1: Point,
  p2: Point,
  value: number,
  v1: number,
  v2: number,
): Point {
  if (Math.abs(v1 - v2) < 1e-6) {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  }
  const t = (value - v1) / (v2 - v1);
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
}

export function marchingSquares(
  gridData: (number | null)[][],
  contourLevel: number,
): Line[] {
  const lines: Line[] = [];
  const rows = gridData.length;
  if (rows === 0) return [];
  const cols = gridData[0].length;
  if (cols === 0) return [];

  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const corners = [
        { p: { x: j, y: i }, v: gridData[i][j] },
        { p: { x: j + 1, y: i }, v: gridData[i][j + 1] },
        { p: { x: j + 1, y: i + 1 }, v: gridData[i + 1][j + 1] },
        { p: { x: j, y: i + 1 }, v: gridData[i + 1][j] },
      ];

      if (corners.some((c) => c.v === null)) continue;

      let caseIndex = 0;
      if (corners[0].v! > contourLevel) caseIndex |= 8;
      if (corners[1].v! > contourLevel) caseIndex |= 4;
      if (corners[2].v! > contourLevel) caseIndex |= 2;
      if (corners[3].v! > contourLevel) caseIndex |= 1;

      const [p1, p2, p3, p4] = corners;

      const a = lerp(p1.p, p2.p, contourLevel, p1.v!, p2.v!);
      const b = lerp(p2.p, p3.p, contourLevel, p2.v!, p3.v!);
      const c = lerp(p4.p, p3.p, contourLevel, p4.v!, p3.v!);
      const d = lerp(p1.p, p4.p, contourLevel, p1.v!, p4.v!);

      switch (caseIndex) {
        case 1:
          lines.push({ p1: c, p2: d });
          break;
        case 2:
          lines.push({ p1: b, p2: c });
          break;
        case 3:
          lines.push({ p1: b, p2: d });
          break;
        case 4:
          lines.push({ p1: a, p2: b });
          break;
        case 5:
          lines.push({ p1: a, p2: d });
          lines.push({ p1: b, p2: c });
          break;
        case 6:
          lines.push({ p1: a, p2: c });
          break;
        case 7:
          lines.push({ p1: a, p2: d });
          break;
        case 8:
          lines.push({ p1: a, p2: d });
          break;
        case 9:
          lines.push({ p1: a, p2: c });
          break;
        case 10:
          lines.push({ p1: a, p2: b });
          lines.push({ p1: c, p2: d });
          break;
        case 11:
          lines.push({ p1: a, p2: b });
          break;
        case 12:
          lines.push({ p1: b, p2: d });
          break;
        case 13:
          lines.push({ p1: b, p2: c });
          break;
        case 14:
          lines.push({ p1: c, p2: d });
          break;
      }
    }
  }
  return lines;
}

/**
 * Menyambungkan segmen-segmen garis menjadi satu atau beberapa polylines.
 * @param lines Array berisi segmen garis.
 * @returns Array berisi polylines (setiap polyline adalah array of points).
 */
export function connectLines(lines: Line[]): Point[][] {
  if (lines.length === 0) return [];

  const paths: Point[][] = [];
  const remainingLines = [...lines];
  const epsilon = 1e-5;

  const arePointsEqual = (p1: Point, p2: Point) =>
    Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon;

  while (remainingLines.length > 0) {
    let currentPath = [remainingLines[0].p1, remainingLines[0].p2];
    remainingLines.splice(0, 1);

    let pathExtended = true;
    while (pathExtended) {
      pathExtended = false;
      for (let i = remainingLines.length - 1; i >= 0; i--) {
        const line = remainingLines[i];
        const firstPoint = currentPath[0];
        const lastPoint = currentPath[currentPath.length - 1];

        if (arePointsEqual(lastPoint, line.p1)) {
          currentPath.push(line.p2);
          remainingLines.splice(i, 1);
          pathExtended = true;
        } else if (arePointsEqual(lastPoint, line.p2)) {
          currentPath.push(line.p1);
          remainingLines.splice(i, 1);
          pathExtended = true;
        } else if (arePointsEqual(firstPoint, line.p1)) {
          currentPath.unshift(line.p2);
          remainingLines.splice(i, 1);
          pathExtended = true;
        } else if (arePointsEqual(firstPoint, line.p2)) {
          currentPath.unshift(line.p1);
          remainingLines.splice(i, 1);
          pathExtended = true;
        }
      }
    }
    paths.push(currentPath);
  }
  return paths;
}
