// src/app/kuliah/tools/iut-calculator/page.tsx
import { Metadata } from "next";
import IUTCalculatorClient from "./IUTCalculatorClient"; // Komponen ini akan kita buat selanjutnya

export const metadata: Metadata = {
  title: "Kalkulator Ilmu Ukur Tanah",
  description: "Alat bantu hitung cepat untuk sudut dan koordinat Ilmu Ukur Tanah.",
};

export default function IUTCalculatorPage() {
  return <IUTCalculatorClient />;
}