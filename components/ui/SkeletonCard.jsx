import React from "react";

/**
 * A highly reusable SkeletonCard component built with React and Tailwind CSS.
 * Offers smooth `animate-pulse` animations and full support for light and dark modes.
 * Displays a simulated image card layout including image container, thicker title,
 * multiple description lines, and an interactive footer area.
 */
const SkeletonCard = ({ className = "" }) => {
  return (
    <div
      className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm animate-pulse space-y-4 ${className}`}
    >
      {/* Image Placeholder */}
      <div className="w-full h-48 bg-slate-200 dark:bg-slate-800/80 rounded-xl flex items-center justify-center overflow-hidden">
        <svg
          className="w-12 h-12 text-slate-300 dark:text-slate-700"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Content Placeholders */}
      <div className="space-y-3">
        {/* Category / Tag Skeleton */}
        <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800/80 rounded-md" />

        {/* Title (Thicker line) */}
        <div className="h-6 w-3/4 bg-slate-300 dark:bg-slate-700/80 rounded-lg" />

        {/* Description (2-3 thinner lines) */}
        <div className="space-y-2 pt-1">
          <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800/80 rounded-md" />
          <div className="h-3.5 w-11/12 bg-slate-200 dark:bg-slate-800/80 rounded-md" />
          <div className="h-3.5 w-2/3 bg-slate-200 dark:bg-slate-800/80 rounded-md" />
        </div>
      </div>

      {/* Footer / Meta Area (Avatar + Button placeholder) */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center space-x-2">
          {/* Avatar circle */}
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800/80" />
          {/* Author Name */}
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800/80 rounded-md" />
        </div>
        {/* Action Button placeholder */}
        <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800/80 rounded-lg" />
      </div>
    </div>
  );
};

export default SkeletonCard;
