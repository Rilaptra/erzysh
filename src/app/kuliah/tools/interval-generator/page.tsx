// src/app/kuliah/tools/interval-generator/page.tsx
import { Metadata } from "next";
import IntervalGeneratorClient from "./IntervalGeneratorClient";

export const metadata: Metadata = {
  title: "Generator Interval & Jarak Khusus",
  description: "Menghasilkan angka di antara rentang tertentu dengan interval, serta menghitung jarak khusus.",
};

export default function IntervalGeneratorPage() {
  return <IntervalGeneratorClient />;
}
