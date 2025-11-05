// src/components/Tools/KonturTraseJalan/GridSettingsPanel.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2 } from "lucide-react";

type GridSettingsPanelProps = {
  gridSize: { rows: number; cols: number };
  gridData: (number | null)[][];
  adjustGrid: (type: "row" | "col", amount: 1 | -1) => void;
  handleGridDataChange: (row: number, col: number, value: string) => void;
  clearAllPoints: () => void;
};

export function GridSettingsPanel({
  gridSize,
  gridData,
  adjustGrid,
  handleGridDataChange,
  clearAllPoints,
}: GridSettingsPanelProps) {
  const inputGrid = useMemo(
    () => (
      <div className="overflow-auto p-1">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridSize.cols}, minmax(70px, 1fr))`,
            gap: "8px",
          }}
        >
          {gridData.map((row, i) =>
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
    [gridSize.cols, gridData, handleGridDataChange],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Atur Grid & Elevasi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Ukuran Grid</Label>
          <div className="flex items-center gap-2">
            <span>
              {gridSize.rows} x {gridSize.cols}
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
  );
}
