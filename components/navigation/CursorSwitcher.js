"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MousePointer2, ChevronDown } from "lucide-react";

const CURSOR_STYLES = [
  { id: "default", label: "Default" },
  { id: "glow", label: "Glow" },
  { id: "trail", label: "Trail" },
];

const STORAGE_KEY = "cursor-style";

export default function CursorSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStyle, setActiveStyle] = useState("default");
  const dropdownRef = useRef(null);
  const glowDotRef = useRef(null);
  const trailDotsRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || "default";
    setActiveStyle(saved);
  }, []);

  const handleClickOutside = useCallback((e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    document.body.classList.remove("cursor-glow");

    glowDotRef.current?.remove();
    glowDotRef.current = null;
    trailDotsRef.current.forEach((d) => d.remove());
    trailDotsRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (activeStyle === "glow") {
      document.body.classList.add("cursor-glow");
      const dot = document.createElement("div");
      dot.className = "cursor-glow-dot";
      document.body.appendChild(dot);
      glowDotRef.current = dot;

      const moveGlow = (e) => {
        dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      };
      window.addEventListener("mousemove", moveGlow);
      return () => {
        window.removeEventListener("mousemove", moveGlow);
        dot.remove();
      };
    }

    if (activeStyle === "trail") {
      const TRAIL_LENGTH = 8;
      const dots = Array.from({ length: TRAIL_LENGTH }, () => {
        const d = document.createElement("div");
        d.className = "cursor-trail-dot";
        d.style.opacity = "0";
        document.body.appendChild(d);
        return d;
      });
      trailDotsRef.current = dots;

      const positions = Array.from({ length: TRAIL_LENGTH }, () => ({ x: 0, y: 0 }));
      let mouseX = 0;
      let mouseY = 0;
      let started = false;

      const onMove = (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        started = true;
      };
      window.addEventListener("mousemove", onMove);

      const animate = () => {
        if (started) {
          positions[0].x = mouseX;
          positions[0].y = mouseY;
          for (let i = 1; i < TRAIL_LENGTH; i++) {
            positions[i].x += (positions[i - 1].x - positions[i].x) * 0.35;
            positions[i].y += (positions[i - 1].y - positions[i].y) * 0.35;
          }
          dots.forEach((dot, i) => {
            dot.style.opacity = String(1 - i / TRAIL_LENGTH);
            dot.style.transform = `translate(${positions[i].x}px, ${positions[i].y}px) translate(-50%, -50%)`;
          });
        }
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);

      return () => {
        window.removeEventListener("mousemove", onMove);
        cancelAnimationFrame(rafRef.current);
        dots.forEach((d) => d.remove());
      };
    }
  }, [activeStyle]);

  const handleSelect = (id) => {
    setActiveStyle(id);
    localStorage.setItem(STORAGE_KEY, id);
    setIsOpen(false);
  };

  const activeLabel = CURSOR_STYLES.find((s) => s.id === activeStyle)?.label;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200/50 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Choose cursor style"
      >
        <MousePointer2 className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Cursor: {activeLabel}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-zinc-900"
        >
          {CURSOR_STYLES.map((style) => (
            <button
              key={style.id}
              role="option"
              aria-selected={activeStyle === style.id}
              onClick={() => handleSelect(style.id)}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-white/8 ${
                activeStyle === style.id
                  ? "font-semibold text-indigo-500"
                  : "text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
