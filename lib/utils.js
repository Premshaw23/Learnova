import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional Tailwind CSS class names into a single deduplicated string.
 * Uses clsx for conditional logic and tailwind-merge to resolve conflicting utilities.
 * @param {...(string|string[]|Record<string,boolean>)} inputs - Class names or clsx-compatible values to merge.
 * @returns {string} A single merged Tailwind CSS class string with conflicts resolved.
 * @example
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'px-6');
 * // 'py-2 bg-blue-500 px-6'
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates the estimated reading time for a given text.
 * Assumes an average reading speed of 200 words per minute.
 * Handles empty, null, or undefined content gracefully by returning a default fallback.
 *
 * @param {string} text - The raw text content to estimate.
 * @returns {string} The formatted reading time string (e.g. "5 min read" or "< 1 min read").
 */
export function calculateReadingTime(text) {
  if (!text || typeof text !== "string") {
    return "< 1 min read";
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return "< 1 min read";
  }

  // Split by whitespace characters to count words accurately
  const words = trimmed.split(/\s+/);
  const wordCount = words.length;

  // Estimate based on 200 words per minute
  const minutes = Math.ceil(wordCount / 200);

  return `${minutes} min read`;
}
