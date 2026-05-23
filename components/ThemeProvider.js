"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }) {
  // Choose initial default: dark unless user explicitly stored 'light'
  const initialTheme = (() => {
    if (typeof window === "undefined") return "dark";
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light") return "light";
      if (saved === "dark") return "dark";
      // If no saved preference, prefer system light only if explicitly light
      const prefersLight =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: light)").matches;
      return prefersLight ? "light" : "dark";
    } catch (e) {
      return "dark";
    }
  })();

  return (
    <NextThemesProvider attribute="class" defaultTheme={initialTheme} enableSystem={true}>
      {children}
    </NextThemesProvider>
  );
}