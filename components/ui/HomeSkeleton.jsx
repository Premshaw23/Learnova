import React from "react";

/**
 * HomeSkeleton – animated placeholder for home/about page
 * Used to show loading state while page content is being prepared
 */
const HomeSkeleton = () => {
  const shimmer =
    "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black space-y-8 py-8">
      {/* Hero Section Skeleton */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Badge Skeleton */}
          <div className="flex justify-center">
            <div
              className={`h-8 w-64 bg-gray-700/50 rounded-full ${shimmer}`}
            />
          </div>

          {/* Title Skeleton */}
          <div className="space-y-3">
            <div
              className={`h-12 w-full max-w-2xl mx-auto bg-gray-700/50 rounded-lg ${shimmer}`}
            />
            <div
              className={`h-12 w-3/4 mx-auto bg-gray-700/40 rounded-lg ${shimmer}`}
            />
          </div>

          {/* Description Skeleton */}
          <div className="space-y-2">
            <div
              className={`h-4 w-full max-w-2xl mx-auto bg-gray-700/40 rounded ${shimmer}`}
            />
            <div
              className={`h-4 w-full max-w-xl mx-auto bg-gray-700/40 rounded ${shimmer}`}
              style={{ animationDelay: "100ms" }}
            />
          </div>

          {/* Button Skeleton */}
          <div className="flex justify-center gap-4 pt-6">
            <div
              className={`h-12 w-32 bg-gray-700/50 rounded-full ${shimmer}`}
              style={{ animationDelay: "200ms" }}
            />
            <div
              className={`h-12 w-32 bg-gray-700/40 rounded-full ${shimmer}`}
              style={{ animationDelay: "250ms" }}
            />
          </div>
        </div>
      </div>

      {/* Values Section Skeleton */}
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-12">
            <div
              className={`h-10 w-64 bg-gray-700/50 rounded-lg mx-auto mb-3 ${shimmer}`}
            />
            <div
              className={`h-4 w-full max-w-2xl mx-auto bg-gray-700/40 rounded ${shimmer}`}
            />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4"
              >
                {/* Icon */}
                <div
                  className={`h-12 w-12 bg-gray-700/50 rounded-lg ${shimmer}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                />

                {/* Title */}
                <div
                  className={`h-6 w-3/4 bg-gray-700/50 rounded ${shimmer}`}
                  style={{ animationDelay: `${i * 50 + 100}ms` }}
                />

                {/* Description */}
                <div className="space-y-2">
                  <div
                    className={`h-3 w-full bg-gray-700/40 rounded ${shimmer}`}
                    style={{ animationDelay: `${i * 50 + 150}ms` }}
                  />
                  <div
                    className={`h-3 w-5/6 bg-gray-700/40 rounded ${shimmer}`}
                    style={{ animationDelay: `${i * 50 + 200}ms` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section Skeleton */}
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center space-y-3 ${shimmer}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="h-10 w-24 bg-gray-700/50 rounded mx-auto" />
                <div className="h-4 w-32 bg-gray-700/40 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Section Skeleton */}
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div
              className={`h-10 w-64 bg-gray-700/50 rounded-lg mx-auto mb-3 ${shimmer}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-6 space-y-3"
              >
                <div
                  className={`h-8 w-8 bg-gray-700/50 rounded-lg ${shimmer}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                />
                <div
                  className={`h-5 w-3/4 bg-gray-700/50 rounded ${shimmer}`}
                  style={{ animationDelay: `${i * 40 + 80}ms` }}
                />
                <div className="space-y-2">
                  <div
                    className={`h-3 w-full bg-gray-700/40 rounded ${shimmer}`}
                    style={{ animationDelay: `${i * 40 + 120}ms` }}
                  />
                  <div
                    className={`h-3 w-4/5 bg-gray-700/40 rounded ${shimmer}`}
                    style={{ animationDelay: `${i * 40 + 160}ms` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSkeleton;
