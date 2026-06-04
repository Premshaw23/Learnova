"use client";

// ─── Why this wrapper exists ──────────────────────────────────────────────────
// CommandPalette is a pure presentational component — it requires `isOpen` and
// `onClose` as props and has no internal state of its own.
//
// useCommandPalette is the stateful hook — it owns the `isOpen` boolean and
// registers the global Ctrl+K keyboard shortcut listener.
//
// Conflict resolved: layout.js must import THIS wrapper, not CommandPalette
// directly. Importing CommandPalette directly would leave `isOpen` always
// undefined (falsy), so the palette would never open.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Presentational component (requires isOpen + onClose props) ──────────────
import CommandPalette from "@/components/CommandPalette";

// ─── Stateful hook (owns isOpen, registers Ctrl+K listener) ─────────────────
import useCommandPalette from "@/hooks/useCommandPalette";

// ─── Wrapper: bridges hook state → presentational component ─────────────────
export default function CommandPaletteWrapper() {
  // Destructure only what CommandPalette needs: open state + close handler
  const { isOpen, close } = useCommandPalette();

  return <CommandPalette isOpen={isOpen} onClose={close} />;
}
