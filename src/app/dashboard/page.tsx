// src/app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserPayload, ApiDbGetAllStructuredDataResponse } from "@/types";
import { DashboardClient } from "@/components/DashboardPage"; // Komponen Klien Baru

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

export default async function DashboardPage() {
  // Ambil semua data yang dibutuhkan secara paralel
  const [userData, dbData] = await Promise.all([
    getUserData(),
    getDashboardData(),
  ]);

  return <DashboardClient user={userData} initialData={dbData} />;
}
