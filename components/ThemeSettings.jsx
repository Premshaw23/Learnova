"use client";

import React, { useState } from "react";
import { useThemeContext } from "@/contexts/ThemeContext";
import { Settings, Palette } from "lucide-react";

/**
 * ThemeSettings Component
 * Allows users to choose between light mode, dark mode, and system preference
 */
export default function ThemeSettings() {
  const { theme, setTheme, setSystemTheme, mounted } = useThemeContext();
  const [showSettings, setShowSettings] = useState(false);

  if (!mounted) {
    return null;
  }

  const options = [
    {
      value: "light",
      label: "Light",
      description: "Always use light mode",
    },
    {
      value: "dark",
      label: "Dark",
      description: "Always use dark mode",
    },
    {
      value: "system",
      label: "System",
      description: "Follow device settings",
    },
  ];

  const handleThemeChange = (value) => {
    if (value === "system") {
      setSystemTheme();
    } else {
      setTheme(value);
      localStorage.setItem("learnova-theme", value);
      localStorage.setItem("learnova-use-system", "false");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-300"
        aria-label="Theme settings"
      >
        <Palette className="w-5 h-5" />
      </button>

      {showSettings && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-xl border border-gray-200 dark:border-slate-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Theme Settings
              </h3>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  handleThemeChange(option.value);
                  setShowSettings(false);
                }}
                className={`w-full text-left p-3 rounded-lg transition-all duration-300 ${
                  (option.value === "system"
                    ? localStorage.getItem("learnova-use-system") === "true"
                    : theme === option.value)
                    ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-500 dark:border-purple-400"
                    : "bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600"
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {option.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
