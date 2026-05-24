"use client";

import { useEffect, useState } from "react";

export default function useLoadingState(initialLoading = true, minDuration = 700) {
  const [loading, setLoading] = useState(initialLoading);
  const [showSkeleton, setShowSkeleton] = useState(initialLoading);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowSkeleton(false), minDuration);
      return () => clearTimeout(timer);
    }

    setShowSkeleton(true);
  }, [loading, minDuration]);

  return {
    loading,
    showSkeleton,
    setLoading,
  };
}
