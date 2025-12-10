// src/app/kuliah/tools/docx-extractor/page.tsx
import { DocxExtractor } from "@/components/Tools/DocxExtractor";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DOCX to Photo Extractor - Erzysh",
  description:
    "Extract all images from a DOCX file and download them as a ZIP.",
};

export default function DocxExtractorPage() {
  return <DocxExtractor />;
}
