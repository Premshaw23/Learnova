"use client";
import React from "react";
import { motion } from "framer-motion";

export default function StreakCounter({ currentStreak = 0 }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/20 text-2xl">
        <motion.span
          animate={currentStreak > 0 ? { y: [0, -5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          🔥
        </motion.span>
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium tracking-wide">
          Attendance Streak
        </p>
        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
          {currentStreak} {currentStreak === 1 ? "Day" : "Days"}
        </p>
      </div>
    </motion.div>
  );
}
