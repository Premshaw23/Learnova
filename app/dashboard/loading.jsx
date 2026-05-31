"use client";
import React from "react";
import Skeleton from "@/components/ui/Skeleton";
import SkeletonCard from "@/components/SkeletonCard";

/**
 * DashboardLoading Component
 * Next.js loading segment for the dashboard pages.
 * Displays structural grid skeletons mimicking widgets, charts, and data panels to prevent CLS.
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 space-y-8 pt-24 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-slate-950 to-slate-950 -z-10 pointer-events-none" />

      {/* Header skeleton */}
      <div className="max-w-7xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl bg-slate-800/80" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 bg-slate-800/80" />
            <Skeleton className="h-3.5 w-60 bg-slate-800/50" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28 bg-slate-800/60 rounded-xl" />
          <Skeleton className="h-10 w-10 bg-slate-800/60 rounded-xl" />
        </div>
      </div>

      {/* Main Grid skeleton */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left main content widgets */}
        <div className="md:col-span-2 space-y-6">
          {/* Card containing mini widgets */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32 bg-slate-800/80" />
              <Skeleton className="h-4 w-16 bg-slate-800/60" />
           </div>
         {/* 👇 Updated to a 3-column layout showcasing your beautiful skeleton cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
         </div>
        </div>

          {/* List panel */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <Skeleton className="h-6 w-48 bg-slate-800/80" />
            <div className="space-y-3">
              <Skeleton className="h-12 bg-slate-800/50 rounded-xl" />
              <Skeleton className="h-12 bg-slate-800/50 rounded-xl" />
              <Skeleton className="h-12 bg-slate-800/50 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right sidebar widgets */}
        <div className="space-y-6">
          {/* Sidebar widget 1 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <Skeleton className="h-6 w-36 bg-slate-800/80" />
            <Skeleton className="h-40 bg-slate-800/60 rounded-xl" />
          </div>

          {/* Sidebar widget 2 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full bg-slate-800/80" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full bg-slate-800/80" />
                <Skeleton className="h-3 w-2/3 bg-slate-800/50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}