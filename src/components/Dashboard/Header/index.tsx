// src/components/Dashboard/Header/index.tsx
"use client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { UserPayload, UploadQueueItem } from "@/types";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UploadStatus } from "../UploadStatus"; // Impor UploadStatus

interface DashboardHeaderProps {
  user: UserPayload | null;
  uploadQueue: UploadQueueItem[]; // Tambahkan prop ini
}

export function DashboardHeader({ user, uploadQueue }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="border-gunmetal/50 bg-dark-shale/30 z-10 flex items-center justify-between border-b p-4 backdrop-blur-sm">
      <h1 className="text-off-white text-xl font-semibold">
        Welcome,{" "}
        <span className="text-teal-muted">{user?.username || "User"}</span>
      </h1>
      <div className="flex items-center gap-2">
        <UploadStatus queue={uploadQueue} />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-off-white/70 hover:bg-gunmetal hover:text-off-white"
        >
          <LogOut className="mr-2 size-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
