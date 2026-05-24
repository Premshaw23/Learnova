"use client";

// Shared shimmer animation for notice skeleton loader.
const shimmer =
  "relative overflow-hidden bg-slate-800/50 dark:bg-slate-700/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_linear_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent motion-safe:animate-[shimmer_1.8s_linear_infinite]";

/**
 * NoticeSkeleton
 * Reusable notice list loader with modern premium layout.
 *
 * @param {Object} props
 * @param {number} props.count
 * @param {string} props.className
 */
export default function NoticeSkeleton({ count = 5, className = "" }) {
  return (
    <section className={`space-y-6 ${className}`} aria-hidden="true">
      <div className={`overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/20 p-6 ${shimmer}`}>
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="h-6 w-48 rounded-full bg-slate-700/70 dark:bg-slate-600/60" />
            <div className="h-3 w-32 rounded-full bg-slate-700/60 dark:bg-slate-600/50" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="h-10 rounded-2xl bg-slate-700/60 dark:bg-slate-600/50" />
            <div className="h-10 rounded-2xl bg-slate-700/60 dark:bg-slate-600/50" />
            <div className="h-10 rounded-2xl bg-slate-700/60 dark:bg-slate-600/50" />
          </div>
        </header>

        <div className="grid gap-4">
          {Array.from({ length: count }).map((_, index) => (
            <article
              key={index}
              className="rounded-[1.75rem] border border-white/10 bg-slate-900/60 dark:bg-slate-900/70 p-5"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="h-4 w-40 rounded-full bg-slate-700/70 dark:bg-slate-600/60" />
                <div className="h-3 w-14 rounded-full bg-slate-700/60 dark:bg-slate-600/50" />
              </div>
              <div className="space-y-3">
                <div className="h-3 w-5/6 rounded-full bg-slate-700/60 dark:bg-slate-600/50" />
                <div className="h-3 w-full rounded-full bg-slate-700/50 dark:bg-slate-600/40" />
                <div className="h-3 w-4/6 rounded-full bg-slate-700/50 dark:bg-slate-600/40" />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="h-8 w-20 rounded-full bg-slate-700/60 dark:bg-slate-600/50" />
                <div className="h-8 w-24 rounded-full bg-slate-700/60 dark:bg-slate-600/50" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
