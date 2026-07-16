"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LoadingState({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[200px] w-full flex-col items-center justify-center gap-4", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
      />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

export function EmptyState({ title, description, action, className }: { title: string, description?: string, action?: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex min-h-[300px] w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm", className)}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium text-white">{title}</h3>
        {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry, className }: { title?: string, description?: string, onRetry?: () => void, className?: string }) {
  return (
    <div className={cn("flex min-h-[200px] w-full flex-col items-center justify-center gap-4 rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center backdrop-blur-sm", className)}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium text-destructive">{title}</h3>
        {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md bg-destructive/20 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/30 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
