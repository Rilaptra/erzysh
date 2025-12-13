"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { DashboardContent } from "@/components/Database/DashboardContent";
import { DatabaseSkeleton } from "../DatabaseSkeleton";
import { toast } from "sonner";
import type { UserPayload, ApiDbGetAllStructuredDataResponse } from "@/types";
import { CheckCircle2, AlertCircle } from "lucide-react";

// Helper Fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DatabaseClient() {
  // 1. Fetch User Data
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useSWR<UserPayload>("/api/auth/me", fetcher);

  // 2. Fetch Database Structure
  const {
    data: dbData,
    isLoading: dbLoading,
    error: dbError,
  } = useSWR<ApiDbGetAllStructuredDataResponse>("/api/database", fetcher);

  // Toast Notification Logic
  useEffect(() => {
    // Check if loading started
    if (userLoading || dbLoading) {
      // Kita bisa show toast loading kalau mau, tapi karena ada Skeleton,
      // toast loading mungkin agak redundant. Tapi user minta "cool toast".
      // Jadi kita show toast pas SELESAI loading aja biar keren.
    }
  }, [userLoading, dbLoading]);

  // Effect untuk show success/error toast
  useEffect(() => {
    if (!userLoading && !dbLoading) {
      if (userError || dbError) {
        toast.error("Connection Failed", {
          description: "Could not sync with Discord Database.",
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        });
      } else if (userData && dbData) {
        toast.success("Database Connected", {
          description: "Successfully synced with Discord.",
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          duration: 2000,
        });
      }
    }
  }, [userLoading, dbLoading, userError, dbError, userData, dbData]);

  // Loading State -> Show Skeleton
  if (userLoading || dbLoading) {
    return (
      <>
        <DatabaseSkeleton />
        {/* Optional: Floating toast for loading status if really wanted */}
      </>
    );
  }

  // Error State or Guest fallback
  const user = userData || ({ username: "Guest" } as UserPayload);
  const categories = dbData?.data ? Object.values(dbData.data) : [];

  return <DashboardContent initialCategories={categories} user={user} />;
}
