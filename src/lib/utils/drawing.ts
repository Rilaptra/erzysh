import { Point } from "./marching-squares";

export const CELL_SIZE = 80;

/**
 * Draws a smooth curve through a series of points using the Catmull-Rom spline algorithm.
 * @param ctx The 2D rendering context of the canvas.
 * @param points An array of points {x, y} to draw the curve through.
 * @param tension A value between 0 and 1 that controls the tightness of the curve.
 */
export function drawCatmullRom(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  tension = 0.5,
) {
  if (points.length < 2) return;

  // Scale points to canvas coordinates
  const pts = points.map((p) => ({ x: p.x * CELL_SIZE, y: p.y * CELL_SIZE }));

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  if (points.length === 2) {
    // For just two points, draw a straight line
    ctx.lineTo(pts[1].x, pts[1].y);
  } else {
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i === 0 ? pts[i] : pts[i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i === pts.length - 2 ? pts[i + 1] : pts[i + 2];

      // Calculate control points for the Catmull-Rom spline
      const cp1x = p1.x + ((p2.x - p0.x) / 6) * (1 - tension) * 2;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * (1 - tension) * 2;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * (1 - tension) * 2;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * (1 - tension) * 2;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }
  ctx.stroke();
}
