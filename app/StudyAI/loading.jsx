"use client";
import React from "react";
import Skeleton from "@/components/ui/Skeleton";

export default function StudyAILoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl bg-slate-800/80" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40 bg-slate-800/80" />
            <Skeleton className="h-4 w-64 bg-slate-800/50" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 bg-slate-800/60 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-slate-800/60 rounded-xl" />
          ))}
        </div>
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-64 w-full bg-slate-800/70 rounded-2xl" />
          <Skeleton className="h-32 w-full bg-slate-800/50 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
