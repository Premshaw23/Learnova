"use client";
import React from "react";
import { motion } from "framer-motion";
import { BADGES } from "@/utils/gamification";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const badgeVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export default function BadgeGallery({ unlockedBadges = [] }) {
  const allBadges = Object.values(BADGES);

  return (
    <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] w-full">
      <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
        <span>🏆</span> Achievement Badges
      </h3>

      <motion.div
        className="grid grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {allBadges.map((badge) => {
          const isUnlocked = unlockedBadges.includes(badge.id);

          return (
            <motion.div
              key={badge.id}
              variants={badgeVariants}
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
                <span className="text-[10px] text-gray-500 mt-1">
                  Locked
                </span>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}