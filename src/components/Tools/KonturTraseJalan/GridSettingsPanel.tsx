// src/components/Tools/KonturTraseJalan/GridSettingsPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2, ClipboardPaste, FileDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";

type GridSettingsPanelProps = {
  gridSize: { rows: number; cols: number };
  gridData: (number | null)[][];
  adjustGrid: (type: "row" | "col", amount: 1 | -1) => void;
  handleGridDataChange: (row: number, col: number, value: string) => void;
  clearAllPoints: () => void;
  parseAndSetGridData: (text: string) => void;
  handleExportToExcel: () => void;
};

export function GridSettingsPanel({
  gridSize,
  gridData,
  adjustGrid,
  handleGridDataChange,
  clearAllPoints,
  parseAndSetGridData,
  handleExportToExcel,
}: GridSettingsPanelProps) {
  const [pastedText, setPastedText] = useState("");

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
                // --- PERBAIKAN DI SINI ---
                // Hapus .replace(".", ",") agar browser bisa render float dengan benar.
                // React akan otomatis mengubah `null` menjadi string kosong.
                value={cell ?? ""}
                onChange={(e) =>
                  // Pertahankan ini untuk menangani input user yang mungkin pakai koma
                  handleGridDataChange(i, j, e.target.value.replace(",", "."))
                }
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
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>
              Input Cepat dari Excel/Spreadsheet
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <Textarea
                placeholder="Salin dan tempel data dari Excel di sini. Gunakan koma sebagai desimal dan tab sebagai pemisah sel."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <Button
                className="w-full"
                onClick={() => parseAndSetGridData(pastedText)}
              >
                <ClipboardPaste className="mr-2 h-4 w-4" />
                Parse & Terapkan ke Grid
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center justify-between">
          <Label>Ukuran Grid</Label>
          <div className="flex flex-wrap items-center gap-2">
            <span>
              {gridSize.rows} x {gridSize.cols}
            </span>
            <div className="flex gap-2">
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
              </div>
              <div className="flex gap-1">
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
        </div>
        {inputGrid}
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            className="border-green-600/50 text-green-600 hover:bg-green-500/10 hover:text-green-700"
            onClick={handleExportToExcel}
          >
            <FileDown className="mr-2 h-4 w-4" /> Export to Excel
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={clearAllPoints}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Hapus Semua Elevasi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
