// src/app/kuliah/tools/jembatan-balsa/page.tsx
import { Metadata } from "next";
import JembatanBalsaClient from "@/components/Tools/JembatanBalsa";

export const metadata: Metadata = {
  title: "Visualisasi Jembatan Balsa",
  description: "Simulator desain dan uji beban jembatan balsa.",
};

export default function JembatanBalsaPage() {
  return <JembatanBalsaClient />;
}