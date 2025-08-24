// src/components/DashboardPage/ApiStatusWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { cn } from "@/lib/cn";

export const ApiStatusWidget = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => (res.ok ? setIsHealthy(true) : setIsHealthy(false)))
      .catch(() => setIsHealthy(false));
  }, []);

  const statusText =
    isHealthy === null ? "Checking..." : isHealthy ? "Healthy" : "Offline";
  const statusColor =
    isHealthy === null
      ? "text-yellow-400"
      : isHealthy
        ? "text-green-400"
        : "text-red-500";

  return (
    <Card className="bg-gunmetal/30 border-gunmetal/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-off-white flex items-center gap-2">
          <Zap className="text-teal-muted" />
          API Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-3 w-3 rounded-full",
              isHealthy === null
                ? "bg-yellow-400"
                : isHealthy
                  ? "animate-pulse bg-green-400"
                  : "bg-red-500",
            )}
          ></div>
          <span className={cn("font-bold", statusColor)}>{statusText}</span>
        </div>
      </CardContent>
    </Card>
  );
};
