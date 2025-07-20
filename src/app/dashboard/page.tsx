// src/app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/Dashboard/DashboardContent"; // Komponen Klien Baru
import type { UserPayload, ApiDbGetAllStructuredDataResponse } from "@/types";

async function getDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    redirect("/login");
  }

  try {
    // Gunakan Vercel's fetch cache (revalidate every 5 minutes)
    const res = await fetch("/api/database", {
      headers: { Cookie: `token=${token.value}` },
      next: { revalidate: 300 }, // Cache selama 5 menit
    });

    if (!res.ok) {
      if (res.status === 401) redirect("/login");
      throw new Error("Failed to fetch server data.");
    }
    const serverData: ApiDbGetAllStructuredDataResponse = await res.json();
    return serverData;
  } catch (err) {
    console.error("Dashboard data fetching error:", err);
    // Mungkin redirect ke halaman error atau login
    redirect("/login");
  }
}

async function getUserData(): Promise<UserPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) redirect("/login");

  const res = await fetch("/api/auth/me", {
    headers: { Cookie: `token=${token.value}` },
    cache: "no-store", // User data should always be fresh
  });

  if (!res.ok) redirect("/login");

  return res.json();
}

export default async function DashboardPage() {
  const [serverData, userData] = await Promise.all([
    getDashboardData(),
    getUserData(),
  ]);

  const categories = Object.values(serverData.data);

  return <DashboardContent initialCategories={categories} user={userData} />;
}
