"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTheme as useNextTheme } from "next-themes";

/**
 * ThemeContext provides theme management functionality
 * Wraps next-themes with additional features like system detection and localStorage
 */
const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, systemTheme } = useNextTheme();

  // Prevents hydration mismatch by waiting for client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (!mounted) return;

    const savedTheme = localStorage.getItem("learnova-theme");
    const useSystemTheme = localStorage.getItem("learnova-use-system") === "true";

    if (useSystemTheme) {
      const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      setTheme(systemPreference);
    } else if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [mounted, setTheme]);

  const toggleTheme = () => {
    if (!mounted) return;
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("learnova-theme", newTheme);
    localStorage.setItem("learnova-use-system", "false");
  };

  const setSystemTheme = () => {
    if (!mounted) return;
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    setTheme(systemPreference);
    localStorage.setItem("learnova-use-system", "true");
  };

  const value = {
    theme: mounted ? theme : undefined,
    setTheme,
    toggleTheme,
    setSystemTheme,
    isDark: mounted ? theme === "dark" : false,
    isLight: mounted ? theme === "light" : false,
    systemTheme: mounted ? systemTheme : undefined,
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to use theme context
 * @returns {Object} Theme context value with theme, toggleTheme, isDark, etc.
 */
export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }

  return context;
}

// Export the Next Themes hook for backward compatibility
export { useTheme } from "next-themes";
