// src/app/kuliah/tools/survey-dashboard/page.tsx
import { Metadata } from "next";
import SurveyDashboardClient from "./SurveyDashboardClient"; // Komponen ini akan kita buat selanjutnya

export const metadata: Metadata = {
  title: "Dashboard Survey",
  description: "Visualisasi dan analisis data kuis survey perjalanan.",
};

export default function SurveyDashboardPage() {
  return <SurveyDashboardClient />;
}