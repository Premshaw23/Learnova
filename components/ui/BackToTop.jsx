"use client";

import React, { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

/**
 * BackToTop Component
 * A floating back-to-top button that appears in the bottom-right corner of the viewport
 * after scrolling past 300px. Clicking it smoothly animates the view back to the top.
 */
export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Toggle visibility based on 300px threshold
      setIsVisible(window.scrollY > 300);
    };

    // Attach event listener using passive option for scroll performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial check in case page mounts pre-scrolled
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      type="button"
      aria-label="Back to top"
      className={`fixed bottom-8 right-8 z-[9999] p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-100 hover:text-white shadow-2xl hover:shadow-indigo-500/20 active:scale-95 transition-all duration-500 ease-out backdrop-blur-md cursor-pointer hover:border-indigo-500/50 hover:bg-slate-850 ${
        isVisible
          ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
          : "opacity-0 scale-75 pointer-events-none translate-y-4"
      }`}
    >
      <ChevronUp className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
    </button>
  );
}
