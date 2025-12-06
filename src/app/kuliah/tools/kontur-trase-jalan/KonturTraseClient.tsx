"use client";

import { Map, Settings2, LayoutDashboard, Calculator } from "lucide-react";
import { useKonturProject } from "@/lib/hooks/useKonturProject";
import { GridSettingsPanel } from "@/components/Tools/KonturTraseJalan/GridSettingsPanel";
import { VisualizationSettingsPanel } from "@/components/Tools/KonturTraseJalan/VisualizationSettingsPanel";
import { KonturCanvas } from "@/components/Tools/KonturTraseJalan/KonturCanvas";
import { InterpolationResults } from "@/components/Tools/KonturTraseJalan/InterpolationResults";
import { CrossSectionChart } from "@/components/Tools/KonturTraseJalan/CrossSectionChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default function KonturTraseClient() {
  const {
    project,
    settings,
    contourData,
    setProject,
    setSettings,
    handleGridDataChange,
    adjustGrid,
    clearAllPoints,
    parseAndSetGridData,
    handleExportToExcel,
    profileData,
    handleCalculateContours,
    resetCrossSectionLine,
    elevationOptions,
    updateCrossSectionPointByValue,
    targetElevation,
    setTargetElevation,
    pointToMove,
    setPointToMove,
    searchDirection,
    setSearchDirection,
    findAndMovePointToElevation,
    targetElevationSuggestions,
  } = useKonturProject();

  const maxDistance = profileData[profileData.length - 1]?.distance || 0;
  const profileTitle = `Potongan Memanjang (Panjang: ${maxDistance.toLocaleString(
    "id-ID",
    { maximumFractionDigits: 2 },
  )} cm)`;

  return (
    <main className="bg-background flex min-h-screen flex-col gap-3 p-1.5 lg:gap-4 lg:p-4">
      {/* Header Kecil */}
      <header className="mb-2 flex shrink-0 items-center gap-2 px-1 lg:mb-4 lg:gap-3 lg:px-2">
        <div className="bg-teal-muted/10 rounded-lg p-1.5 lg:p-2">
          <Map className="text-teal-muted h-4 w-4 lg:h-5 lg:w-5" />
        </div>
        <div>
          <h1 className="text-foreground text-base leading-none font-bold md:text-xl lg:text-lg">
            Studio Kontur & Trase
          </h1>
          <p className="text-muted-foreground hidden text-xs md:block">
            Simulasi pemetaan topografi dan analisis potongan jalan.
          </p>
        </div>
      </header>

      {/* 
        GRID LAYOUT UTAMA 
        - Mobile: Flex Column (satu per satu ke bawah)
        - Desktop (lg): Grid 12 Kolom
      */}
      <div className="flex flex-1 flex-col gap-3 lg:grid lg:grid-cols-12 lg:gap-4">
        {/* 
          PANEL KIRI: Settings & Tools 
          - Desktop: Kolom 1-3 (Lebar 25%)
          - Scrollable independen
        */}
        <aside className="flex flex-col gap-3 pr-0 lg:top-4 lg:col-span-3 lg:gap-4 lg:overflow-y-auto lg:pr-1">
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Grid
              </TabsTrigger>
              <TabsTrigger value="vis">
                <Settings2 className="mr-2 h-4 w-4" /> Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="mt-4 space-y-4">
              <GridSettingsPanel
                gridSize={project.gridSize}
                gridData={project.gridData}
                adjustGrid={adjustGrid}
                handleGridDataChange={handleGridDataChange}
                clearAllPoints={clearAllPoints}
                parseAndSetGridData={parseAndSetGridData}
                handleExportToExcel={handleExportToExcel}
              />
            </TabsContent>

            <TabsContent value="vis" className="mt-4 space-y-4">
              <VisualizationSettingsPanel
                settings={settings}
                setSettings={setSettings}
                elevationOptions={elevationOptions}
                updateCrossSectionPointByValue={updateCrossSectionPointByValue}
                onCalculateContours={handleCalculateContours}
                onResetCrossSection={resetCrossSectionLine}
                targetElevation={targetElevation}
                setTargetElevation={setTargetElevation}
                pointToMove={pointToMove}
                setPointToMove={setPointToMove}
                searchDirection={searchDirection}
                setSearchDirection={setSearchDirection}
                findAndMovePointToElevation={findAndMovePointToElevation}
                targetElevationSuggestions={targetElevationSuggestions}
              />
            </TabsContent>
          </Tabs>

          {/* Tampilkan Hasil Interpolasi di Bawah Panel Kiri pada Mobile agar urutannya enak */}
          <div className="lg:hidden">
            <InterpolationResults
              results={contourData.interpolationResults}
              gridDimension={settings.gridDimension}
            />
          </div>
        </aside>

        {/* 
          PANEL TENGAH: Visualisasi (Canvas & Chart)
          - Desktop: Kolom 4-9 (Lebar 50%)
          - Flex Column: Atas Canvas, Bawah Chart
        */}
        <div className="flex flex-col gap-3 lg:col-span-9 lg:gap-4">
          {/* Canvas Area - Flexible height */}
          <div className="max-h-[400px] min-h-[280px] flex-1 overflow-hidden sm:min-h-[350px] lg:max-h-none lg:min-h-[400px]">
            <KonturCanvas
              gridSize={project.gridSize}
              gridData={project.gridData}
              contourPaths={contourData.paths}
              crossSectionLine={project.crossSectionLine}
              setProject={setProject}
            />
          </div>

          {/* Chart Area - Fixed height di desktop, auto di mobile */}
          {profileData.length > 0 && (
            <div className="h-[200px] shrink-0 sm:h-[250px] lg:h-[35%]">
              <CrossSectionChart
                profileData={profileData}
                title={profileTitle}
              />
            </div>
          )}
        </div>

        {/* 
          PANEL KANAN: Hasil Interpolasi 
          - Desktop: Kolom 10-12 (Lebar 25%)
          - Scrollable independen
          - Hidden di mobile (karena sudah ditaruh di bawah panel kiri biar gak scroll jauh banget ke bawah)
        */}
        <div className="hidden flex-col gap-4 pt-4 pl-0 lg:col-span-12 lg:flex lg:pl-1">
          <Card className="bg-muted/50 text-muted-foreground flex items-center gap-2 border-dashed p-3 text-sm font-medium">
            <Calculator className="h-4 w-4" />
            <span>Detail Perhitungan</span>
          </Card>
          <InterpolationResults
            results={contourData.interpolationResults}
            gridDimension={settings.gridDimension}
          />
        </div>
      </div>
    </main>
  );
}
