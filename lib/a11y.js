/**
 * ============================================================================
 * ♿ ACCESSIBILITY UTILITIES (Issue #4226)
 * ============================================================================
 * Core accessibility utilities for WCAG 2.1 AA compliance.
 * Provides helpers for ARIA attributes, focus management, color contrast,
 * keyboard navigation, and screen reader support.
 */

// ---------------------------------------------------------------------------
// ARIA Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a unique ID for aria-labelledby / aria-describedby relationships.
 * @param {string} prefix - Optional prefix (e.g., "label", "desc")
 * @returns {string} Unique ID
 */
let idCounter = 0;
export function generateA11yId(prefix = "a11y") {
  return `${prefix}-${++idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Props to make an element a live region for screen readers.
 * @param {'polite' | 'assertive' | 'off'} [politeness='polite']
 */
export function liveRegionProps(politeness = "polite") {
  return {
    "aria-live": politeness,
    "aria-atomic": "true",
  };
}

/**
 * Props for a loading/progress indicator accessible to screen readers.
 */
export function loadingProps(label = "Loading") {
  return {
    "aria-busy": "true",
    "aria-live": "polite",
    "aria-label": label,
    role: "status",
  };
}

/**
 * Props for an error message connected to a form field.
 * @param {string} errorId - The ID of the error element
 */
export function errorProps(errorId) {
  return {
    "aria-invalid": "true",
    "aria-describedby": errorId,
  };
}

/**
 * Props for a required form field.
 */
export function requiredProps() {
  return {
    "aria-required": "true",
    required: true,
  };
}

/**
 * Props for a button that toggles expanded/collapsed state.
 * @param {boolean} isExpanded
 */
export function expandableProps(isExpanded) {
  return {
    "aria-expanded": isExpanded,
    role: "button",
  };
}

/**
 * Props for a tab component.
 * @param {boolean} isSelected
 * @param {string} panelId - ID of the associated panel
 */
export function tabProps(isSelected, panelId) {
  return {
    role: "tab",
    "aria-selected": isSelected,
    "aria-controls": panelId,
    tabIndex: isSelected ? 0 : -1,
  };
}

/**
 * Props for a tab panel.
 * @param {string} tabId - ID of the associated tab
 * @param {boolean} isSelected
 */
export function tabPanelProps(tabId, isSelected) {
  return {
    role: "tabpanel",
    "aria-labelledby": tabId,
    tabIndex: 0,
    hidden: !isSelected,
  };
}

// ---------------------------------------------------------------------------
// Keyboard Navigation
// ---------------------------------------------------------------------------

/**
 * Key codes for common interactions.
 */
export const KEYS = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  TAB: "Tab",
};

/**
 * Handle keyboard navigation in a list/menu.
 * @param {KeyboardEvent} event
 * @param {HTMLElement[]} items - Focusable items
 * @param {number} currentIndex - Currently focused index
 * @param {Function} onSelect - Callback when item is activated
 * @returns {number} New index
 */
export function handleListKeyboard(event, items, currentIndex, onSelect) {
  const { key } = event;
  let newIndex = currentIndex;

  switch (key) {
    case KEYS.ARROW_DOWN:
      event.preventDefault();
      newIndex = Math.min(currentIndex + 1, items.length - 1);
      break;
    case KEYS.ARROW_UP:
      event.preventDefault();
      newIndex = Math.max(currentIndex - 1, 0);
      break;
    case KEYS.HOME:
      event.preventDefault();
      newIndex = 0;
      break;
    case KEYS.END:
      event.preventDefault();
      newIndex = items.length - 1;
      break;
    case KEYS.ENTER:
    case KEYS.SPACE:
      event.preventDefault();
      if (onSelect) onSelect(currentIndex);
      return currentIndex;
    default:
      return currentIndex;
  }

  if (items[newIndex]) {
    items[newIndex].focus();
  }

  return newIndex;
}

/**
 * Trap focus within a container element.
 * Returns a cleanup function to remove the trap.
 * @param {HTMLElement} container
 * @returns {Function} Cleanup function
 */
export function trapFocus(container) {
  function getFocusableEls() {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS))
      .filter((el) => el.offsetParent !== null);
  }

  function handleKeyDown(event) {
    if (event.key !== KEYS.TAB) return;

    const focusable = getFocusableEls();
    if (focusable.length === 0) return;

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
  }

  container.addEventListener("keydown", handleKeyDown);

  // Focus the first focusable element
  const focusable = getFocusableEls();
  if (focusable.length > 0) {
    focusable[0].focus();
  }

  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}

// ---------------------------------------------------------------------------
// Color Contrast
// ---------------------------------------------------------------------------

/**
 * Parse a CSS color string to RGB values.
 * Supports hex (#fff, #ffffff), rgb(), rgba(), and named colors.
 */
export function parseColor(color) {
  if (typeof window === "undefined") return null;

  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = color;
  const computed = ctx.fillStyle;

  // Parse hex
  if (computed.startsWith("#")) {
    const hex = computed.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  // Parse rgb/rgba
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
  }

  return null;
}

/**
 * Calculate relative luminance per WCAG 2.1.
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors.
 * @returns {number} Contrast ratio (1 to 21)
 */
export function contrastRatio(color1, color2) {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color combination passes WCAG AA contrast requirements.
 * @param {Object} foreground - { r, g, b }
 * @param {Object} background - { r, g, b }
 * @param {'normal' | 'large'} textSize - 'normal' = 4.5:1, 'large' = 3:1
 * @returns {{ passes: boolean, ratio: number, required: number }}
 */
export function checkContrast(foreground, background, textSize = "normal") {
  const ratio = contrastRatio(foreground, background);
  const required = textSize === "large" ? 3 : 4.5;
  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
  };
}

// ---------------------------------------------------------------------------
// Screen Reader
// ---------------------------------------------------------------------------

/**
 * Announce a message to screen readers via a live region.
 * @param {string} message
 * @param {'polite' | 'assertive'} [politeness='polite']
 */
export function announce(message, politeness = "polite") {
  if (typeof document === "undefined" || !document.body) return;

  const el = document.createElement("div");
  el.setAttribute("aria-live", politeness);
  el.setAttribute("aria-atomic", "true");
  el.setAttribute("class", "sr-only");
  el.setAttribute("style", "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;");
  el.textContent = message;

  document.body.appendChild(el);
  setTimeout(() => {
    if (document.body && document.body.contains(el)) {
      document.body.removeChild(el);
    }
  }, 1000);
}

/**
 * Props for visually hidden text (screen reader only).
 */
export const srOnlyStyles = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/**
 * Screen reader only span component props.
 */
export function srOnlyProps() {
  return {
    className: "sr-only",
    style: srOnlyStyles,
  };
}

// ---------------------------------------------------------------------------
// Focus Management
// ---------------------------------------------------------------------------

/**
 * Save the currently focused element and return a restore function.
 */
export function saveFocus() {
  const previouslyFocused = document.activeElement;
  return () => {
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
      previouslyFocused.focus();
    }
  };
}

/**
 * CSS selector for all focusable elements.
 */
export const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Get all focusable elements within a container.
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
export function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS))
    .filter((el) => el.offsetParent !== null);
}

/**
 * Move focus to the first focusable element within a container.
 * @param {HTMLElement} container
 */
export function focusFirst(container) {
  const first = container.querySelector(FOCUSABLE_SELECTORS);
  if (first) first.focus();
}

// ---------------------------------------------------------------------------
// prefers-reduced-motion
// ---------------------------------------------------------------------------

/**
 * Check if the user prefers reduced motion.
 */
export function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Subscribe to reduced motion preference changes.
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function onReducedMotionChange(callback) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};

  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = (e) => callback(e.matches);
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}

// ---------------------------------------------------------------------------
// Skip Links
// ---------------------------------------------------------------------------

/**
 * Default skip link targets for Learnova.
 */
export const SKIP_LINKS = [
  { id: "skip-to-content", label: "Skip to main content", href: "#main-content" },
  { id: "skip-to-nav", label: "Skip to navigation", href: "#main-navigation" },
  { id: "skip-to-search", label: "Skip to search", href: "#search" },
];

export default {
  generateA11yId,
  liveRegionProps,
  loadingProps,
  errorProps,
  requiredProps,
  expandableProps,
  tabProps,
  tabPanelProps,
  KEYS,
  handleListKeyboard,
  trapFocus,
  parseColor,
  relativeLuminance,
  contrastRatio,
  checkContrast,
  announce,
  srOnlyStyles,
  srOnlyProps,
  saveFocus,
  focusFirst,
  FOCUSABLE_SELECTORS,
  getFocusableElements,
  prefersReducedMotion,
  onReducedMotionChange,
  SKIP_LINKS,
};
