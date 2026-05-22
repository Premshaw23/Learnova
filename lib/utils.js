import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional Tailwind CSS class names into a single deduplicated string.
 * Uses clsx for conditional logic and tailwind-merge to resolve conflicting utilities.
 * @param {...(string|string[]|Record<string,boolean>)} inputs - Class names or clsx-compatible values to merge.
 * @returns {string} A single merged Tailwind CSS class string with conflicts resolved.
 * @example
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'px-6');
 * // 'py-2 bg-blue-500 px-6'  (px-4 overridden by px-6)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}