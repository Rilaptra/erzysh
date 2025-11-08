// src/components/Tools/KonturTraseJalan/VisualizationSettingsPanel.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RotateCw, MoveHorizontal, Maximize } from "lucide-react";
import { Point } from "@/lib/utils/marching-squares";

type SettingsState = {
  contourInterval: number;
  gridDimension: number;
};

type VisualizationSettingsPanelProps = {
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  crossSectionLine: { p1: Point; p2: Point };
  setProject: (updater: (prev: any) => any) => void;
  canvasSize: { width: number; height: number };
};

export function VisualizationSettingsPanel({
  settings,
  setSettings,
  crossSectionLine,
  setProject,
  canvasSize,
}: VisualizationSettingsPanelProps) {
  const { p1, p2 } = crossSectionLine;
  const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const handleSliderChange = (newLength: number, newAngle: number) => {
    setProject((prev) => {
      const rad = newAngle * (Math.PI / 180);
      const halfLen = newLength / 2;
      const newP1 = {
        x: center.x - halfLen * Math.cos(rad),
        y: center.y - halfLen * Math.sin(rad),
      };
      const newP2 = {
        x: center.x + halfLen * Math.cos(rad),
        y: center.y + halfLen * Math.sin(rad),
      };
      return { ...prev, crossSectionLine: { p1: newP1, p2: newP2 } };
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Atur Visualisasi & Potongan</CardTitle>
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
            <Maximize className="text-primary h-4 w-4" />
            Kontrol Garis Potongan
          </Label>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label htmlFor="angle-slider" className="flex items-center gap-1">
                <RotateCw className="size-3" /> Sudut
              </Label>
              <span>{angle.toFixed(1)}°</span>
            </div>
            <Slider
              id="angle-slider"
              min={-180}
              max={180}
              step={0.1}
              value={[angle]}
              onValueChange={(v) => handleSliderChange(length, v[0])}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label
                htmlFor="length-slider"
                className="flex items-center gap-1"
              >
                <MoveHorizontal className="size-3" /> Panjang
              </Label>
              <span>{length.toFixed(0)} px</span>
            </div>
            <Slider
              id="length-slider"
              min={10}
              max={Math.max(canvasSize.width, canvasSize.height)}
              step={1}
              value={[length]}
              onValueChange={(v) => handleSliderChange(v[0], angle)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
