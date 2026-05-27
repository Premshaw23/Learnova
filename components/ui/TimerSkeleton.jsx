import React from "react";

/**
 * TimerSkeleton – animated placeholder for timer/productivity page
 * Used for focus, Pomodoro, and task management pages
 */
const TimerSkeleton = () => {
  const shimmer =
    "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black space-y-8 py-8">
      {/* Header Skeleton */}
      <div className="container mx-auto px-4 space-y-3">
        <div className={`h-8 w-48 bg-gray-700/60 rounded-lg ${shimmer}`} />
        <div className={`h-4 w-96 bg-gray-700/40 rounded ${shimmer}`} />
      </div>

      {/* Main Timer Section */}
      <div className="container mx-auto px-4">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8 space-y-6">
          {/* Timer Display Skeleton */}
          <div className="flex justify-center">
            <div
              className={`h-40 w-40 rounded-full bg-gray-700/50 ${shimmer}`}
              style={{ animationDelay: "0ms" }}
            />
          </div>

          {/* Mode Buttons Skeleton */}
          <div className="flex justify-center gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-10 w-24 rounded-lg bg-gray-700/40 ${shimmer}`}
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>

          {/* Control Buttons Skeleton */}
          <div className="flex justify-center gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-12 w-12 rounded-full bg-gray-700/50 ${shimmer}`}
                style={{ animationDelay: `${150 + i * 50}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks Column */}
          <div className="lg:col-span-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
            <div className={`h-6 w-32 bg-gray-700/60 rounded ${shimmer}`} />

            {/* Task Items */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 border border-white/10 rounded-lg space-y-3"
              >
                <div
                  className={`h-6 w-6 rounded bg-gray-700/50 flex-shrink-0 ${shimmer}`}
                  style={{ animationDelay: `${300 + i * 50}ms` }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className={`h-4 w-48 bg-gray-700/50 rounded ${shimmer}`}
                    style={{ animationDelay: `${325 + i * 50}ms` }}
                  />
                  <div
                    className={`h-3 w-32 bg-gray-700/40 rounded ${shimmer}`}
                    style={{ animationDelay: `${350 + i * 50}ms` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Column */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
            <div className={`h-6 w-32 bg-gray-700/60 rounded ${shimmer}`} />

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square bg-gray-700/40 rounded ${shimmer}`}
                  style={{ animationDelay: `${(i * 30) % 500}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="container mx-auto px-4">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
          <div className={`h-6 w-40 bg-gray-700/60 rounded ${shimmer}`} />

          {/* Settings Items */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border-b border-white/10 last:border-0"
            >
              <div className="space-y-2 flex-1">
                <div
                  className={`h-4 w-32 bg-gray-700/50 rounded ${shimmer}`}
                  style={{ animationDelay: `${500 + i * 50}ms` }}
                />
                <div
                  className={`h-3 w-48 bg-gray-700/40 rounded ${shimmer}`}
                  style={{ animationDelay: `${525 + i * 50}ms` }}
                />
              </div>
              <div
                className={`h-8 w-12 rounded-full bg-gray-700/50 ${shimmer}`}
                style={{ animationDelay: `${550 + i * 50}ms` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimerSkeleton;
