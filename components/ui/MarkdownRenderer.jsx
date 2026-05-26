"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * MarkdownRenderer Component
 * Safely renders rich text and markdown content with rich formatting options like lists,
 * tables, headers, and bold text, while retaining styling consistency via Tailwind Typography.
 * 
 * Props:
 * - content: Markdown string to render
 */
export default function MarkdownRenderer({ content = "" }) {
  return (
    <div className="prose dark:prose-invert max-w-none text-zinc-350 dark:text-zinc-300 prose-headings:text-slate-100 prose-strong:text-indigo-400 prose-strong:font-bold prose-code:text-indigo-300 prose-code:bg-indigo-950/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-indigo-900/30 prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-ul:list-disc prose-ol:list-decimal">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
