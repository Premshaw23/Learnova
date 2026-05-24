"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Floating back particles to add visual premium flair
const PARTICLES_DATA = [
  { id: 1, left: "12%", top: "20%", size: "w-2 h-2", delay: "0s", duration: "12s" },
  { id: 2, left: "68%", top: "72%", size: "w-3 h-3", delay: "1.5s", duration: "16s" },
  { id: 3, left: "85%", top: "15%", size: "w-2.5 h-2.5", delay: "3s", duration: "14s" },
  { id: 4, left: "30%", top: "68%", size: "w-1.5 h-1.5", delay: "4.5s", duration: "10s" },
  { id: 5, left: "75%", top: "40%", size: "w-2 h-2", delay: "6s", duration: "18s" },
];

/**
 * Custom 404 Page for Learnova.
 * Designed with a premium educational theme featuring a floating graduation cap SVG,
 * smooth animations, fully responsive viewport alignment, and native Dark Mode support.
 */
export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 px-6 py-16">
      
      {/* Background Interactive Lights / Gradients */}
      <div className="absolute inset-0 pointer-events-none -z-10 select-none">
        {/* Soft background radial orbs */}
        <div className="absolute top-1/4 left-1/4 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-[30rem] w-[30rem] translate-x-1/2 translate-y-1/2 rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-3xl" />
        
        {/* Particle layout */}
        <div className="absolute inset-0 overflow-hidden">
          {PARTICLES_DATA.map((particle) => (
            <div
              key={particle.id}
              className={`absolute rounded-full bg-indigo-500/20 dark:bg-indigo-400/20 animate-pulse`}
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size.split(" ")[0].replace("w-", "") * 4 + "px",
                height: particle.size.split(" ")[1].replace("h-", "") * 4 + "px",
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Card Content */}
      <div className="relative w-full max-w-xl mx-auto text-center space-y-8 z-10">
        
        {/* Premium floating educational SVG illustration (Graduation Cap floating above open Book) */}
        <div className="relative flex justify-center items-center h-48 group">
          {/* Subtle glowing halo */}
          <div className="absolute w-36 h-36 bg-indigo-500/5 dark:bg-indigo-400/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          
          <svg
            className="w-44 h-44 text-indigo-600 dark:text-indigo-400 drop-shadow-md hover:scale-105 transition-transform duration-300"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Floating graduation cap */}
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 9.5V14.5C6 16.5 8.5 17.5 12 17.5C15.5 17.5 18 16.5 18 14.5V9.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 7V13.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Open learning book */}
            <path
              d="M2 19.5C4.5 18.5 8.5 18.5 12 19.5C15.5 18.5 19.5 18.5 22 19.5V8.5C19.5 7.5 15.5 7.5 12 8.5C8.5 7.5 4.5 7.5 2 8.5V19.5Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 8.5V19.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Text Title & Subtitle */}
        <div className="space-y-3">
          <div className="inline-flex rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1 text-xs font-bold text-rose-500 tracking-wider uppercase">
            Error 404
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Lesson Not Found
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Oops! This lesson couldn&apos;t be found. It seems this path isn&apos;t in our curriculum.
          </p>
        </div>

        {/* Path Indicator */}
        <div className="inline-block rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-3 text-xs text-slate-500 dark:text-slate-400 backdrop-blur-sm shadow-sm select-all">
          Requested path: <code className="font-mono text-indigo-600 dark:text-indigo-400 ml-1 font-bold">{pathname}</code>
        </div>

        {/* CTAs / Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Back Home
          </Link>

          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 px-7 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}