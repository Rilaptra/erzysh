// src/app/kuliah/tools/kontur-trase-jalan/KonturTraseClient.tsx
"use client";

import { useKonturProject } from "@/lib/hooks/useKonturProject";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { GridSettingsPanel } from "@/components/Tools/KonturTraseJalan/GridSettingsPanel";
import { VisualizationSettingsPanel } from "@/components/Tools/KonturTraseJalan/VisualizationSettingsPanel";
import { KonturCanvas } from "@/components/Tools/KonturTraseJalan/KonturCanvas";
import { InterpolationResults } from "@/components/Tools/KonturTraseJalan/InterpolationResults";
// +++ Import Komponen Baru +++
import { CrossSectionChart } from "@/components/Tools/KonturTraseJalan/CrossSectionChart";
import { CELL_SIZE } from "@/lib/utils/drawing";
import { Loader2 } from "lucide-react";

const KonturTraseSkeleton = () => (
  <main className="container mx-auto flex h-[80vh] max-w-7xl items-center justify-center px-4 py-8">
    <div className="text-muted-foreground flex flex-col items-center gap-4">
      <Loader2 className="text-primary h-10 w-10 animate-spin" />
      <p className="text-lg font-semibold">Memuat Proyek Kontur...</p>
      <p className="text-sm">Menyiapkan data dari sesi terakhir Anda.</p>
    </div>
  </main>
);

export default function KonturTraseClient() {
  const hasMounted = useHasMounted();

  const {
    project,
    settings,
    setProject, // Ambil setter utama
    setSettings,
    handleGridDataChange,
    adjustGrid,
    clearAllPoints,
    nestedInterpolationResults,
    profileData,
  } = useKonturProject();

  if (!hasMounted) {
    return <KonturTraseSkeleton />;
  }

  const canvasSize = {
    width: (project.gridSize.cols - 1) * CELL_SIZE,
    height: (project.gridSize.rows - 1) * CELL_SIZE,
  };

  const profileTitle = `Potongan Memanjang (Panjang: ${(profileData[profileData.length - 1]?.distance || 0).toFixed(2)} cm)`;

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 text-center">
        {/* ... (header tidak berubah) ... */}
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
            crossSectionLine={project.crossSectionLine}
            setProject={setProject}
            canvasSize={canvasSize}
          />
        </div>

        <div className="space-y-8 lg:col-span-3">
          <KonturCanvas
            gridSize={project.gridSize}
            gridData={project.gridData}
            contourInterval={settings.contourInterval}
            crossSectionLine={project.crossSectionLine}
            setProject={setProject}
          />
        </div>

        {profileData.length > 0 && (
          <div className="lg:col-span-3">
            <CrossSectionChart profileData={profileData} title={profileTitle} />
          </div>
        )}

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
