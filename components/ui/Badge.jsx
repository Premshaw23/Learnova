import React from "react";

/**
 * Reusable Badge component for status tags, difficulty levels, and metadata.
 */
export default function Badge({ children, variant = "default", className = "" }) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200";

  const variants = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-500/20",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-500/20",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <span className={`${baseClasses} ${variantClass} ${className}`}>
      {children}
    </span>
  );
}
