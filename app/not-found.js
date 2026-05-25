"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Floating background particles
const PARTICLES_DATA = [
  {
    id: 1,
    left: "12%",
    top: "20%",
    size: 8,
    delay: "0s",
    duration: "12s",
  },
  {
    id: 2,
    left: "68%",
    top: "72%",
    size: 12,
    delay: "1.5s",
    duration: "16s",
  },
  {
    id: 3,
    left: "85%",
    top: "15%",
    size: 10,
    delay: "3s",
    duration: "14s",
  },
  {
    id: 4,
    left: "30%",
    top: "68%",
    size: 6,
    delay: "4.5s",
    duration: "10s",
  },
  {
    id: 5,
    left: "75%",
    top: "40%",
    size: 8,
    delay: "6s",
    duration: "18s",
  },
];

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 select-none">
        
        {/* Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />

        <div className="absolute bottom-1/4 right-1/4 h-[30rem] w-[30rem] translate-x-1/2 translate-y-1/2 rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-3xl" />

        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {PARTICLES_DATA.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full bg-indigo-500/20 dark:bg-indigo-400/20 animate-pulse"
              style={{
                left: particle.left,
                top: particle.top,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">
        
        <div className="w-full max-w-2xl text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1 text-sm text-red-400">
            Error 404
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Lesson Not Found
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-md text-base leading-relaxed text-slate-500 dark:text-slate-400">
            Oops! This lesson couldn&apos;t be found.
            It seems this path isn&apos;t in our curriculum.
          </p>

          {/* Path Indicator */}
          <div className="inline-block rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-3 text-xs text-slate-500 dark:text-slate-400 backdrop-blur-sm shadow-sm select-all">
            Requested path:
            <code className="ml-1 font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {pathname}
            </code>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            
            {/* Home Button */}
            <Link
              href="/"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-105 hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/30 active:scale-95"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>

              Go Back Home
            </Link>

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>

              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}