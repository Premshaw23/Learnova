"use client";

import React, { useEffect, useRef } from "react";

/**
 * ScrollProgress Component
 * Displays a smooth page scroll progress indicator
 * fixed at the top of the viewport.
 */
export default function ScrollProgress() {
  const progressRef = useRef(null);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const totalHeight = scrollHeight - clientHeight;

      const percentage =
        totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;

      if (progressRef.current) {
        progressRef.current.style.width = `${Math.min(
          Math.max(percentage, 0),
          100
        )}%`;
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    updateProgress();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      ref={progressRef}
      className="fixed top-0 left-0 z-99 h-1 bg-blue-600 dark:bg-blue-500 pointer-events-none"
      style={{
        width: "0%",
        willChange: "width",
      }}
      role="progressbar"
      aria-label="Scroll Progress"
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
}
