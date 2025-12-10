// src/components/DashboardPage/StatCard.tsx
"use client";

import { cn } from "@/lib/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
  trend?: string; // Opsional: misal "+5% from last week"
}

export const StatCard = ({ title, value, icon, className }: StatCardProps) => {
  return (
    <div
      className={cn(
        "group border-border/50 bg-card/50 hover:border-primary/30 relative overflow-hidden rounded-2xl border p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      {/* Background Glow */}
      <div className="bg-primary/10 group-hover:bg-primary/20 absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl transition-colors" />

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <h3 className="text-foreground mt-2 text-3xl font-black tracking-tight">
            {value}
          </h3>
        </div>
        <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 group-hover:rotate-3">
          {icon}
        </div>
      </div>
    </div>
  );
};
