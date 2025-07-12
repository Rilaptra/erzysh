"use client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { UserPayload } from "@/types";

interface DashboardHeaderProps {
  user: UserPayload | null;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
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
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="text-off-white/70 hover:bg-gunmetal hover:text-off-white"
      >
        <LogOut className="mr-2 size-4" />
        Logout
      </Button>
    </header>
  );
}
