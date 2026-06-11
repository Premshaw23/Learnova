import React from "react";

/**
 * ChartSkeleton – animated placeholder for chart/analytics panels.
 *
 * Variants:
 *   "chart"   – bar-chart silhouette (default)
 *   "heatmap" – grid of small squares
 *   "stats"   – four stat cards in a row
 *   "doughnut"– circular chart silhouette
 */
const ChartSkeleton = ({ variant = "chart", className = "" }) => {
  const shimmer =
    "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

  if (variant === "heatmap") {
    return (
      <div
        className={`mt-6 pt-6 border-t border-white/10 ${className}`}
        aria-label="Loading attendance heatmap"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className={`h-4 w-36 rounded bg-gray-700/60 ${shimmer}`} />
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-3 w-14 rounded bg-gray-700/40 ${shimmer}`}
              />
            ))}
          </div>
        </div>
        {/* Grid */}
        <div className="flex gap-1 overflow-hidden pb-1">
          {Array.from({ length: 12 }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-gray-700/50 ${shimmer}`}
                  style={{ animationDelay: `${(weekIdx * 7 + dayIdx) * 15}ms` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "stats") {
    return (
      <div
        className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}
        aria-label="Loading statistics"
      >
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
    );
  }

  if (variant === "doughnut") {
    return (
      <div
        className={`w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center ${className}`}
        aria-label="Loading chart"
      >
        <div
          className={`w-48 h-48 rounded-full border-[16px] border-gray-700/40 ${shimmer}`}
          style={{ borderTopColor: "rgba(107, 114, 128, 0.2)" }}
        />
      </div>
    );
  }

  // Default: bar chart skeleton
  return (
    <div
      className={`w-full aspect-video min-h-[300px] rounded-xl bg-gray-800/50 border border-gray-700/50 p-6 flex flex-col justify-end ${className}`}
      aria-label="Loading chart"
    >
      {/* Y-axis labels placeholder */}
      <div className="flex items-end gap-3 h-full">
        {[65, 80, 45, 90, 55, 75, 60, 85, 50, 70, 40, 88].map((height, idx) => (
          <div key={idx} className="flex-1 flex flex-col justify-end">
            <div
              className={`w-full rounded-t bg-gray-700/40 ${shimmer}`}
              style={{
                height: `${height}%`,
                animationDelay: `${idx * 80}ms`,
              }}
            />
          </div>
        ))}
      </div>
      {/* X-axis line */}
      <div className="h-px bg-gray-700/60 mt-3" />
      <div className="flex justify-between mt-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-2 w-10 rounded bg-gray-700/40 ${shimmer}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ChartSkeleton;
