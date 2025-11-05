// src/app/kuliah/tools/kontur-trase-jalan/KonturTraseClient.tsx
"use client";

import { Map, Loader2 } from "lucide-react";
import { useKonturProject } from "@/lib/hooks/useKonturProject";
import { useHasMounted } from "@/lib/hooks/useHasMounted"; // ✨ Impor hook baru kita
import { GridSettingsPanel } from "@/components/Tools/KonturTraseJalan/GridSettingsPanel";
import { VisualizationSettingsPanel } from "@/components/Tools/KonturTraseJalan/VisualizationSettingsPanel";
import { KonturCanvas } from "@/components/Tools/KonturTraseJalan/KonturCanvas";
import { InterpolationResults } from "@/components/Tools/KonturTraseJalan/InterpolationResults";

// ✨ Komponen untuk loading state
const KonturTraseSkeleton = () => (
  <main className="container mx-auto flex h-[80vh] max-w-7xl items-center justify-center px-4 py-8">
    <div className="flex flex-col items-center gap-4 text-muted-foreground">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-lg font-semibold">Memuat Proyek Kontur...</p>
      <p className="text-sm">Menyiapkan data dari sesi terakhir Anda.</p>
    </div>
  </main>
);


export default function KonturTraseClient() {
  const hasMounted = useHasMounted(); // ✨ Panggil hook-nya
  
  const {
    project,
    settings,
    autoRoadPaths,
    setSettings,
    handleGridDataChange,
    adjustGrid,
    clearAllPoints,
    clearRoad,
    undoLastRoadPoint,
    addRoadPoint,
    handleGenerateAutoRoad,
    nestedInterpolationResults,
  } = useKonturProject();

  // ✨ Ini dia Mount Guard-nya!
  // Jika komponen belum "mounted" di client, tampilkan skeleton/loading.
  // Ini memastikan render pertama di client SAMA PERSIS dengan render di server.
  if (!hasMounted) {
    return <KonturTraseSkeleton />;
  }

  // Setelah mounted, baru kita render UI yang sebenarnya dengan data dari localStorage.
  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-bold">
          <Map className="text-primary" /> Visualisasi Kontur & Trase Jalan
        </h1>
        <p className="text-muted-foreground mt-2">
          Input data ketinggian, atur parameter, dan gambar trase jalan untuk visualisasi real-time.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <GridSettingsPanel
            gridSize={project.gridSize}
            gridData={project.gridData}
            adjustGrid={adjustGrid}
            handleGridDataChange={handleGridDataChange}
            clearAllPoints={clearAllPoints}
          />
        </div>
        <div className="space-y-6 lg:col-span-1">
          <VisualizationSettingsPanel
            settings={settings}
            setSettings={setSettings}
            handleGenerateAutoRoad={handleGenerateAutoRoad}
            undoLastRoadPoint={undoLastRoadPoint}
            clearRoad={clearRoad}
            hasManualRoad={project.roadPath.length > 0}
            hasAutoRoad={autoRoadPaths.length > 0}
          />
        </div>

        <div className="space-y-8 lg:col-span-3">
          <KonturCanvas
            gridSize={project.gridSize}
            gridData={project.gridData}
            roadPath={project.roadPath}
            autoRoadPaths={autoRoadPaths}
            contourInterval={settings.contourInterval}
            autoRoadWidth={settings.autoRoadWidth}
            isDrawing={settings.isDrawing}
            onCanvasClick={addRoadPoint}
          />
        </div>

        <div className="space-y-6 lg:col-span-3">
          <InterpolationResults
            results={nestedInterpolationResults}
            gridDimension={settings.gridDimension}
          />
        </div>
      </div>
    </main>
  );
}