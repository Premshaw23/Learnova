"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function LazyImage({
  src,
  alt,
  className = "",
  skeletonClassName = "",
  fallbackSrc = "/assets/default-fallback.png",
  width,
  height,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  const imageSrc = error ? fallbackSrc : (src || fallbackSrc);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading Skeleton */}
      {!loaded && !error && (
        <div
          className={`absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse ${skeletonClassName}`}
        />
      )}

      <img
        src={error ? fallbackSrc : currentSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (currentSrc !== fallbackSrc) {
            setError(true);
          }
        }}
        className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        {...props}
      />
    </div>
  );
}
