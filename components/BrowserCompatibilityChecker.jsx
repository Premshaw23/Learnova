"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, X } from "lucide-react";

export default function BrowserCompatibilityChecker() {
  const [incompatibleFeatures, setIncompatibleFeatures] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const missing = [];

    // Check IndexedDB (essential for offline sync)
    if (!window.indexedDB) {
      missing.push("IndexedDB (Offline Storage)");
    }

    // Check WebGL (required for face-api.js animations & recognitions)
    try {
      const canvas = document.createElement("canvas");
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
      if (!support) {
        missing.push("WebGL Graphics Acceleration");
      }
    } catch {
      missing.push("WebGL Graphics Acceleration");
    }

    // Check Promise / modern ES6 APIs
    if (typeof Promise === "undefined" || typeof Promise.allSettled === "undefined") {
      missing.push("Modern Javascript ES6 Promise capabilities");
    }

    setIncompatibleFeatures(missing);
  }, []);

  if (dismissed || incompatibleFeatures.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-full bg-amber-950/90 border border-amber-800 text-amber-100 p-4 rounded-xl shadow-2xl backdrop-blur-md animate-bounce">
      <div className="flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-bold">Unsatisfactory Browser capabilities</h4>
          <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
            Your current browser lacks key capabilities required for Learnova to work properly:
          </p>
          <ul className="text-xs list-disc pl-4 mt-2 text-amber-300 space-y-0.5">
            {incompatibleFeatures.map((feat) => (
              <li key={feat}>{feat}</li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-200 transition-colors p-1"
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
