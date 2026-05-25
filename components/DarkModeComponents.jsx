"use client";

import React from "react";
import { useThemeContext } from "@/contexts/ThemeContext";

/**
 * DarkModeCard Component
 * Reusable card component with proper dark mode support
 */
export default function DarkModeCard({
  children,
  className = "",
  hover = true,
  onClick = null,
  gradient = false,
}) {
  const { isDark } = useThemeContext();

  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg p-6
        bg-white dark:bg-slate-800/50
        border border-gray-200 dark:border-slate-700
        shadow-sm dark:shadow-md
        backdrop-blur-sm
        transition-all duration-300 ease-out
        ${
          hover
            ? "hover:shadow-md dark:hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 hover:-translate-y-1"
            : ""
        }
        ${gradient ? "bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * DarkModeSection Component
 * Section wrapper with dark mode support
 */
export function DarkModeSection({ children, className = "", title = "" }) {
  return (
    <section
      className={`
        py-8 px-4 md:px-8
        bg-gradient-to-b from-gray-50 to-white
        dark:from-slate-900 dark:to-slate-950
        transition-colors duration-300
        ${className}
      `}
    >
      {title && (
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/**
 * DarkModeText Component
 * Text component with proper dark mode contrast
 */
export function DarkModeText({
  children,
  variant = "body",
  className = "",
}) {
  const variants = {
    heading: "text-gray-900 dark:text-white font-bold",
    subheading: "text-gray-700 dark:text-gray-200 font-semibold",
    body: "text-gray-700 dark:text-gray-300",
    caption: "text-gray-600 dark:text-gray-400 text-sm",
    muted: "text-gray-500 dark:text-gray-500",
  };

  return (
    <span className={`${variants[variant]} transition-colors duration-300 ${className}`}>
      {children}
    </span>
  );
}
