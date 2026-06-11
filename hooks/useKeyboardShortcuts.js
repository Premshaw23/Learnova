"use client";
import { useEffect, useCallback, useRef } from "react";

// Tags where keyboard shortcuts should be suppressed (except Escape)
const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Returns true if the user is actively typing in a form field or
 * contentEditable element.
 *
 * @param {EventTarget} target - The event's target element.
 * @returns {boolean}
 */
function isUserTyping(target) {
  if (!target || !(target instanceof Element)) return false;
  return TYPING_TAGS.has(target.tagName) || target.isContentEditable;
}

/**
 * Normalises a shortcut key (lowercases letters so callers don't have
 * to worry about casing).
 *
 * @param {string} key
 * @returns {string}
 */
function normaliseKey(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

/**
 * Builds a human-readable label for a shortcut, e.g. "Ctrl+K" / "⌘K".
 *
 * @param {boolean} useMeta - true on macOS
 * @param {string}  key
 * @returns {string}
 */
function shortcutLabel(useMeta, key) {
  const mod = useMeta ? "⌘" : "Ctrl+";
  return `${mod}${key.toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Shortcut map
// Each entry describes one shortcut so we can iterate rather than chain
// if/else blocks.  The `mod` flag indicates whether Ctrl/Cmd is required.
// ---------------------------------------------------------------------------
const SHORTCUT_MAP = [
  { key: "k",      mod: true,  prop: "onSearch",        label: "Search"        },
  { key: "/",      mod: true,  prop: "onHelp",          label: "Help"          },
  { key: "t",      mod: true,  prop: "onTheme",         label: "Toggle Theme"  },
  { key: "h",      mod: true,  prop: "onHome",          label: "Home"          },
  { key: "l",      mod: true,  prop: "onLeaderboard",   label: "Leaderboard"   },
  { key: "n",      mod: true,  prop: "onNotifications", label: "Notifications" },
  { key: "b",      mod: true,  prop: "onBookmarks",     label: "Bookmarks"     },
  { key: "p",      mod: true,  prop: "onProfile",       label: "Profile"       },
  { key: "Escape", mod: false, prop: "onEscape",        label: "Clear / Close" },
  { key: "?",      mod: false, prop: "onCheatSheet",    label: "Cheat Sheet"   },
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Registers global keyboard shortcuts on `window` and cleans them up
 * automatically when the component unmounts.
 *
 * Shortcuts are suppressed while the user is typing inside a form field,
 * **except** for `Escape` and `?` which always fire.
 *
 * Available handlers (all optional):
 *   onSearch        – Ctrl/Cmd + K   – focus the search input
 *   onHelp          – Ctrl/Cmd + /   – open the help panel
 *   onTheme         – Ctrl/Cmd + T   – toggle dark / light mode
 *   onHome          – Ctrl/Cmd + H   – navigate to home
 *   onLeaderboard   – Ctrl/Cmd + L   – open the leaderboard
 *   onNotifications – Ctrl/Cmd + N   – open notifications
 *   onBookmarks     – Ctrl/Cmd + B   – open bookmarks
 *   onProfile       – Ctrl/Cmd + P   – open the profile panel
 *   onEscape        – Escape          – clear filters / close modals
 *   onCheatSheet    – ?               – display the shortcut cheat-sheet
 *
 * Additional options:
 *   disabled  {boolean} – temporarily disables all shortcuts when true
 *   debug     {boolean} – logs matched shortcuts to the console
 *
 * @param {object} handlers
 * @returns {{ shortcuts: Array<{key: string, label: string, description: string}> }}
 *   A stable array of registered shortcut metadata (useful for rendering a
 *   help overlay).
 */
export function useKeyboardShortcuts(handlers = {}) {
  const {
    onSearch,
    onHelp,
    onTheme,
    onHome,
    onLeaderboard,
    onNotifications,
    onBookmarks,
    onProfile,
    onEscape,
    onCheatSheet,
    disabled = false,
    debug = false,
  } = handlers;

  // Keep a ref to the latest handlers so the event listener never goes stale
  // without needing to re-register it on every render.
  const handlersRef = useRef({});
  useEffect(() => {
    handlersRef.current = {
      onSearch,
      onHelp,
      onTheme,
      onHome,
      onLeaderboard,
      onNotifications,
      onBookmarks,
      onProfile,
      onEscape,
      onCheatSheet,
    };
  });

  const disabledRef = useRef(disabled);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);

  const debugRef = useRef(debug);
  useEffect(() => { debugRef.current = debug; }, [debug]);

  // Detect macOS once so we can display the correct modifier label
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

  const handleKeyDown = useCallback((e) => {
    if (disabledRef.current) return;

    const active = document.activeElement;
    const typing =
      isUserTyping(active) ||
      isUserTyping(e.target);

    const isModifier = e.metaKey || e.ctrlKey;
    const pressedKey = normaliseKey(e.key);

    for (const shortcut of SHORTCUT_MAP) {
      const keyMatches  = normaliseKey(shortcut.key) === pressedKey;
      const modMatches  = shortcut.mod ? isModifier : !e.metaKey && !e.ctrlKey;
      const alwaysFires = !shortcut.mod; // Escape, ?

      if (!keyMatches || !modMatches) continue;

      // Suppress shortcut while typing, unless it always fires
      if (typing && !alwaysFires) continue;

      if (shortcut.mod) e.preventDefault();

      const handler = handlersRef.current[shortcut.prop];

      if (debugRef.current) {
        const label = shortcut.mod
          ? shortcutLabel(isMac, shortcut.key)
          : shortcut.key;
        // eslint-disable-next-line no-console
        console.debug(
          `[useKeyboardShortcuts] ${label} → ${shortcut.prop}`,
          handler ? "✓ handled" : "✗ no handler",
        );
      }

      handler?.();
      break; // Only one shortcut per keydown event
    }
  }, [isMac]); // isMac is stable; handlers are read via ref
// AFTER (fixed)
export function useKeyboardShortcuts({
  onSearch,
  onHelp,
  onEscape,
  onTheme,
  onHome,
  onLeaderboard,
  onNotifications,
} = {}) {
  const handleKeyDown = useCallback(
    (e) => {
      const active = document.activeElement;
      const isEditable =
        active?.tagName === "INPUT" ||
        active?.tagName === "TEXTAREA" ||
        active?.tagName === "SELECT" ||
        active?.isContentEditable ||
        isUserTyping(e.target);

      if (isEditable && e.key !== "Escape") return;

      const isModifier = e.metaKey || e.ctrlKey;

      if (isModifier && e.key === "k") {
        e.preventDefault();
        onSearch?.();
      } else if (isModifier && e.key === "/") {
        e.preventDefault();
        onHelp?.();
      } else if (isModifier && e.key === "t") {
        e.preventDefault();
        onTheme?.();
      } else if (isModifier && e.key === "h") {
        e.preventDefault();
        onHome?.();
      } else if (isModifier && e.key === "l") {
        e.preventDefault();
        onLeaderboard?.();
      } else if (isModifier && e.key === "n") {
        e.preventDefault();
        onNotifications?.();
      } else if (e.key === "Escape") {
        onEscape?.();
      }
    },
    [onSearch, onHelp, onEscape, onTheme, onHome, onLeaderboard, onNotifications]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ---------------------------------------------------------------------------
  // Return metadata so consumers can render a help overlay / cheat-sheet
  // ---------------------------------------------------------------------------
  const shortcuts = SHORTCUT_MAP.map(({ key, mod, label }) => ({
    key: mod ? shortcutLabel(isMac, key) : key,
    label,
    hasHandler: Boolean(handlersRef.current[
      SHORTCUT_MAP.find(s => s.key === key && s.mod === mod)?.prop
    ]),
  }));

  return { shortcuts };
}