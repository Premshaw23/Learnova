"use client";

import { useState } from "react";

export default function LazyImage({ src, alt, className = "", skeletonClassName = "", fallbackSrc = "/assets/default-fallback.png", ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading Skeleton */}
      {!loaded && !error && (
        <div className={`absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse ${skeletonClassName}`} />
      )}

      <img
        src={error ? fallbackSrc : src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${loaded ? "opacity-100" : "opacity-0"}`}
        {...props}
      />
    </div>
  );
}
