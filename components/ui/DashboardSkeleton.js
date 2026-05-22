import React from "react";

/**
 * DashboardSkeleton
 * Full-page loading skeleton for dashboard views.
 */

const DashboardSkeleton = () => {
  const shimmer =
    "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Section */}
            <div className="lg:col-span-2 space-y-8">

              {/* Stats */}
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">

                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`h-6 w-48 rounded bg-gray-700/50 ${shimmer}`}
                  />

                  <div
                    className={`h-5 w-5 rounded bg-gray-700/40 ${shimmer}`}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-4 border border-gray-700/30 bg-gray-800/40 ${shimmer}`}
                    >
                      <div className="h-7 w-12 rounded bg-gray-700/60 mb-2" />

                      <div className="h-3 w-16 rounded bg-gray-700/40" />
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div className="space-y-2">

                  <div className="flex justify-between">
                    <div
                      className={`h-3 w-36 rounded bg-gray-700/40 ${shimmer}`}
                    />

                    <div
                      className={`h-3 w-10 rounded bg-gray-700/40 ${shimmer}`}
                    />
                  </div>

                  <div
                    className={`w-full h-4 rounded-full bg-gray-700/30 ${shimmer}`}
                  />
                </div>
              </div>

              {/* Chart */}
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">

                <div
                  className={`h-6 w-40 rounded bg-gray-700/50 mb-6 ${shimmer}`}
                />

                <div
                  className={`w-full aspect-video min-h-[300px] rounded-xl bg-gray-800/50 border border-gray-700/50 p-6 flex flex-col justify-end ${shimmer}`}
                >
                  <div className="flex items-end gap-3 h-full">
                    {[65, 80, 45, 90, 55, 75, 60, 85].map(
                      (height, idx) => (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col justify-end"
                        >
                          <div
                            className="w-full rounded-t bg-gray-700/40"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
                >
                  <div
                    className={`h-5 w-36 rounded bg-gray-700/50 mb-6 ${shimmer}`}
                  />

                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className={`h-16 rounded-xl bg-gray-800/50 border border-gray-700/50 ${shimmer}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
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