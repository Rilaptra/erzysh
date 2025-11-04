// src/app/database/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/Dashboard/DashboardContent";
import type { UserPayload, ApiDbGetAllStructuredDataResponse } from "@/types";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Database Manager",
  description: "Manage your containers, boxes, and collections on Discord.",
  // openGraph dan twitter akan mewarisi dari root layout
};

async function getDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    redirect("/login");
  }

  try {
    console.log(process.env.NEXT_PUBLIC_APP_URL);
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
    return serverData;
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

export default async function DatabasePage() {
  const [serverData, userData] = await Promise.all([
    getDashboardData(),
    getUserData(),
  ]);

  const categories = Object.values(serverData.data);

  return <DashboardContent initialCategories={categories} user={userData} />;
}
