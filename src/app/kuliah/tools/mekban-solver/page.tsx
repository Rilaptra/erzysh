import MekbanSolver from "@/components/Tools/MekbanSolver";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MekaBahan Solver Pro - Erzysh",
  description: "Analisis Balok, SFD, BMD, dan Properti Penampang.",
};

export default function MekbanSolverPage() {
  return (
    <div className="bg-background min-h-screen p-4 md:p-8">
      <MekbanSolver />
    </div>
  );
}
