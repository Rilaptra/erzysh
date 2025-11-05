// src/components/Tools/KonturTraseJalan/VisualizationSettingsPanel.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Undo, MousePointerClick, Sparkles } from "lucide-react";

type SettingsState = {
  contourInterval: number;
  gridDimension: number;
  isDrawing: boolean;
  autoRoadElevation: number | null;
  autoRoadWidth: number;
};

type VisualizationSettingsPanelProps = {
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  handleGenerateAutoRoad: () => void;
  undoLastRoadPoint: () => void;
  clearRoad: () => void;
  hasManualRoad: boolean;
  hasAutoRoad: boolean;
};

export function VisualizationSettingsPanel({
  settings,
  setSettings,
  handleGenerateAutoRoad,
  undoLastRoadPoint,
  clearRoad,
  hasManualRoad,
  hasAutoRoad,
}: VisualizationSettingsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Atur Visualisasi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="interval">Interval Kontur (m)</Label>
            <Input
              id="interval"
              type="number"
              value={settings.contourInterval}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  contourInterval: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="dimension">Dimensi Grid (cm)</Label>
            <Input
              id="dimension"
              type="number"
              value={settings.gridDimension}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  gridDimension: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>
        <div className="space-y-4 rounded-md border p-4">
          <Label className="flex items-center gap-2 font-semibold">
            <Sparkles className="text-primary h-4 w-4" />
            Trase Jalan Otomatis
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="road-elev">Ketinggian (m)</Label>
              <Input
                id="road-elev"
                type="number"
                placeholder="e.g., 145"
                value={settings.autoRoadElevation ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    autoRoadElevation:
                      e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="road-width">Lebar (px)</Label>
              <Input
                id="road-width"
                type="number"
                value={settings.autoRoadWidth}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    autoRoadWidth: parseFloat(e.target.value) || 1,
                  }))
                }
              />
            </div>
          </div>
          <Button className="w-full" onClick={handleGenerateAutoRoad}>
            Generate Trase
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Gambar Trase Jalan Manual</Label>
          <div className="flex items-center gap-2">
            <Button
              className="grow"
              variant={settings.isDrawing ? "default" : "outline"}
              onClick={() =>
                setSettings((prev) => ({ ...prev, isDrawing: !prev.isDrawing }))
              }
            >
              <MousePointerClick className="mr-2 h-4 w-4" />{" "}
              {settings.isDrawing
                ? "Mode Gambar: Aktif"
                : "Mode Gambar: Nonaktif"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={undoLastRoadPoint}
              disabled={!hasManualRoad}
            >
              <Undo className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          variant="destructive"
          className="w-full"
          onClick={clearRoad}
          disabled={!hasManualRoad && !hasAutoRoad}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Hapus Trase Jalan
        </Button>
      </CardContent>
    </Card>
  );
}
