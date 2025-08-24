// src/components/DashboardPage/StatCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
}

export const StatCard = ({ title, value, icon, className }: StatCardProps) => {
  return (
    <Card
      className={cn(
        "bg-gunmetal/30 border-gunmetal/50 backdrop-blur-sm",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-off-white/80 text-sm font-medium">
          {title}
        </CardTitle>
        <div className="text-teal-muted">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-off-white text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};
