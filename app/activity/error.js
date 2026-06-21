"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { logger } from "@/lib/logger";

/**
 * Localized Error Boundary for Activity segment
 * Prevents errors inside app/activity routes from crashing the root layout.
 * Displays a clean panel card with recovery controls.
 */
export default function ActivityError({ error, reset }) {
  useEffect(() => {
    logger.error("Captured Activity Segment Error:", {
      error: error?.message || error,
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center p-8 min-h-[400px] w-full">
      <div className="w-full max-w-md p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg text-center space-y-6">
        <div className="inline-flex rounded-full bg-red-50 dark:bg-red-950/30 p-3 text-red-600 dark:text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
            Failed to load Activity view
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            An error occurred while loading this segment. You can try reloading
            this specific section.
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reload Segment
        </button>
      </div>
    </div>
  );
}
