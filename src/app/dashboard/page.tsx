// src/app/dashboard/page.tsx
import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardPage";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview dashboard for schedules, tasks, and quick tools.",
};

export default function DashboardPage() {
  // Tidak ada lagi async await di sini!
  // Halaman langsung dikirim ke browser secepat kilat.
  // Data akan di-fetch oleh DashboardClient di sisi user.
  return <DashboardClient />;
}
