import React from "react";

/**
 * FormSkeleton – animated placeholder for form components
 * Used for contact forms and other input-heavy pages
 */
const FormSkeleton = () => {
  const shimmer =
    "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-3 mb-8">
        <div className={`h-8 w-64 bg-gray-700/60 rounded-lg ${shimmer}`} />
        <div
          className={`h-4 w-full max-w-lg bg-gray-700/40 rounded ${shimmer}`}
        />
        <div
          className={`h-4 w-full max-w-md bg-gray-700/40 rounded ${shimmer}`}
        />
      </div>

      {/* Form Fields */}
      {[1, 2, 3, 4].map((fieldIdx) => (
        <div key={fieldIdx} className="space-y-2">
          {/* Label Skeleton */}
          <div
            className={`h-4 w-32 bg-gray-700/50 rounded ${shimmer}`}
            style={{ animationDelay: `${fieldIdx * 50}ms` }}
          />

          {/* Input/Field Skeleton */}
          <div
            className={`h-12 w-full bg-gray-700/40 rounded-lg border border-white/10 ${shimmer}`}
            style={{ animationDelay: `${fieldIdx * 50 + 75}ms` }}
          />
        </div>
      ))}

      {/* Submit Button Skeleton */}
      <div className="pt-4">
        <div
          className={`h-12 w-32 bg-gray-700/50 rounded-lg ${shimmer}`}
          style={{ animationDelay: `${300}ms` }}
        />
      </div>

      {/* Info Section */}
      <div className="mt-12 pt-8 border-t border-white/10 space-y-6">
        {[1, 2, 3].map((infoIdx) => (
          <div key={infoIdx} className="flex gap-4">
            <div
              className={`h-12 w-12 rounded-lg bg-gray-700/50 flex-shrink-0 ${shimmer}`}
              style={{ animationDelay: `${350 + infoIdx * 50}ms` }}
            />
            <div className="flex-1 space-y-2">
              <div
                className={`h-4 w-40 bg-gray-700/50 rounded ${shimmer}`}
                style={{ animationDelay: `${375 + infoIdx * 50}ms` }}
              />
              <div
                className={`h-3 w-full max-w-xs bg-gray-700/40 rounded ${shimmer}`}
                style={{ animationDelay: `${400 + infoIdx * 50}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormSkeleton;
