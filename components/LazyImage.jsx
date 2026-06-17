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

      {width && height ? (
        <Image
          src={imageSrc}
          alt={alt || ""}
          width={width}
          height={height}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`object-cover transition-opacity duration-500 ease-in-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          {...props}
        />
      ) : (
        <Image
          src={imageSrc}
          alt={alt || ""}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`object-cover transition-opacity duration-500 ease-in-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          {...props}
        />
      )}
    </div>
  );
}
