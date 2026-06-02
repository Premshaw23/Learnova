import React from "react";
import { Clock } from "lucide-react";
import { calculateReadingTime, cn } from "@/lib/utils";

/**
 * ReadingTimeBadge component.
 * Calculates estimated reading time for the provided text and renders a stylized Tailwind badge.
 * 
 * @param {Object} props
 * @param {string} props.text - The raw text content of the article or lesson.
 * @param {string} [props.className] - Additional styling classes.
 */
export default function ReadingTimeBadge({ text, className }) {
  const timeString = calculateReadingTime(text);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm text-gray-500 bg-gray-100 rounded-full px-2 py-1 dark:bg-gray-800 dark:text-gray-400 transition-all duration-200 hover:scale-105 active:scale-95 cursor-default select-none border border-transparent dark:border-zinc-700/30",
        className
      )}
      title="Estimated reading time"
    >
      <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 animate-pulse" />
      <span>{timeString}</span>
    </span>
  );
}
