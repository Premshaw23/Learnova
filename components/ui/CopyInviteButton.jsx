import React, { useEffect, useRef, useState } from "react";

/**
 * A highly reusable and accessible "Copy Invite Link" button component.
 * Uses the native Navigator Clipboard API with a fallback copy method.
 * Includes timeout cleanup, duplicate timeout prevention,
 * and improved success/failure feedback handling.
 */
const CopyInviteButton = ({ className = "" }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const timeoutRef = useRef(null);

  /**
   * Cleanup timeout on component unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Reset success/error feedback state safely
   */
  const resetFeedbackState = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsCopied(false);
      setCopyError(false);
    }, 2000);
  };

  /**
   * Fallback clipboard copy method
   */
  const fallbackCopyToClipboard = (text) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;

      // Prevent scrolling to bottom on mobile
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();

      const successful = document.execCommand("copy");

      document.body.removeChild(textarea);

      return successful;
    } catch (err) {
      console.error("Fallback clipboard copy failed:", err);
      return false;
    }
  };

  /**
   * Handle copy action
   */
  const handleCopy = async () => {
    if (typeof window === "undefined") return;

    const url = window.location.href;

    setCopyError(false);
    setIsCopied(false);

    try {
      // Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);

        setIsCopied(true);
        resetFeedbackState();
        return;
      }

      // Fallback for unsupported environments
      const fallbackSuccess = fallbackCopyToClipboard(url);

      if (fallbackSuccess) {
        setIsCopied(true);
      } else {
        setCopyError(true);
      }

      resetFeedbackState();
    } catch (err) {
      console.error("Failed to copy link:", err);

      // Try fallback even after Clipboard API failure
      const fallbackSuccess = fallbackCopyToClipboard(url);

      if (fallbackSuccess) {
        setIsCopied(true);
      } else {
        setCopyError(true);
      }

      resetFeedbackState();
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleCopy}
        className={`relative flex items-center justify-center p-2.5 rounded-xl border transition-all duration-300 active:scale-95 group ${
          isCopied
            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10"
            : copyError
            ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20 dark:shadow-rose-500/10"
            : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
          } ${className}`}
        aria-label={
          isCopied
            ? "Invite link copied"
            : copyError
            ? "Failed to copy invite link"
            : "Copy study room invite link"
        }
        title={
          isCopied
            ? "Link copied!"
            : copyError
            ? "Copy failed"
            : "Copy Invite Link"
        }
      >
        <span className="relative w-5 h-5 flex items-center justify-center">
          {/* Clipboard Icon */}
          <svg
            className={`absolute w-5 h-5 transition-all duration-300 transform ${
              isCopied || copyError
                ? "opacity-0 scale-75 rotate-45"
                : "opacity-100 scale-100 rotate-0"
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

          {/* Success Icon */}
          <svg
            className={`absolute w-5 h-5 transition-all duration-300 transform ${
              isCopied
                ? "opacity-100 scale-100 rotate-0"
                : "opacity-0 scale-75 -rotate-45"
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

          {/* Error Icon */}
          <svg
            className={`absolute w-5 h-5 transition-all duration-300 transform ${
              copyError
                ? "opacity-100 scale-100 rotate-0"
                : "opacity-0 scale-75 rotate-45"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
      </button>

      {/* Tooltip */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-white text-xs font-semibold rounded-lg shadow-xl border backdrop-blur-md transition-all duration-300 pointer-events-none flex items-center gap-1.5 whitespace-nowrap ${
          isCopied
            ? "bg-slate-950 dark:bg-slate-900 border-slate-800/80 opacity-100 translate-y-0 scale-100"
            : copyError
            ? "bg-rose-600 border-rose-500/50 opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-1.5 scale-90"
        }`}
        role="status"
        aria-live="polite"
      >
        {isCopied ? (
          <>
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
          </>
        ) : copyError ? (
          <>
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>Failed to copy link</span>
          </>
        ) : null}

        {/* Tooltip Arrow */}
        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent ${
            isCopied
              ? "border-t-slate-950 dark:border-t-slate-900"
              : copyError
              ? "border-t-rose-600"
              : ""
          }`}
        />
      </div>
    </div>
  );
};

export default CopyInviteButton;