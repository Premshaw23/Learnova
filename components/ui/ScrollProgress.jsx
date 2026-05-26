"use client";

import React, { useState, useEffect } from "react";

/**
 * ScrollProgress Component
 * Renders a thin, sticky horizontal progress bar at the very top of the page
 * that dynamically fills up as the user scrolls down the document.
 */
export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const totalHeight = scrollHeight - clientHeight;

      if (totalHeight > 0) {
        const percentage = (window.scrollY / totalHeight) * 100;
        // Clamp the percentage between 0 and 100
        setScrollProgress(Math.min(Math.max(percentage, 0), 100));
      } else {
        setScrollProgress(0);
      }
    };

    // Attach scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial calculation on mount
    handleScroll();

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 z-50 h-1 bg-blue-600 dark:bg-blue-500 transition-all duration-150 ease-out pointer-events-none"
      style={{ width: `${scrollProgress}%` }}
      role="progressbar"
      aria-label="Scroll Progress"
      aria-valuenow={Math.round(scrollProgress)}
      aria-valuemin="0"
      aria-valuemax="100"
    />
  );
}
