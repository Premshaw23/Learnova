"use client";
import { useEffect, useCallback } from "react";

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isUserTyping(target) {
  return TYPING_TAGS.has(target.tagName) || target.isContentEditable;
}

/**
 * Registers global keyboard shortcuts. Skips shortcuts when the user is
 * typing in a form field (Escape still fires in that case).
 *
 * Shortcuts:
 *   Ctrl/Cmd + K   -> onSearch
 *   Ctrl/Cmd + /   -> onHelp
 *   Escape         -> onEscape
 */
export function useKeyboardShortcuts({ onSearch, onHelp, onEscape } = {}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (isUserTyping(e.target) && e.key !== "Escape") return;

      const isModifier = e.metaKey || e.ctrlKey;

      if (isModifier && e.key === "k") {
        e.preventDefault();
        onSearch?.();
      } else if (isModifier && e.key === "/") {
        e.preventDefault();
        onHelp?.();
      } else if (e.key === "Escape") {
        onEscape?.();
      }
    },
    [onSearch, onHelp, onEscape]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
