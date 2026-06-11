import React from "react";

/**
 * CardListSkeleton – displays multiple card skeletons in a grid layout
 * Used for activity, complaints, and similar list pages
 */
const CardListSkeleton = ({ count = 3, variant = "card" }) => {
  const shimmer =
    "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

  if (variant === "table") {
    return (
      <div className="space-y-4">
        {/* Table Header Skeleton */}
        <div className="grid grid-cols-5 gap-4 pb-4 border-b border-gray-700/50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`h-4 bg-gray-700/50 rounded ${shimmer}`} />
          ))}
        </div>

        {/* Table Rows Skeleton */}
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="grid grid-cols-5 gap-4 py-4 border-b border-gray-700/20"
          >
            {[1, 2, 3, 4, 5].map((colIdx) => (
              <div
                key={colIdx}
                className={`h-4 bg-gray-700/40 rounded ${shimmer}`}
                style={{
                  width: colIdx === 1 ? "80%" : "100%",
                  animationDelay: `${(idx * 5 + colIdx) * 30}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Default card variant
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-4"
        >
          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div
                className={`h-5 w-3/4 bg-gray-700/60 rounded ${shimmer}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              />
              <div
                className={`h-3 w-1/2 bg-gray-700/40 rounded ${shimmer}`}
                style={{ animationDelay: `${idx * 50 + 100}ms` }}
              />
            </div>
            <div
              className={`h-8 w-8 bg-gray-700/50 rounded-lg ${shimmer}`}
              style={{ animationDelay: `${idx * 50 + 50}ms` }}
            />
          </div>

          {/* Card Content */}
          <div className="space-y-3">
            {[1, 2, 3].map((lineIdx) => (
              <div
                key={lineIdx}
                className={`h-3 bg-gray-700/40 rounded ${shimmer}`}
                style={{
                  width: lineIdx === 3 ? "60%" : "100%",
                  animationDelay: `${idx * 50 + lineIdx * 75}ms`,
                }}
              />
            ))}
          </div>

          {/* Card Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full bg-gray-700/50 ${shimmer}`}
                style={{ animationDelay: `${idx * 50 + 150}ms` }}
              />
              <div
                className={`h-3 w-20 bg-gray-700/40 rounded ${shimmer}`}
                style={{ animationDelay: `${idx * 50 + 175}ms` }}
              />
            </div>
            <div
              className={`h-8 px-4 bg-gray-700/40 rounded-lg ${shimmer}`}
              style={{ animationDelay: `${idx * 50 + 200}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardListSkeleton;
