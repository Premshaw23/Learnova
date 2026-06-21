"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import BreathingGradientPreset from "./ambient/BreathingGradientPreset";
import StarrySkyPreset from "./ambient/StarrySkyPreset";
import SoftFirefliesPreset from "./ambient/SoftFirefliesPreset";
import SoundControlsPanel from "./ambient/SoundControlsPanel";

const PRESETS = [
  {
    id: "breathing",
    name: "Breathing",
    description: "Calming gradient rhythm",
    component: BreathingGradientPreset,
  },
  {
    id: "starry",
    name: "Starry Sky",
    description: "Infinite cosmos",
    component: StarrySkyPreset,
  },
  {
    id: "fireflies",
    name: "Fireflies",
    description: "Soft glowing lights",
    component: SoftFirefliesPreset,
  },
];

export default function AmbientModeFullscreen({ isOpen, onClose }) {
  const [activePreset, setActivePreset] = useState("breathing");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen && mounted) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose, mounted]);

  const currentPreset = PRESETS.find((p) => p.id === activePreset);
  const PresetComponent = currentPreset?.component;

  return (
    <AnimatePresence>
      {isOpen && mounted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950 overflow-hidden"
        >
          {/* Main layout: Preset Selector (Left) | Visual (Center) | Controls (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_300px] h-screen">
            {/* LEFT: Preset Selector */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden md:flex flex-col gap-4 border-r border-white/10 bg-slate-900/50 p-4 backdrop-blur-sm"
            >
              <p className="text-white/40 text-xs uppercase tracking-widest mt-2">
                Presets
              </p>
              <div className="flex flex-col gap-2">
                {PRESETS.map((preset) => (
                  <motion.button
                    key={preset.id}
                    onClick={() => setActivePreset(preset.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 border text-center whitespace-nowrap ${
                      activePreset === preset.id
                        ? "bg-blue-600/60 border-blue-400/50 text-white shadow-lg shadow-blue-600/20"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {preset.name}
                  </motion.button>
                ))}
              </div>

              {/* Bottom section with info */}
              <div className="mt-auto pt-4 border-t border-white/10">
                <button
                  onClick={onClose}
                  className="w-full py-2 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                  title="Close (ESC)"
                >
                  <X className="w-4 h-4" />
                  Exit
                </button>
              </div>
            </motion.div>

            {/* CENTER: Animated Visual Preset */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
            >
              {PresetComponent && (
                <motion.div
                  key={activePreset}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <PresetComponent />
                </motion.div>
              )}

              {/* Mobile preset selector overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="md:hidden absolute top-4 left-4 right-4 flex gap-2 z-10"
              >
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setActivePreset(preset.id)}
                    className={`text-xs font-medium py-2 px-3 rounded-lg border transition-all ${
                      activePreset === preset.id
                        ? "bg-blue-600/60 border-blue-400/50 text-white"
                        : "bg-white/10 border-white/20 text-white/60"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </motion.div>

              {/* Mobile close button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={onClose}
                className="md:hidden absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 z-20"
                title="Close"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* RIGHT: Sound Controls */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden md:flex flex-col border-l border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm overflow-y-auto"
            >
              <SoundControlsPanel />
            </motion.div>
          </div>

          {/* Mobile sound controls drawer */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:hidden absolute bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-white/10 p-4 max-h-[40vh] overflow-y-auto"
          >
            <SoundControlsPanel />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
