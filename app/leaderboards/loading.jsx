"use client";
import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export default function LeaderboardsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-slate-800/80" />
        <Skeleton className="h-10 w-32 bg-slate-800/60 rounded-xl" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <Skeleton className="w-8 h-8 rounded-full bg-slate-800/60 shrink-0" />
            <Skeleton className="w-12 h-12 rounded-full bg-slate-800/80 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40 bg-slate-800/80" />
              <Skeleton className="h-3 w-24 bg-slate-800/50" />
            </div>
            <Skeleton className="h-8 w-16 bg-slate-800/60 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
