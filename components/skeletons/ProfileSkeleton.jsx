"use client";

// Shared shimmer animation for profile skeleton loader.
const shimmer =
  "relative overflow-hidden bg-slate-800/50 dark:bg-slate-700/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_linear_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent motion-safe:animate-[shimmer_1.8s_linear_infinite]";

/**
 * ProfileSkeleton
 * Full-screen skeleton loader for profile pages and user dashboards.
 *
 * @param {Object} props
 * @param {string} props.className
 */
export default function ProfileSkeleton({ className = "" }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black ${className}`} aria-hidden="true">
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <section className={`overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/20 p-6 ${shimmer}`}>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-5">
              <div className="h-28 w-28 rounded-full bg-slate-700/60 dark:bg-slate-600/50" />
              <div className="space-y-3">
                <div className="h-6 w-44 rounded-full bg-slate-700/60 dark:bg-slate-600/50" />
                <div className="h-4 w-32 rounded-full bg-slate-700/50 dark:bg-slate-600/40" />
                <div className="h-3 w-24 rounded-full bg-slate-700/50 dark:bg-slate-600/40" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 rounded-3xl bg-slate-700/50 dark:bg-slate-600/40"
                />
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-3xl bg-slate-700/50 dark:bg-slate-600/40 p-4">
                <div className="h-4 w-24 rounded-full bg-slate-600/80 dark:bg-slate-500/70 mb-4" />
                <div className="space-y-3">
                  <div className="h-3 w-full rounded-full bg-slate-700/50 dark:bg-slate-600/40" />
                  <div className="h-3 w-5/6 rounded-full bg-slate-700/50 dark:bg-slate-600/40" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 space-y-4">
            <div className="h-4 w-36 rounded-full bg-slate-700/70 dark:bg-slate-600/60" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-16 rounded-[1.75rem] bg-slate-700/50 dark:bg-slate-600/40"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
