import React from "react";
import CardSkeleton from "@/components/skeletons/CardSkeleton";
import TableSkeleton from "@/components/skeletons/TableSkeleton";

/**
 * DashboardSkeleton
 * Full-page loading skeleton for dashboard views.
 */

const DashboardSkeleton = () => {
  const shimmer =
    "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_linear_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden animate-pulse">
      
      {/* Background Glow */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none" />

      <div className="relative z-10">

        {/* Header Skeleton */}
        <div className="max-w-7xl mx-auto pt-20 pb-6 px-6">
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

              {/* Profile */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gray-700/60 ${shimmer}`}
                />

                <div className="space-y-2">
                  <div
                    className={`h-5 w-40 rounded bg-gray-700/60 ${shimmer}`}
                  />

                  <div
                    className={`h-3 w-52 rounded bg-gray-700/40 ${shimmer}`}
                  />
                </div>
              </div>

              {/* Time */}
              <div className="text-right space-y-2">
                <div
                  className={`h-5 w-20 rounded bg-gray-700/50 ml-auto ${shimmer}`}
                />

                <div
                  className={`h-3 w-28 rounded bg-gray-700/40 ml-auto ${shimmer}`}
                />
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">

              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-24 rounded bg-gray-700/40 ${shimmer}`}
                />

                <div
                  className={`h-7 w-28 rounded-lg bg-gray-700/30 ${shimmer}`}
                />
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-32 rounded bg-gray-700/40 ${shimmer}`}
                />

                <div className="w-2 h-2 bg-gray-600 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 space-y-8">

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.8fr,1fr]">
            <div className="space-y-8">
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className={`h-6 w-48 rounded bg-gray-700/50 ${shimmer}`} />
                    <div className={`h-3 w-32 rounded bg-gray-700/40 ${shimmer}`} />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className={`h-10 w-24 rounded-2xl bg-gray-700/50 ${shimmer}`} />
                    <div className={`h-10 w-28 rounded-2xl bg-gray-700/50 ${shimmer}`} />
                  </div>
                </div>
              </div>

              <CardSkeleton variant="compact" count={3} />

              <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className={`h-6 w-40 rounded bg-gray-700/50 mb-6 ${shimmer}`} />
                <TableSkeleton rows={5} columns={4} />
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className={`h-5 w-36 rounded bg-gray-700/50 mb-6 ${shimmer}`} />
                <div className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className={`h-20 rounded-3xl bg-gray-800/50 border border-gray-700/50 ${shimmer}`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className={`h-5 w-28 rounded bg-gray-700/50 mb-6 ${shimmer}`} />
                <CardSkeleton variant="notice" count={2} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shimmer Animation */}
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardSkeleton;