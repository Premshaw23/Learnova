"use client";

// Core shimmer animation used throughout skeleton loader components.
const shimmer =
  "relative overflow-hidden bg-slate-800/50 dark:bg-slate-700/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_linear_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent motion-safe:animate-[shimmer_1.8s_linear_infinite]";

const variantStyles = {
  dashboard: "rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/20",
  course: "rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-xl shadow-black/20",
  compact: "rounded-3xl border border-white/10 bg-slate-950/70 shadow-xl shadow-black/10",
  notice: "rounded-3xl border border-white/10 bg-slate-950/70 shadow-lg shadow-black/10",
};

/**
 * CardSkeleton
 * Reusable responsive card loader for dashboards, course cards, notices, and compact previews.
 *
 * @param {Object} props
 * @param {'dashboard'|'course'|'compact'|'notice'} props.variant
 * @param {number} props.count
 * @param {string} props.className
 */
export default function CardSkeleton({ variant = "dashboard", count = 3, className = "" }) {
  const gridClasses =
    variant === "course"
      ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
      : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`w-full ${gridClasses} ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className={`${variantStyles[variant] || variantStyles.dashboard} ${shimmer} p-5`}
        >
          <header className="flex items-center justify-between mb-5 gap-3">
            <div className="h-4 w-24 rounded-full bg-slate-700/70 dark:bg-slate-600/60" />
            <div className="h-3 w-16 rounded-full bg-slate-700/60 dark:bg-slate-600/50" />
          </header>

          <div className="space-y-4">
            <div className="h-40 rounded-[1.75rem] bg-slate-700/50 dark:bg-slate-600/40" />
            <div className="space-y-3">
              <div className="h-4 w-3/4 rounded-full bg-slate-700/60 dark:bg-slate-600/50" />
              <div className="h-3 w-1/2 rounded-full bg-slate-700/50 dark:bg-slate-600/40" />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, itemIndex) => (
              <div
                key={itemIndex}
                className="h-14 rounded-3xl bg-slate-700/50 dark:bg-slate-600/40"
              />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
