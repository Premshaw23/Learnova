/**
 * components/AchievementProgress.js
 * 
 * Displays detailed progress tracking toward achievement milestones.
 * Shows both locked and unlocked badges with detailed progress information.
 */

"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, Zap } from "lucide-react";
import BadgeCard from "./BadgeCard";
import { getBadgeStatistics } from "@/lib/badgeEngine";

const AchievementProgress = ({
  badges = [],
  newBadges = [],
  title = "Achievements",
  showStats = true,
  size = "default",
  className = "",
}) => {
  const stats = useMemo(() => getBadgeStatistics(badges), [badges]);
  const newBadgeIds = useMemo(() => new Set(newBadges.map((b) => b.id)), [newBadges]);

  // Separate unlocked and locked badges
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
    >
      {/* Header with Title and Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-yellow-400" />
            {title}
          </h2>
          {showStats && (
            <div className="flex gap-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                <p className="text-xs text-green-400">Unlocked</p>
                <p className="text-2xl font-bold text-green-400">{stats.unlocked}</p>
              </div>
              <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400">Locked</p>
                <p className="text-2xl font-bold text-gray-400">{stats.locked}</p>
              </div>
            </div>
          )}
        </div>

        {/* Overall Progress Bar */}
        {showStats && (
          <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Zap className="w-4 h-4 text-yellow-400" />
                Overall Progress
              </div>
              <span className="text-lg font-bold text-white">
                {stats.averageProgress}%
              </span>
            </div>
            <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${stats.averageProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Unlocked Badges Section */}
      {unlockedBadges.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="h-1 w-6 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full" />
            <h3 className="text-lg font-semibold text-green-400">
              Unlocked Achievements ({unlockedBadges.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {unlockedBadges.map((badge) => (
              <motion.div
                key={badge.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                <BadgeCard
                  badge={badge}
                  isNew={newBadgeIds.has(badge.id)}
                  size={size}
                  showProgress={true}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Locked Badges Section */}
      {lockedBadges.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="h-1 w-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full" />
            <h3 className="text-lg font-semibold text-gray-400">
              Locked Achievements ({lockedBadges.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {lockedBadges.map((badge) => (
              <motion.div
                key={badge.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                <BadgeCard
                  badge={badge}
                  isNew={false}
                  size={size}
                  showProgress={true}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {badges.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 px-4 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg"
        >
          <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No achievements data available yet.</p>
          <p className="text-sm text-gray-500 mt-1">
            Keep attending classes to unlock achievements!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AchievementProgress;
