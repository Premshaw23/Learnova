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

  if (!mounted) {
    return (
      <div
        className="w-10 h-10 rounded-full border border-border/50 animate-pulse bg-muted"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-10 h-10 flex items-center justify-center rounded-full border border-border/50 bg-background/50 hover:bg-muted transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label="Toggle theme"
    >
      <Sun
        className={`w-5 h-5 transition-transform duration-300 ${theme === "dark" ? "scale-0 rotate-90 absolute" : "scale-100 rotate-0 text-amber-500"}`}
      />
      <Moon
        className={`w-5 h-5 transition-transform duration-300 ${theme === "dark" ? "scale-100 rotate-0 text-blue-400" : "scale-0 -rotate-90 absolute"}`}
      />
    </button>
  );
}
