"use client";
import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export default function NoticesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-slate-800/80" />
        <Skeleton className="h-10 w-32 bg-slate-800/60 rounded-xl" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-3">
            <Skeleton className="h-6 w-3/4 bg-slate-800/80" />
            <Skeleton className="h-4 w-full bg-slate-800/50" />
            <Skeleton className="h-4 w-2/3 bg-slate-800/50" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16 bg-slate-800/60 rounded-full" />
              <Skeleton className="h-6 w-20 bg-slate-800/60 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
