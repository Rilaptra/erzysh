"use client";

import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Point } from "@/lib/utils/marching-squares";
import { drawCatmullRom, CELL_SIZE } from "@/lib/utils/drawing";

type ProjectState = {
  gridSize: { rows: number; cols: number };
  gridData: (number | null)[][];
  crossSectionLine: { p1: Point; p2: Point };
};

type KonturCanvasProps = {
  gridSize: { rows: number; cols: number };
  gridData: (number | null)[][];
  contourPaths: Point[][];
  crossSectionLine: { p1: Point; p2: Point };
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
};

const darkColors = {
  grid: "#334155",
  text: "#e2e8f0",
  point: "#94a3b8",
  contour: "#64748b",
  startHandle: "#16a34a",
  startHandleBorder: "#15803d",
  otherHandle: "#fbbf24",
  otherHandleBorder: "#d97706",
  draggingHandle: "#f59e0b",
};
const lightColors = {
  grid: "#cbd5e1",
  text: "#334155",
  point: "#475569",
  contour: "#94a3b8",
  startHandle: "#22c55e",
  startHandleBorder: "#16a34a",
  otherHandle: "#fbbf24",
  otherHandleBorder: "#d97706",
  draggingHandle: "#f59e0b",
};

export function KonturCanvas({
  gridSize,
  gridData,
  contourPaths,
  crossSectionLine,
  setProject,
}: KonturCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { theme: resolvedTheme } = useTheme();
  const colors = useMemo(
    () => (resolvedTheme === "dark" ? darkColors : lightColors),
    [resolvedTheme],
  );

  const [draggingHandle, setDraggingHandle] = useState<
    "p1" | "p2" | "center" | null
  >(null);
  const [hoverHandle, setHoverHandle] = useState<"p1" | "p2" | "center" | null>(
    null,
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d")!;

    canvas.width = (gridSize.cols - 1) * CELL_SIZE;
    canvas.height = (gridSize.rows - 1) * CELL_SIZE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = colors.grid;
    ctx.fillStyle = colors.text;
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
        ctx.fillStyle = colors.point;
        ctx.fill();
        const value = gridData[i][j];
        if (value !== null) {
          ctx.fillStyle = colors.text;
          ctx.fillText(value.toString(), x + 8, y - 8);
        }
      }
    }

    ctx.strokeStyle = colors.contour;
    ctx.lineWidth = 1.5;
    contourPaths.forEach((path) => {
      drawCatmullRom(ctx, path);
    });

    const { p1, p2 } = crossSectionLine;
    const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle =
      draggingHandle === "p1" ? colors.draggingHandle : colors.startHandle;
    ctx.fill();
    ctx.strokeStyle = colors.startHandleBorder;
    ctx.stroke();

    [p2, center].forEach((p, i) => {
      const handleName = i === 0 ? "p2" : "center";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle =
        draggingHandle === handleName
          ? colors.draggingHandle
          : colors.otherHandle;
      ctx.fill();
      ctx.strokeStyle = colors.otherHandleBorder;
      ctx.stroke();
    });
  }, [
    gridSize,
    gridData,
    contourPaths,
    colors,
    crossSectionLine,
    draggingHandle,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getEventCoordinates = useCallback(
    (e: MouseEvent | TouchEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0]?.clientY : e.clientY;
      if (clientX === undefined || clientY === undefined) return null;
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [],
  );

  const checkHandleHover = useCallback(
    (pos: Point) => {
      const { p1, p2 } = crossSectionLine;
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const dist = (pA: Point, pB: Point) =>
        Math.sqrt(Math.pow(pA.x - pB.x, 2) + Math.pow(pA.y - pB.y, 2));
      const tolerance = 15;
      if (dist(pos, p1) < tolerance) return "p1";
      if (dist(pos, p2) < tolerance) return "p2";
      if (dist(pos, center) < tolerance) return "center";
      return null;
    },
    [crossSectionLine],
  );

  const moveDrag = useCallback(
    (pos: Point) => {
      if (!draggingHandle) return;
      setProject((prev) => {
        let { p1, p2 } = prev.crossSectionLine;
        if (draggingHandle === "center") {
          const dx = pos.x - (p1.x + p2.x) / 2;
          const dy = pos.y - (p1.y + p2.y) / 2;
          p1 = { x: p1.x + dx, y: p1.y + dy };
          p2 = { x: p2.x + dx, y: p2.y + dy };
        } else if (draggingHandle === "p1") {
          p1 = pos;
        } else if (draggingHandle === "p2") {
          p2 = pos;
        }
        return { ...prev, crossSectionLine: { p1, p2 } };
      });
    },
    [draggingHandle, setProject],
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getEventCoordinates(e.nativeEvent);
    if (pos) {
      const handle = checkHandleHover(pos);
      if (handle) setDraggingHandle(handle);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const pos = getEventCoordinates(e.nativeEvent);
    if (pos) {
      const handle = checkHandleHover(pos);
      if (handle) {
        e.preventDefault();
        setDraggingHandle(handle);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingHandle) return;
    const pos = getEventCoordinates(e.nativeEvent);
    if (pos) setHoverHandle(checkHandleHover(pos));
  };

  const handleWheelScroll = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollTop += e.deltaY;
      scrollContainerRef.current.scrollLeft += e.deltaX;
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const pos = getEventCoordinates(e);
      if (pos) moveDrag(pos);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const pos = getEventCoordinates(e);
      if (pos) moveDrag(pos);
    };

    const endDrag = () => setDraggingHandle(null);

    if (draggingHandle) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", endDrag);
      window.addEventListener("touchmove", handleGlobalTouchMove, {
        passive: false,
      });
      window.addEventListener("touchend", endDrag);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", endDrag);
    };
  }, [draggingHandle, getEventCoordinates, moveDrag]);

  useEffect(() => {
    const bodyElement = document.body;
    const originalOverflow = bodyElement.style.overflow;
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (draggingHandle && isTouchDevice) {
      bodyElement.style.overflow = "hidden";
    } else {
      bodyElement.style.overflow = originalOverflow;
    }

    return () => {
      bodyElement.style.overflow = originalOverflow;
    };
  }, [draggingHandle]);

  const getCursor = () => {
    if (draggingHandle) return "grabbing";
    if (hoverHandle) return "grab";
    return "default";
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Visualisasi Peta Kontur</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div
          ref={scrollContainerRef}
          className="bg-card-foreground/5 w-full flex-1 overflow-auto rounded-md border px-5 py-16"
        >
          <canvas
            className="m-auto"
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoverHandle(null)}
            onTouchStart={handleTouchStart}
            onWheel={handleWheelScroll}
            style={{
              cursor: getCursor(),
              touchAction: "none",
            }}
          />
        </div>
        <div className="text-muted-foreground flex shrink-0 items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{
                backgroundColor: colors.startHandle,
                border: `2px solid ${colors.startHandleBorder}`,
              }}
            ></div>
            <span>Titik Awal (P1)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{
                backgroundColor: colors.otherHandle,
                border: `2px solid ${colors.otherHandleBorder}`,
              }}
            ></div>
            <span>Titik Akhir (P2) / Tengah</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
