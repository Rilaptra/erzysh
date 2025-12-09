import MekbanSolver from "@/components/Tools/MekbanSolver";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "MekaBahan Solver Pro - Eryzsh",
    description: "Analisis Balok, SFD, BMD, dan Properti Penampang.",
};

export default function MekbanSolverPage() {
    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <MekbanSolver />
        </div>
    );
}
