import React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton Component
 * Generic, pulse-animated placeholder block for loading states.
 * Merges incoming Tailwind styles using standard `cn` utility.
 */
export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-200 dark:bg-zinc-800/60",
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:animate-shimmer",
        "before:bg-gradient-to-r",
        "before:from-transparent",
        "before:via-white/20",
        "before:to-transparent",
        className
      )}
      {...props}
    />
  );
}
