import { Metadata } from "next";
import PdfLiteClient from "@/components/Tools/PdfLite";

export const metadata: Metadata = {
  title: "PDF Lite - Eryzsh",
  description: "Ultra-lightweight PDF Editor designed for performance.",
};

export default function PdfLitePage() {
  return <PdfLiteClient />;
}