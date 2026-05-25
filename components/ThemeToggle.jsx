"use client";

import React, { useState, useEffect } from "react";
import { useThemeContext } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

/**
 * ThemeToggle Component
 * Beautiful animated dark mode toggle button with smooth transitions
 * Features: Animated SVG, smooth transitions, accessible keyboard support
 */
export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useThemeContext();
  const [isAnimating, setIsAnimating] = useState(false);

  if (!mounted) {
    // Return a placeholder to prevent hydration mismatch
    return (
      <button
        className="p-2 rounded-lg transition-colors duration-300 cursor-default"
        disabled
        aria-label="Loading theme toggle..."
      />
    );
  }

  const isDark = theme === "dark";

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        relative inline-flex items-center justify-center
        w-10 h-10 rounded-lg
        bg-gray-100 dark:bg-slate-800
        text-gray-700 dark:text-yellow-400
        border border-gray-200 dark:border-slate-700
        hover:bg-gray-200 dark:hover:bg-slate-700
        transition-all duration-300 ease-out
        transform hover:scale-110 active:scale-95
        shadow-sm hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900
        group
      `}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`${isDark ? "Light" : "Dark"} Mode`}
    >
      <div className="relative w-6 h-6">
        {/* Sun Icon */}
        <Sun
          className={`
            absolute inset-0 w-6 h-6
            text-yellow-500 dark:text-yellow-400
            transition-all duration-300
            ${isDark ? "opacity-0 rotate-180 scale-0" : "opacity-100 rotate-0 scale-100"}
          `}
          strokeWidth={2.5}
        />

        {/* Moon Icon */}
        <Moon
          className={`
            absolute inset-0 w-6 h-6
            text-slate-600 dark:text-yellow-300
            transition-all duration-300
            ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-180 scale-0"}
          `}
          strokeWidth={2.5}
        />
      </div>

      {/* Animated background glow effect */}
      <div
        className={`
          absolute inset-0 rounded-lg
          bg-gradient-to-br from-purple-500/20 to-pink-500/20
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
          pointer-events-none
        `}
      />
    </button>
  );
}
