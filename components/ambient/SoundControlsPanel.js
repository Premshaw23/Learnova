"use client";

import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { AMBIENT_SOUNDS } from "@/contexts/AmbientAudioContext";
import { motion } from "framer-motion";
import { Play, Pause, Volume2 } from "lucide-react";

export default function SoundControlsPanel() {
  const {
    selectedSound,
    setSelectedSound,
    volume,
    setVolume,
    isPlaying,
    toggle,
  } = useAmbientAudio();

  const getCurrentSoundLabel = () => {
    return (
      AMBIENT_SOUNDS.find((s) => s.value === selectedSound)?.label || "None"
    );
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6 max-h-full overflow-y-auto"
    >
      {/* Header */}
      <div>
        <p className="text-white/50 text-xs uppercase tracking-widest">
          Sound Control
        </p>
        <p className="mt-2 text-sm text-white/80">{getCurrentSoundLabel()}</p>
      </div>

      {/* Play/Pause Button */}
      <motion.button
        variants={itemVariants}
        onClick={() => toggle()}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
      >
        {isPlaying ? (
          <>
            <Pause className="w-5 h-5" />
            Pause
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Play
          </>
        )}
      </motion.button>

      {/* Volume Control */}
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-white/70 text-sm flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Volume
          </label>
          <span className="text-white/50 text-xs">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </motion.div>

      {/* Sound Selection */}
      <div>
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">
          Sounds
        </p>
        <motion.div
          className="grid grid-cols-2 gap-2"
          variants={containerVariants}
        >
          {AMBIENT_SOUNDS.map((sound) => (
            <motion.button
              key={sound.value}
              variants={itemVariants}
              onClick={() => setSelectedSound(sound.value)}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 border ${
                selectedSound === sound.value
                  ? "bg-blue-600/80 border-blue-400 text-white shadow-lg shadow-blue-600/30"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              {sound.label}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Info */}
      <motion.div variants={itemVariants} className="text-center">
        <p className="text-white/40 text-xs leading-relaxed">
          {isPlaying
            ? "Ambient sound is playing"
            : "Tap play to start ambient sound"}
        </p>
      </motion.div>
    </motion.div>
  );
}
