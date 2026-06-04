"use client";

import React, { useState, useRef, useEffect } from "react";
import { Share2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

/**
 * ShareButton Component
 * Copies the current page URL to clipboard on click.
 * Provides interactive micro-animations and status toasts.
 */
export default function ShareButton({ className = "" }) {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef(null);

  const handleShare = async () => {
    try {
      const shareUrl =
        typeof window !== "undefined"
          ? window.location.href
          : "";

      if (!shareUrl) {
        throw new Error(
          "Unable to retrieve window.location.href"
        );
      }

      if (navigator.share) {
        await navigator.share({
          title: "Learnova Project",
          text: "Check out this article/link from Learnova!",
          url: shareUrl,
        });

        toast.success("Shared successfully!");
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(shareUrl);

        setIsCopied(true);
        toast.success("Link copied to clipboard!");

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Reset copied state after 2 seconds
        timeoutRef.current = setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      }
    } catch (error) {
      // Ignore share cancel action
      if (error.name === "AbortError") {
        return;
      }

      console.error("Sharing failed:", error);
      toast.error(
        "Failed to share link. Please copy it manually."
      );
    }
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold shadow-sm transition-all duration-300 select-none ${
        isCopied
          ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
          : "bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
      } ${className}`}
      aria-label="Share page link"
    >
      <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {isCopied ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 45 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ scale: 0, rotate: 45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -45 }}
              transition={{ duration: 0.2 }}
            >
              <Share2 className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.span
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
        key={isCopied ? "copied" : "share"}
        transition={{ duration: 0.15 }}
      >
        {isCopied ? "Copied!" : "Share Link"}
      </motion.span>
    </motion.button>
  );
}