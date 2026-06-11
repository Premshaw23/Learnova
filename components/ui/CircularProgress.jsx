"use client";

import React, { useEffect, useState } from "react";

/**
 * CircularProgress Component
 * Renders an animated circular completion progress ring using standard SVG elements.
 *
 * Props:
 * - value: Target completion percentage (0 - 100)
 * - size: Pixel size for height and width (default: 60)
 */
export default function CircularProgress({ value = 0, size = 60 }) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Slight delay to trigger smooth animation after component mounts
    const timer = setTimeout(() => {
      // Clamp value between 0 and 100
      const clampedValue = Math.min(Math.max(value, 0), 100);
      setAnimatedValue(clampedValue);
    }, 100);

    return () => clearTimeout(timer);
  }, [value]);

  const radius = 38;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (animatedValue / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(animatedValue)}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full -rotate-90 overflow-visible"
      >
        {/* Background Circle Track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-slate-100 dark:stroke-slate-800/80 fill-transparent transition-colors duration-300"
        />
        {/* Foreground Progress Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="stroke-indigo-600 dark:stroke-indigo-400 fill-transparent transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Central Percentage Value Text */}
      <span className="absolute text-xs md:text-sm font-black tracking-tight text-slate-800 dark:text-slate-100">
        {Math.round(animatedValue)}%
      </span>
    </div>
  );
}
