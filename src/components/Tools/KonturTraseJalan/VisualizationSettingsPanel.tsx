// src/components/Tools/KonturTraseJalan/VisualizationSettingsPanel.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Maximize, RotateCcw, Crosshair } from "lucide-react";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { SearchDirection } from "@/lib/hooks/useKonturProject";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { useState } from "react";

type SettingsState = {
  contourInterval: number;
  gridDimension: number;
};

type VisualizationSettingsPanelProps = {
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  elevationOptions: ComboboxOption[]; // +++ GANTI PROP +++
  updateCrossSectionPointByValue: (
    // +++ GANTI PROP +++
    pointKey: "p1" | "p2",
    selectedValue: string,
  ) => void;
  onCalculateContours: () => void;
  onResetCrossSection: () => void;
  targetElevation: string;
  setTargetElevation: (value: string) => void;
  pointToMove: "p1" | "p2";
  setPointToMove: (value: "p1" | "p2") => void;
  findAndMovePointToElevation: () => void;
  searchDirection: SearchDirection;
  setSearchDirection: (value: SearchDirection) => void;
  targetElevationSuggestions: ComboboxOption[];
};

// +++ BUAT DATA OPSI UNTUK COMBOBOX BARU +++
const pointOptions: ComboboxOption[] = [
  { value: "p1", label: "P1 (Titik Awal)" },
  { value: "p2", label: "P2 (Titik Akhir)" },
];

const directionOptions: ComboboxOption[] = [
  { value: "atas", label: "Ke Atas" },
  { value: "bawah", label: "Ke Bawah" },
  { value: "kiri", label: "Ke Kiri" },
  { value: "kanan", label: "Ke Kanan" },
  { value: "sepanjang_garis_p1_p2", label: "Sepanjang Garis (dari P1)" },
  { value: "sepanjang_garis_p2_p1", label: "Sepanjang Garis (dari P2)" },
];

export function VisualizationSettingsPanel({
  settings,
  setSettings,
  onCalculateContours,
  onResetCrossSection,
  elevationOptions,
  updateCrossSectionPointByValue,
  // +++
  targetElevation,
  setTargetElevation,
  findAndMovePointToElevation,
  searchDirection,
  setSearchDirection,
  targetElevationSuggestions,
  pointToMove,
  setPointToMove,
}: VisualizationSettingsPanelProps) {
  const [pointElevation, setPointElevation] = useState<{
    p1: string;
    p2: string;
  }>({ p1: "", p2: "" });

  const handleSetPoint = (pointKey: "p1" | "p2", value: string) => {
    updateCrossSectionPointByValue(pointKey, value);
    setPointElevation((prev) => ({
      ...prev,
      [pointKey]: value,
    }));
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

        <Button className="w-full" onClick={onCalculateContours}>
          <span className="flex flex-nowrap gap-2">
            <Sparkles className="h-4 w-4" />
            Hitung & Gambar Kontur
          </span>
        </Button>

        <div className="space-y-4 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 font-semibold">
              <Maximize className="text-primary h-4 w-4" />
              Kontrol Garis Potongan
            </Label>
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-fit px-2"
              onClick={onResetCrossSection}
              title="Reset Posisi Garis"
            >
              <span className="flex w-full flex-nowrap items-center gap-2">
                Reset
                <RotateCcw className="h-4 w-4" />
              </span>
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p1-elevation">Titik Awal (P1) - Elevasi</Label>
            <Combobox
              options={elevationOptions}
              value={""}
              onChange={(value) => handleSetPoint("p1", value)}
              placeholder="Ketik/pilih elevasi..."
              emptyMessage="Elevasi tidak ditemukan."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p2-elevation">Titik Akhir (P2) - Elevasi</Label>
            <Combobox
              options={elevationOptions}
              value={""}
              onChange={(value) => handleSetPoint("p2", value)}
              placeholder="Ketik/pilih elevasi..."
              emptyMessage="Elevasi tidak ditemukan."
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Button
            variant="outline"
            onClick={() =>
              updateCrossSectionPointByValue("p1", pointElevation.p1)
            }
            >
              Pindahkan P1 ke Elevasi
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                updateCrossSectionPointByValue("p2", pointElevation.p2)
              }
            >
              Pindahkan P2 ke Elevasi
            </Button>
          </div>
        </div>

        {/* +++ UI BARU DENGAN ACCORDION DAN COMBOBOX +++ */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="precision-mode">
            <AccordionTrigger className="border border-dashed px-4 text-base font-semibold">
              <div className="flex items-center gap-2">
                <Crosshair className="text-primary h-5 w-5" />
                Mode Presisi
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="space-y-4 rounded-md border border-dashed p-4">
                <div className="space-y-2">
                  <Label>Pindahkan Titik</Label>
                  <Combobox
                    options={pointOptions}
                    value={pointToMove}
                    onChange={(v) => setPointToMove(v as "p1" | "p2")}
                    placeholder="Pilih titik..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arah Pencarian</Label>
                  <Combobox
                    options={directionOptions}
                    value={searchDirection}
                    onChange={(v) => setSearchDirection(v as SearchDirection)}
                    placeholder="Pilih arah..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-elevation">Elevasi Target (m)</Label>
                  <Combobox
                    options={[]} // Opsi utama dikosongkan, kita pakai children
                    value={targetElevation}
                    onChange={setTargetElevation}
                    placeholder="Ketik atau pilih elevasi..."
                  >
                    <CommandGroup heading="Saran Cerdas">
                      {targetElevationSuggestions.map((suggestion) => (
                        <CommandItem
                          key={suggestion.label}
                          value={suggestion.value}
                          onSelect={() => setTargetElevation(suggestion.value)}
                        >
                          {suggestion.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Combobox>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={findAndMovePointToElevation}
                >
                  Cari & Pindahkan
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
