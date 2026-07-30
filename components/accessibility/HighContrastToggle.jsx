/**
 * ============================================================================
 * 🎨 HIGH CONTRAST TOGGLE COMPONENT (Issue #4226)
 * ============================================================================
 * Provides a toggle for high-contrast mode, improving readability
 * for users with low vision or color blindness.
 *
 * Persists preference in localStorage and applies to the entire app.
 */

import React, { useState, useEffect, useCallback } from "react";
import { announce } from "@/lib/a11y";

const STORAGE_KEY = "learnova_high_contrast";
const HIGH_CONTRAST_CLASS = "high-contrast";

/**
 * HighContrastToggle component.
 *
 * @param {Object} props
 * @param {boolean} [props.defaultEnabled=false] - Initial state
 * @param {Function} [props.onToggle] - Callback when toggled
 * @param {boolean} [props.showLabel=true] - Show text label
 * @param {string} [props.className] - Additional CSS class
 */
export default function HighContrastToggle({
  defaultEnabled = false,
  onToggle,
  showLabel = true,
  className = "",
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  // Load preference from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setEnabled(stored === "true");
      } else {
        // Respect system preference
        const mq = window.matchMedia("(prefers-contrast: more)");
        setEnabled(mq.matches);
      }
    } catch {
      // ignore
    }
  }, []);

  // Apply high contrast class to body
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (enabled) {
      document.body.classList.add(HIGH_CONTRAST_CLASS);
    } else {
      document.body.classList.remove(HIGH_CONTRAST_CLASS);
    }
  }, [enabled]);

  const handleToggle = useCallback(() => {
    const newValue = !enabled;
    setEnabled(newValue);

    try {
      localStorage.setItem(STORAGE_KEY, String(newValue));
    } catch {
      // ignore
    }

    announce(
      newValue ? "High contrast mode enabled" : "High contrast mode disabled"
    );

    if (onToggle) onToggle(newValue);
  }, [enabled, onToggle]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Disable high contrast mode" : "Enable high contrast mode"}
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        enabled
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      } ${className}`}
    >
      <span className="text-base" aria-hidden="true">
        {enabled ? "🌓" : "🎨"}
      </span>
      {showLabel && (
        <span>{enabled ? "High Contrast On" : "High Contrast"}</span>
      )}
    </button>
  );
}
