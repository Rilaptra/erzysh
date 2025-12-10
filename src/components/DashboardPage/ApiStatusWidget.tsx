// src/components/DashboardPage/ApiStatusWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export const ApiStatusWidget = () => {
  const [status, setStatus] = useState<"loading" | "healthy" | "error">(
    "loading",
  );

  useEffect(() => {
    fetch("/api/health")
      .then((res) => (res.ok ? setStatus("healthy") : setStatus("error")))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="border-border/50 bg-card/50 flex items-center justify-between rounded-2xl border p-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            status === "healthy"
              ? "bg-green-500/10 text-green-500"
              : status === "error"
                ? "bg-red-500/10 text-red-500"
                : "bg-yellow-500/10 text-yellow-500",
          )}
        >
          {status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Zap className="h-5 w-5" />
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            System Status
          </p>
          <p
            className={cn(
              "leading-none font-bold",
              status === "healthy"
                ? "text-green-500"
                : status === "error"
                  ? "text-red-500"
                  : "text-yellow-500",
            )}
          >
            {status === "healthy"
              ? "All Systems Operational"
              : status === "error"
                ? "System Outage"
                : "Checking..."}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "h-2 w-2 animate-pulse rounded-full",
          status === "healthy"
            ? "bg-green-500"
            : status === "error"
              ? "bg-red-500"
              : "bg-yellow-500",
        )}
      />
    </div>
  );
};
