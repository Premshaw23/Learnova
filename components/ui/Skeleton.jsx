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
        "animate-pulse rounded-md bg-gray-200 dark:bg-zinc-800/60",
        className
      )}
      {...props}
    />
  );
}
