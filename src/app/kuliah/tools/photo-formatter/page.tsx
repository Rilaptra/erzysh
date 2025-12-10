import DocxGeneratorPage from "@/components/Tools/PhotoFormatter";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Photo Formatter - Erzysh",
  };
}

export default function PhotoFormatter() {
  return <DocxGeneratorPage admin={false} />;
}
