"use client";

import * as React from "react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, value, trend, icon, className }: MetricCardProps) {
  return (
    <GlassCard className={cn("flex flex-col gap-4 p-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold tracking-tight text-white">{value}</div>
        {trend && (
          <div
            className={cn(
              "flex items-center text-sm font-medium",
              trend.isPositive ? "text-emerald-500" : "text-rose-500"
            )}
          >
            {trend.isPositive ? "+" : "-"}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </GlassCard>
  );
}
