"use client";

import React from "react";
import Link from "next/link";

/**
 * @typedef {Object} Path
 * @property {string} name - The display name of the breadcrumb item
 * @property {string} url - The hyperlink destination for the breadcrumb item
 */

/**
 * Reusable Breadcrumb navigation component.
 * 
 * @param {Object} props
 * @param {Path[]} props.paths - An array of path objects representing the hierarchy
 */
export default function Breadcrumb({ paths = [] }) {
  if (!paths || paths.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm font-medium">
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1;

          return (
            <li key={path.url + index} className="flex items-center gap-2">
              {isLast ? (
                <span className="text-zinc-500 dark:text-zinc-400 select-none">
                  {path.name}
                </span>
              ) : (
                <Link
                  href={path.url}
                  className="text-zinc-400 hover:text-zinc-200 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors duration-200"
                >
                  {path.name}
                </Link>
              )}

              {!isLast && (
                <svg
                  className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-500 shrink-0 select-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
