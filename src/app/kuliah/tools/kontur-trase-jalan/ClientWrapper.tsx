"use client";

import dynamic from "next/dynamic";
import { KonturTraseSkeleton } from "@/components/Tools/KonturTraseJalan/KonturTraseSkeleton";

const KonturTraseClient = dynamic(() => import("./KonturTraseClient"), {
  ssr: false,
  loading: () => <KonturTraseSkeleton />,
});

export default function ClientWrapper() {
  return <KonturTraseClient />;
}
