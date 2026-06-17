/**
 * components/StudentAchievementCard.js
 * 
 * Card component for displaying a student's achievements in teacher/parent view.
 * Shows summary of earned badges and achievement stats.
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, ChevronDown } from "lucide-react";
import BadgeCard from "./BadgeCard";
import { BADGE_DEFINITIONS } from "@/lib/badgeEngine";

const StudentAchievementCard = ({
  studentName,
  studentId,
  badges = [],
  attendanceCount = 0,
  expanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const unlockedCount = badges.length;
  const totalBadges = Object.keys(BADGE_DEFINITIONS).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600 transition-colors"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-lg">
            🏆
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white text-lg">
              {studentName}
            </h3>
            <p className="text-sm text-gray-400">
              {unlockedCount} of {totalBadges} achievements
            </p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Stats Row */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-3 border-t border-gray-700/30 pt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {unlockedCount}
          </p>
          <p className="text-xs text-gray-400">Unlocked</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">
            {totalBadges - unlockedCount}
          </p>
          <p className="text-xs text-gray-400">Locked</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">
            {attendanceCount}
          </p>
          <p className="text-xs text-gray-400">Days Present</p>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-700/30 bg-black/20"
          >
            <div className="p-4">
              {badges.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white mb-4">
                    Earned Badges
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {badges.map((badge) => {
                      const badgeDef = Object.values(BADGE_DEFINITIONS).find(
                        (b) => b.id === badge.id
                      );
                      if (!badgeDef) return null;

                      return (
                        <motion.div
                          key={badge.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <BadgeCard
                            badge={{
                              ...badgeDef,
                              unlocked: true,
                              earnedDate: badge.earnedDate,
                            }}
                            size="small"
                            showProgress={false}
                          />
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Earned dates */}
                  <div className="mt-4 space-y-2 text-sm">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex justify-between text-gray-400"
                      >
                        <span>{badge.name}</span>
                        <span className="text-gray-500">
                          {new Date(badge.earnedDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  No badges earned yet
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentAchievementCard;
