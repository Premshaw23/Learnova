"use client";
import React from "react";
import Skeleton from "@/components/ui/Skeleton";

/**
 * CoursesLoading Component
 * Next.js loading convention segment for the course directories.
 * Displays a structured layout including header titles, filter categories,
 * and a responsive grid of card placeholders.
 */
export default function CoursesLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 space-y-8 pt-24 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 -z-10 pointer-events-none" />

      {/* Directory Title and Search */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-slate-800/80" />
            <Skeleton className="h-4 w-72 bg-slate-800/50" />
          </div>
          <Skeleton className="h-10 w-full sm:w-64 bg-slate-800/60 rounded-xl" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-8 w-16 bg-slate-800/50 rounded-full" />
          <Skeleton className="h-8 w-24 bg-slate-800/50 rounded-full" />
          <Skeleton className="h-8 w-20 bg-slate-800/50 rounded-full" />
        </div>
      </div>

      {/* Responsive Grid of Course Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between backdrop-blur-md shadow-lg"
          >
            <div className="space-y-3">
              {/* Card Image Placeholder */}
              <Skeleton className="w-full h-40 bg-slate-800/70 rounded-xl" />

              {/* Category tag */}
              <Skeleton className="h-5 w-20 bg-slate-800/50 rounded-lg" />

              {/* Title */}
              <Skeleton className="h-6 w-3/4 bg-slate-800/80" />

              {/* Description */}
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3 w-full bg-slate-800/40" />
                <Skeleton className="h-3 w-5/6 bg-slate-800/40" />
              </div>
            </div>

            {/* Bottom info section */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-6 h-6 rounded-full bg-slate-800/60" />
                <Skeleton className="h-3.5 w-16 bg-slate-800/50" />
              </div>
              <Skeleton className="h-8 w-20 bg-slate-800/60 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
