"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { theme } from "@/lib/theme";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, interactive = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "quantum-card rounded-xl text-white",
          interactive && "quantum-card-interactive cursor-pointer",
          className
        )}
        {...(interactive ? theme.animations.hoverCard : {})}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
