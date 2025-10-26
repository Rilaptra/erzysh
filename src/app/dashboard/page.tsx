// src/app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserPayload, ApiDbGetAllStructuredDataResponse } from "@/types";
import type { Tugas } from "@/types/tugas";
import { DashboardClient } from "@/components/DashboardPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview dashboard for schedules, tasks, and quick tools.",
  // openGraph dan twitter akan mewarisi dari root layout
  // Jika ingin gambar spesifik untuk halaman ini, tambahkan:
  // openGraph: {
  //   images: ["URL_GAMBAR_DASHBOARD_SPESIFIK"],
  // },
  // twitter: {
  //   images: ["URL_GAMBAR_DASHBOARD_SPESIFIK"],
  // },
};

async function getDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  if (!token) redirect("/login");

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/database`,
      {
        headers: { Cookie: `token=${token.value}` },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      if (res.status === 401) redirect("/login");
      throw new Error("Failed to fetch server data.");
    }
    const serverData: ApiDbGetAllStructuredDataResponse = await res.json();
    return Object.values(serverData.data);
  } catch (err) {
    console.error("Dashboard data fetching error:", err);
    redirect("/login");
  }
}

async function getUserData(): Promise<UserPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  if (!token) redirect("/login");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/me`,
    {
      headers: { Cookie: `token=${token.value}` },
      cache: "no-store",
    },
  );
  if (!res.ok) redirect("/login");
  return res.json();
}

async function getTugasData(): Promise<Tugas[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  const userID = cookieStore.get("x-user-id");
  if (!token) return [];

  try {
    const tugasRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/database/1409908765074919585/1409908859971309681?full=true`,
      {
        headers: { Cookie: `token=${token.value}; x-user-id=${userID?.value}` },
        cache: "no-store",
      },
    );
    if (!tugasRes.ok) return [];

    const { data } = await tugasRes.json();
    return data || [];
  } catch (e) {
    console.error("Failed to fetch tugas for dashboard:", e);
    return [];
  }
}

export default async function DashboardPage() {
  const [userData, dbData, tugasData] = await Promise.all([
    getUserData(),
    getDashboardData(),
    getTugasData(),
  ]);

  return (
    <DashboardClient
      user={userData}
      initialData={dbData}
      tugasList={tugasData}
    />
  );
}
