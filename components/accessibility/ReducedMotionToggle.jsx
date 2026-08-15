/**
 * ============================================================================
 * 🎬 REDUCED MOTION TOGGLE COMPONENT (Issue #4226)
 * ============================================================================
 * Provides a toggle for reduced motion, respecting user preferences
 * for animations and transitions.
 *
 * Essential for users with vestibular disorders, epilepsy, or
 * motion sensitivity.
 */

import React, { useState, useEffect, useCallback } from "react";
import { announce, prefersReducedMotion } from "@/lib/a11y";

const STORAGE_KEY = "learnova_reduced_motion";
const REDUCED_MOTION_CLASS = "reduced-motion";

/**
 * ReducedMotionToggle component.
 *
 * @param {Object} props
 * @param {boolean} [props.defaultEnabled] - Initial state (defaults to system preference)
 * @param {Function} [props.onToggle] - Callback when toggled
 * @param {boolean} [props.showLabel=true] - Show text label
 * @param {string} [props.className] - Additional CSS class
 */
export default function ReducedMotionToggle({
  defaultEnabled,
  onToggle,
  showLabel = true,
  className = "",
}) {
  const [enabled, setEnabled] = useState(
    defaultEnabled !== undefined ? defaultEnabled : false
  );

  // Load preference from localStorage or system
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setEnabled(stored === "true");
      } else {
        setEnabled(prefersReducedMotion());
      }
    } catch {
      setEnabled(prefersReducedMotion());
    }
  }, []);

  // Apply reduced motion class to body
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (enabled) {
      document.body.classList.add(REDUCED_MOTION_CLASS);
      document.documentElement.style.setProperty("--transition-speed", "0s");
      document.documentElement.style.setProperty("--animation-speed", "0s");
    } else {
      document.body.classList.remove(REDUCED_MOTION_CLASS);
      document.documentElement.style.removeProperty("--transition-speed");
      document.documentElement.style.removeProperty("--animation-speed");
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
      newValue
        ? "Reduced motion enabled - animations paused"
        : "Reduced motion disabled - animations restored"
    );

    if (onToggle) onToggle(newValue);
  }, [enabled, onToggle]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Enable animations" : "Reduce motion and animations"}
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        enabled
          ? "bg-amber-100 text-amber-800 border border-amber-300"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      } ${className}`}
    >
      <span className="text-base" aria-hidden="true">
        {enabled ? "⏸️" : "🎬"}
      </span>
      {showLabel && (
        <span>{enabled ? "Motion Reduced" : "Reduce Motion"}</span>
      )}
    </button>
  );
}
