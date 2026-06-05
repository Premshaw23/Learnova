"use client";

import { motion } from "framer-motion";
import {
  CloudRain,
  TreePine,
  Coffee,
  Waves,
  Headphones,
  Radio,
  Flame,
  Keyboard,
  Volume2,
  Play,
  Pause,
  Sparkles,
} from "lucide-react";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { AMBIENT_SOUNDS } from "@/contexts/AmbientAudioContext";

const ICON_MAP = {
  CloudRain,
  TreePine,
  Coffee,
  Waves,
  Headphones,
  Radio,
  Flame,
  Keyboard,
};

export function AmbientSoundPanel({ isDark }) {
  const {
    selectedSound,
    setSelectedSound,
    volume,
    setVolume,
    isPlaying,
    toggle,
  } = useAmbientAudio();

  return (
    <motion.div
      className={`${
        isDark
          ? "bg-black/40 border border-white/10 backdrop-blur-xl"
          : "bg-white/80 border border-slate-200 shadow-lg backdrop-blur-xl"
      } rounded-3xl p-6 md:p-8`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p
            className={`text-sm ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Ambient Sound
          </p>
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Soundscape
          </h3>
        </div>

        <button
          onClick={() => toggle()}
          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
            isPlaying
              ? isDark
                ? "bg-purple-500/20 border border-purple-400/40 text-purple-200 shadow-lg shadow-purple-500/10"
                : "bg-purple-100 border border-purple-300 text-purple-900 shadow-lg shadow-purple-500/10"
              : isDark
                ? "bg-white/10 border border-white/10 text-slate-300 hover:text-white"
                : "bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900"
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Play
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {AMBIENT_SOUNDS.map((sound) => {
          const Icon = ICON_MAP[sound.icon] || Volume2;
          const isActive = selectedSound === sound.value;
          return (
            <button
              key={sound.value}
              onClick={() => setSelectedSound(sound.value)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border text-sm transition-all duration-300 ${
                isActive
                  ? isDark
                    ? "border-purple-400/40 bg-purple-500/15 text-purple-100 shadow-lg shadow-purple-500/10"
                    : "border-purple-300 bg-purple-50 text-purple-900 shadow-lg shadow-purple-500/10"
                  : isDark
                    ? "border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20"
                    : "border-slate-200 bg-white/50 text-slate-600 hover:text-slate-900 hover:bg-white hover:border-slate-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{sound.label}</span>
              {isActive && isPlaying && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Volume2
          className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-runnable-track]:h-1.5
            [&::-webkit-slider-runnable-track]:rounded-full
            [&::-webkit-slider-runnable-track]:bg-white/10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-purple-400
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-purple-500/30
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-track]:h-1.5
            [&::-moz-range-track]:rounded-full
            [&::-moz-range-track]:bg-white/10
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-purple-400
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
        />
        <span
          className={`text-xs tabular-nums w-8 text-right ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {Math.round(volume * 100)}
        </span>
      </div>
    </motion.div>
  );
}
