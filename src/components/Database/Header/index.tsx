// src/components/Dashboard/Header/index.tsx
"use client";

import { LogOut, Menu, ChevronDown, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { UserPayload, UploadQueueItem } from "@/types";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UploadStatus } from "../UploadStatus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  user: UserPayload | null;
  uploadQueue: UploadQueueItem[];
  onMenuClick: () => void;
}

// Komponen Avatar sederhana jika belum ada di UI library
const UserAvatar = ({ username }: { username: string }) => {
  const initials = username.slice(0, 2).toUpperCase();
  return (
    <div className="bg-primary/10 text-primary group-hover:ring-primary/20 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-2 ring-transparent transition-all">
      {initials}
    </div>
  );
};

export function DashboardHeader({
  user,
  uploadQueue,
  onMenuClick,
}: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="z-20 flex h-16 shrink-0 items-center justify-between px-4 backdrop-blur-md sm:px-6">
      {/* LEFT SECTION: Logo & Mobile Menu */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <Database className="text-primary h-4 w-4" />
          </div>
          <span className="text-foreground hidden font-bold tracking-tight sm:inline-block">
            Database Browser
          </span>
        </div>
      </div>

      {/* RIGHT SECTION: Utilities & User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        <UploadStatus queue={uploadQueue} />

        <div className="bg-border/50 h-4 w-px" />

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="group hover:bg-muted/50 flex h-10 items-center gap-2 rounded-full pr-3 pl-2"
            >
              <UserAvatar username={user?.username || "??"} />
              <div className="hidden text-left text-xs sm:block">
                <p className="font-medium">{user?.username || "Guest"}</p>
              </div>
              <ChevronDown className="text-muted-foreground h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
