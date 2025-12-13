// src/app/database/page.tsx
import { Metadata } from "next";
import { DatabaseClient } from "@/components/DatabasePage/DatabaseClient";

export const metadata: Metadata = {
  title: "Database Manager",
  description: "Manage your containers, boxes, and collections on Discord.",
};

export default function DatabasePage() {
  return <DatabaseClient />;
}
