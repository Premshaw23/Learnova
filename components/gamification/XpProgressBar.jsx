"use client";
import React from "react";
import { motion } from "framer-motion";
import { calculateNextLevelXp } from "@/utils/gamification";

export default function XpProgressBar({ currentLevel = 1, currentXp = 0 }) {
  const nextLevelXp = calculateNextLevelXp(currentLevel);
  // XP from previous level (assuming standard progression)
  const prevLevelXp = currentLevel > 1 ? calculateNextLevelXp(currentLevel - 1) : 0;
  
  const xpIntoCurrentLevel = currentXp - prevLevelXp;
  const xpRequiredForNextLevel = nextLevelXp - prevLevelXp;
  
  const progressPercentage = Math.min(
    100,
    Math.max(0, (xpIntoCurrentLevel / xpRequiredForNextLevel) * 100)
  );

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] w-full">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm text-gray-400 font-medium">Current Level</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              Lvl {currentLevel}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">
            <span className="text-indigo-400 font-semibold">{currentXp}</span> / {nextLevelXp} XP
          </p>
        </div>
      </div>

      <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden mt-1">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
        />
      </div>
    </div>
  );
}
