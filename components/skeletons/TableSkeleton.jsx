"use client";

// Shared shimmer animation for table skeletons.
const shimmer =
  "relative overflow-hidden bg-slate-800/50 dark:bg-slate-700/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_linear_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent motion-safe:animate-[shimmer_1.8s_linear_infinite]";

/**
 * TableSkeleton
 * Reusable table loading state with responsive header and rows.
 *
 * @param {Object} props
 * @param {number} props.rows
 * @param {number} props.columns
 * @param {string} props.className
 */
export default function TableSkeleton({ rows = 6, columns = 5, className = "" }) {
  const headerCells = Array.from({ length: columns });

  return (
    <section className={`w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/75 shadow-2xl shadow-black/20 ${shimmer} ${className}`} aria-hidden="true">
      <div className="p-5 border-b border-white/10">
        <div className="h-5 w-48 rounded-full bg-slate-700/70 dark:bg-slate-600/60 mb-4" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {headerCells.map((_, index) => (
            <div
              key={index}
              className="h-3 w-full rounded-full bg-slate-700/60 dark:bg-slate-600/50"
            />
          ))}
        </div>
      </div>

      <div className="divide-y divide-white/10">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4 p-5 items-center sm:grid-cols-5">
            <div className="h-4 w-full rounded-full bg-slate-700/60 dark:bg-slate-600/50 sm:col-span-2" />
            {headerCells.slice(1).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-4 w-full rounded-full bg-slate-700/50 dark:bg-slate-600/40"
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
