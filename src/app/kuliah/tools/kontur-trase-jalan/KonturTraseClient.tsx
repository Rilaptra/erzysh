"use client";

import { Map, Loader2, Settings2, LayoutDashboard, Calculator } from "lucide-react";
import { useKonturProject } from "@/lib/hooks/useKonturProject";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { GridSettingsPanel } from "@/components/Tools/KonturTraseJalan/GridSettingsPanel";
import { VisualizationSettingsPanel } from "@/components/Tools/KonturTraseJalan/VisualizationSettingsPanel";
import { KonturCanvas } from "@/components/Tools/KonturTraseJalan/KonturCanvas";
import { InterpolationResults } from "@/components/Tools/KonturTraseJalan/InterpolationResults";
import { CrossSectionChart } from "@/components/Tools/KonturTraseJalan/CrossSectionChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

const KonturTraseSkeleton = () => (
  <main className="flex h-screen w-full items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4 text-muted-foreground">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-lg font-semibold">Memuat Studio...</p>
    </div>
  </main>
);

export default function KonturTraseClient() {
  const hasMounted = useHasMounted();

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

  if (!hasMounted) {
    return <KonturTraseSkeleton />;
  }

  const profileTitle = `Potongan Memanjang (Panjang: ${(
    profileData[profileData.length - 1]?.distance || 0
  ).toLocaleString("id-ID", { maximumFractionDigits: 2 })} cm)`;

  return (
    // Container Utama:
    // - Desktop: h-[calc(100vh-4rem)] agar pas di layar tanpa scroll body (diasumsikan header tinggi 4rem/64px)
    // - Mobile: h-auto agar bisa scroll panjang ke bawah
    <main className="flex flex-col bg-background p-2 lg:h-[calc(100vh-4rem)] lg:overflow-hidden lg:p-4">
      
      {/* Header Kecil */}
      <header className="mb-4 flex shrink-0 items-center gap-3 px-2">
        <div className="rounded-lg bg-teal-muted/10 p-2">
          <Map className="h-5 w-5 text-teal-muted" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none text-foreground md:text-xl">
            Studio Kontur & Trase
          </h1>
          <p className="hidden text-xs text-muted-foreground md:block">
            Simulasi pemetaan topografi dan analisis potongan jalan.
          </p>
        </div>
      </header>

      {/* 
        GRID LAYOUT UTAMA 
        - Mobile: Flex Column (satu per satu ke bawah)
        - Desktop (lg): Grid 12 Kolom
      */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto lg:grid lg:grid-cols-12 lg:overflow-hidden">
        
        {/* 
          PANEL KIRI: Settings & Tools 
          - Desktop: Kolom 1-3 (Lebar 25%)
          - Scrollable independen
        */}
        <div className="flex flex-col gap-4 lg:col-span-3 lg:h-full lg:overflow-y-auto pr-1">
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
        </div>

        {/* 
          PANEL TENGAH: Visualisasi (Canvas & Chart)
          - Desktop: Kolom 4-9 (Lebar 50%)
          - Flex Column: Atas Canvas, Bawah Chart
        */}
        <div className="flex flex-col gap-4 lg:col-span-6 lg:h-full lg:overflow-hidden">
          {/* Canvas Area - Flexible height */}
          <div className="min-h-[400px] flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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
            <div className="h-[300px] shrink-0 lg:h-[35%]">
              <CrossSectionChart profileData={profileData} title={profileTitle} />
            </div>
          )}
        </div>

        {/* 
          PANEL KANAN: Hasil Interpolasi 
          - Desktop: Kolom 10-12 (Lebar 25%)
          - Scrollable independen
          - Hidden di mobile (karena sudah ditaruh di bawah panel kiri biar gak scroll jauh banget ke bawah)
        */}
        <div className="hidden lg:col-span-3 lg:block lg:h-full lg:overflow-y-auto pl-1">
           <div className="sticky top-0 z-10 bg-background pb-4">
              <Card className="flex items-center gap-2 border-dashed bg-muted/50 p-3 text-sm font-medium text-muted-foreground">
                  <Calculator className="h-4 w-4" />
                  <span>Detail Perhitungan</span>
              </Card>
           </div>
           <InterpolationResults
                results={contourData.interpolationResults}
                gridDimension={settings.gridDimension}
            />
        </div>

      </div>
    </main>
  );
}