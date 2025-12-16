import { Metadata } from "next";
import GhostBridge from "@/components/Tools/GhostBridge";

export const metadata: Metadata = {
  title: "Ghost Bridge - Remote File Access",
  description:
    "Akses file dari komputer utama secara remote melalui command bridge.",
};

export default function GhostBridgePage() {
  return <GhostBridge />;
}
