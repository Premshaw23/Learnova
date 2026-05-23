"use client";
import { useEffect } from "react";
import { X, Keyboard } from "lucide-react";

const shortcuts = [
  {
    keys: ["Ctrl", "K"],
    mac: ["⌘", "K"],
    description: "open search",
  },
  {
    keys: ["Ctrl", "/"],
    mac: ["⌘", "/"],
    description: "show keyboard shortcuts",
  },
  {
    keys: ["Esc"],
    mac: ["Esc"],
    description: "close modals and dropdowns",
  },
];

export default function ShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="keyboard shortcuts"
    >
      <div
        className={`bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 transition-all duration-300 ease-out transform ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Keyboard className="h-5 w-5 text-accent" />
            <h2 className="text-white font-semibold text-lg">
              keyboard shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="close shortcuts modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.description}
              className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
            >
              <span className="text-white/70 text-sm">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {(isMac ? shortcut.mac : shortcut.keys).map((key, i) => (
                  <kbd
                    key={i}
                    className="px-2 py-1 bg-white/10 text-white text-xs rounded-md font-mono border border-white/20"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-white/40 text-xs mt-6 text-center">
          shortcuts are disabled while typing in a text field
        </p>
      </div>
    </div>
  );
}
