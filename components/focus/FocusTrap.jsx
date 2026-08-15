/**
 * ============================================================================
 * 🎯 FOCUS TRAP COMPONENT (Issue #4226)
 * ============================================================================
 * Traps keyboard focus within a container element.
 * Essential for modals, dialogs, dropdowns, and command palettes.
 *
 * Usage:
 *   <FocusTrap isActive={isOpen} onEscape={handleClose}>
 *     <div className="modal">...</div>
 *   </FocusTrap>
 */

import React, { useRef, useEffect, useCallback } from "react";
import { KEYS, saveFocus, focusFirst, getFocusableElements } from "@/lib/a11y";

/**
 * FocusTrap component.
 *
 * @param {Object} props
 * @param {boolean} props.isActive - Whether the trap is active
 * @param {Function} [props.onEscape] - Callback when Escape is pressed
 * @param {Function} [props.onDeactivate] - Callback when trap is deactivated
 * @param {boolean} [props.restoreFocus=true] - Whether to restore focus on deactivate
 * @param {React.ReactNode} props.children
 */
export default function FocusTrap({
  isActive = false,
  onEscape,
  onDeactivate,
  restoreFocus = true,
  children,
}) {
  const containerRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const handleKeyDown = useCallback(
    (event) => {
      if (!isActive) return;

      if (event.key === KEYS.ESCAPE) {
        event.preventDefault();
        event.stopPropagation();
        if (onEscape) onEscape();
        return;
      }

      if (event.key !== KEYS.TAB) return;

      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [isActive, onEscape]
  );

  // Activate / Deactivate
  useEffect(() => {
    if (isActive) {
      // Save current focus
      if (restoreFocus) {
        restoreFocusRef.current = saveFocus();
      }

      // Focus first element
      const timer = setTimeout(() => {
        if (containerRef.current) {
          focusFirst(containerRef.current);
        }
      }, 50);

      return () => clearTimeout(timer);
    } else {
      // Restore focus
      if (restoreFocus && restoreFocusRef.current) {
        restoreFocusRef.current();
        restoreFocusRef.current = null;
      }

      if (onDeactivate) onDeactivate();
    }
  }, [isActive, restoreFocus, onDeactivate]);

  // Attach keydown listener
  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [isActive, handleKeyDown]);

  if (!isActive) return <>{children}</>;

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
