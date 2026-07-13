"use client";
import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-6 space-y-6">
      <div className="flex items-center gap-6">
        <Skeleton className="w-20 h-20 rounded-full bg-slate-800/80" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 bg-slate-800/80" />
          <Skeleton className="h-4 w-32 bg-slate-800/50" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-3">
            <Skeleton className="h-5 w-32 bg-slate-800/80" />
            <Skeleton className="h-4 w-full bg-slate-800/50" />
            <Skeleton className="h-4 w-3/4 bg-slate-800/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
