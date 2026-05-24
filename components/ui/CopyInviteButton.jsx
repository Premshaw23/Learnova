import React, { useState } from "react";

/**
 * A highly reusable and accessible "Copy Invite Link" button component.
 * Uses the native Navigator Clipboard API to copy the current page URL.
 * Offers visual and interactive feedback through state-driven icons, 
 * micro-animations, and a beautiful floating tooltip.
 */
const CopyInviteButton = ({ className = "" }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof window !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);

        // Reset the "Copied!" state after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleCopy}
        className={`relative flex items-center justify-center p-2.5 rounded-xl border transition-all duration-300 active:scale-95 group ${
          isCopied
            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10"
            : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
        } ${className}`}
        aria-label={isCopied ? "Invite link copied" : "Copy study room invite link"}
        title={isCopied ? "Link copied!" : "Copy Invite Link"}
      >
        <span className="relative w-5 h-5 flex items-center justify-center">
          {/* Clipboard Icon - hidden when copied */}
          <svg
            className={`absolute w-5 h-5 transition-all duration-300 transform ${
              isCopied ? "opacity-0 scale-75 rotate-45" : "opacity-100 scale-100 rotate-0"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>

          {/* Checkmark Icon - visible when copied */}
          <svg
            className={`absolute w-5 h-5 transition-all duration-300 transform ${
              isCopied ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-45"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      </button>

      {/* Elegant floating tooltip */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-950 dark:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-800/80 backdrop-blur-md transition-all duration-300 pointer-events-none flex items-center gap-1.5 whitespace-nowrap ${
          isCopied
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-1.5 scale-90"
        }`}
        role="status"
        aria-live="polite"
      >
        <svg
          className="w-3.5 h-3.5 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>Link copied to clipboard!</span>
        
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950 dark:border-t-slate-900" />
      </div>
    </div>
  );
};

export default CopyInviteButton;
