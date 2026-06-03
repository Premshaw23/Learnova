"use client";

import { useEffect, useRef, useState } from "react";
import { X, Keyboard } from "lucide-react";

const shortcuts = [
  {
    keys: ["Ctrl", "K"],
    mac: ["⌘", "K"],
    description: "open search",
    action: () => window.dispatchEvent(new CustomEvent("learnova:open-search")),
  },
  {
    keys: ["Ctrl", "/"],
    mac: ["⌘", "/"],
    description: "show keyboard shortcuts",
    action: "toggle-modal", // Handled directly inside the key listener
  },
  {
    keys: ["Esc"],
    mac: ["Esc"],
    description: "close modals and dropdowns",
  },
  {
    keys: ["Ctrl", "T"],
    mac: ["⌘", "T"],
    description: "toggle dark/light theme",
    action: () =>
      window.dispatchEvent(new CustomEvent("learnova:toggle-theme")),
  },
  {
    keys: ["Ctrl", "H"],
    mac: ["⌘", "H"],
    description: "go to home/dashboard",
    action: () => (window.location.href = "/"),
  },
  {
    keys: ["Ctrl", "L"],
    mac: ["⌘", "L"],
    description: "go to leaderboard",
    action: () => (window.location.href = "/leaderboard"),
  },
  {
    keys: ["Ctrl", "N"],
    mac: ["⌘", "N"],
    description: "open notifications",
    action: () =>
      window.dispatchEvent(new CustomEvent("learnova:open-notifications")),
  },
];

export default function ShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const closeBtnRef = useRef(null);

  const onClose = () => setIsOpen(false);
  const onOpen = () => setIsOpen(true);

  // Determine OS
  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  // 1. Automatically listen to Footer click triggers
  useEffect(() => {
    const handleOpenTrigger = () => setIsOpen(true);
    window.addEventListener("learnova:open-shortcuts", handleOpenTrigger);
    return () =>
      window.removeEventListener("learnova:open-shortcuts", handleOpenTrigger);
  }, []);

  // 2. Focus close button when opened
  useEffect(() => {
    if (isOpen && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [isOpen]);

  // 3. Global Key Listener Engine (Executes actions + handles Escape/Tab)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore global shortcut triggers if the user is writing text inside input fields
      const targetTag = e.target.tagName;
      if (
        targetTag === "INPUT" ||
        targetTag === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      const isModifier = isMac ? e.metaKey : e.ctrlKey;
      const keyUpper = e.key.toUpperCase();

      // Modal escape close routing
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
        return;
      }

      // Accessibility focus trap management
      if (e.key === "Tab" && isOpen) {
        e.preventDefault();
        closeBtnRef.current?.focus();
        return;
      }

      // Match system actions
      if (isModifier) {
        if (e.key === "/") {
          e.preventDefault();
          isOpen ? onClose() : onOpen();
          return;
        }

        const match = shortcuts.find(
          (s) => s.keys[1] === keyUpper || s.keys[1] === e.key
        );
        if (match && typeof match.action === "function") {
          e.preventDefault();
          match.action();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isMac]);

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
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
            <Keyboard className="h-5 w-5 text-purple-400" />
            <h2 className="text-white font-semibold text-lg capitalize">
              keyboard shortcuts
            </h2>
          </div>
          <button
            ref={closeBtnRef}
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
              <span className="text-white/70 text-sm capitalize">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {(isMac ? shortcut.mac : shortcut.keys).map((key, i) => (
                  <kbd
                    key={i}
                    className="px-2 py-1 bg-white/10 text-white text-xs rounded-md font-mono border border-white/20 shadow-sm"
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
