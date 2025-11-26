// src/app/kuliah/tools/kontur-trase-jalan/page.tsx
import { Metadata } from "next";
import ClientWrapper from "./ClientWrapper";

export const metadata: Metadata = {
  title: "Visualisasi Kontur & Trase Jalan",
  description:
    "Alat untuk menggambar peta kontur dan mensimulasikan trase jalan berdasarkan data ketinggian grid.",
};

export default function KonturTrasePage() {
  return <ClientWrapper />;
}
