"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, Home, Sparkles, BookOpen } from "lucide-react";

const PARTICLES = [
  { id: 1, left: "15%", top: "25%", size: 6, delay: "0s", duration: "10s" },
  { id: 2, left: "75%", top: "70%", size: 10, delay: "2s", duration: "15s" },
  { id: 3, left: "80%", top: "20%", size: 8, delay: "4s", duration: "12s" },
  { id: 4, left: "25%", top: "75%", size: 5, delay: "1s", duration: "8s" },
];

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center transition-colors duration-500">
      
      {/* Background Decorative Glow and Particles */}
      <div className="absolute inset-0 pointer-events-none -z-10 select-none">
        {/* Colorful Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 h-[35rem] w-[35rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-[35rem] w-[35rem] translate-x-1/2 translate-y-1/2 rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-3xl" />

        {/* Ambient Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-indigo-500/20 dark:bg-indigo-400/25 animate-pulse"
              style={{
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content Card Container */}
      <div className="max-w-2xl w-full text-center px-6 py-12 relative z-10 space-y-8 animate-fadeIn">
        
        {/* Educational Graphic Icon with Radial Glow */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-indigo-500/5">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl opacity-10 animate-pulse" />
          <GraduationCap className="w-14 h-14 text-indigo-500 dark:text-indigo-400" />
          <Sparkles className="w-5 h-5 text-purple-500 absolute -top-1 -right-1 animate-bounce" />
        </div>

        {/* Branded Typography Header */}
        <div className="space-y-3">
          <div className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4.5 py-1.5 text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest backdrop-blur-xs select-none">
            Error 404
          </div>
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Oops! Looks like this page got lost in the library.
          </h2>
          <p className="max-w-md mx-auto text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            The resource you are looking for has been moved, archived, or does not exist in our system directory.
          </p>
        </div>

        {/* Current Path Indicator Tag */}
        {pathname && (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 backdrop-blur-md shadow-inner select-all">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">Broken Path:</span>
            <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {pathname}
            </code>
          </div>
        )}

        {/* Navigation Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {/* Go Back Home */}
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-650 to-indigo-700 hover:brightness-105 active:scale-95 text-white font-bold py-3.5 px-8 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10 transition-all duration-300 select-none group"
          >
            <Home className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            Return to Safety
          </Link>

          {/* Go to Dashboard */}
          <Link
            href="/student/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-95 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-8 shadow-md transition-all duration-300 select-none group"
          >
            <BookOpen className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
