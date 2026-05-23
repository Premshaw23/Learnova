"use client";
import React from "react";
import { motion } from "framer-motion";
import { BADGES } from "@/utils/gamification";

export default function BadgeGallery({ unlockedBadges = [] }) {
  const allBadges = Object.values(BADGES);

  return (
    <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] w-full">
      <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
        <span>🏆</span> Achievement Badges
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {allBadges.map((badge, index) => {
          const isUnlocked = unlockedBadges.includes(badge.id);

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
                isUnlocked
                  ? "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  : "bg-gray-800/50 border-gray-700 opacity-60 grayscale"
              }`}
              title={badge.description}
            >
              <div className="text-3xl mb-2">{badge.icon}</div>
              <p className="text-xs text-center font-medium text-gray-300 leading-tight">
                {badge.name}
              </p>
              {!isUnlocked && (
                <span className="text-[10px] text-gray-500 mt-1">Locked</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
