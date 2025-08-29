import DocxGeneratorPage from "@/components/Tools/PhotoFormatter";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Photo Formatter - Eryzsh",
  };
}

export default function PhotoFormatter() {
  return <DocxGeneratorPage admin={false} />;
}
