"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
  if (!mounted) return;

  const autoThemeEnabled = localStorage.getItem("autoTheme") === "true";

  if (!autoThemeEnabled) return;

  const hour = new Date().getHours();

  if (hour >= 19 || hour < 7) {
    setTheme("dark");
  } else {
    setTheme("light");
  }
}, [mounted, setTheme]);

  if (!mounted) {
    const autoThemeEnabled =
  typeof window !== "undefined" &&
  localStorage.getItem("autoTheme") === "true";

return (
      <div
        className="w-10 h-10 rounded-full border border-border/50 animate-pulse bg-muted"
        aria-hidden="true"
      />
    );
  }

  const autoThemeEnabled =
  typeof window !== "undefined" &&
  localStorage.getItem("autoTheme") === "true";

return (
  <div className="flex items-center gap-2">
    <button
      onClick={() => {
        const current =
          localStorage.getItem("autoTheme") === "true";

        localStorage.setItem(
          "autoTheme",
          (!current).toString()
        );

        window.location.reload();
      }}
      className="px-2 py-1 text-xs rounded border"
    >
      {autoThemeEnabled ? "Auto" : "Manual"}
    </button>

    <button
      onClick={() =>
        setTheme(theme === "dark" ? "light" : "dark")
      }
      className="relative w-10 h-10 flex items-center justify-center rounded-full border border-border/50 bg-background/50 hover:bg-muted transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label="Toggle theme"
    >
      <Sun
        className={`w-5 h-5 transition-transform duration-300 ${
          theme === "dark"
            ? "scale-0 rotate-90 absolute"
            : "scale-100 rotate-0 text-amber-500"
        }`}
      />
      <Moon
        className={`w-5 h-5 transition-transform duration-300 ${
          theme === "dark"
            ? "scale-100 rotate-0 text-blue-400"
            : "scale-0 -rotate-90 absolute"
        }`}
      />
    </button>
  </div>
);
}
