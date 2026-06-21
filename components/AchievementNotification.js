/**
 * components/AchievementNotification.js
 * 
 * Toast notification component for badge unlock events.
 * Uses Framer Motion for smooth animations and React Hot Toast.
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Show achievement unlock notification
 * @param {Object} badge - Badge object
 * @param {Function} onDismiss - Callback when notification is dismissed
 */
export const showAchievementNotification = (badge, onDismiss = () => {}) => {
  const AchievementToast = () => (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="relative"
    >
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-600/20 backdrop-blur-xl border border-yellow-400/50 rounded-xl p-4 shadow-lg shadow-yellow-500/20 max-w-sm"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />

        <div className="relative z-10 flex items-start gap-3">
          {/* Animated icon */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            className="flex-shrink-0 text-2xl mt-1"
          >
            {badge.icon}
          </motion.div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-white text-lg">
                {badge.name}
              </h4>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Check className="w-5 h-5 text-green-400" />
              </motion.div>
            </div>
            <p className="text-sm text-gray-300">{badge.description}</p>

            {/* Badge tier badge */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-2 inline-block"
            >
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 uppercase tracking-wider">
                {badge.tier} tier
              </span>
            </motion.div>
          </div>

          {/* Sparkle animations */}
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatDelay: 1,
            }}
            className="text-yellow-300 text-xl"
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  const toastId = toast.custom(
    (t) => <AchievementToast />,
    {
      duration: 5000,
      position: "top-right",
    }
  );

  // Call onDismiss callback
  setTimeout(() => onDismiss(badge), 5000);

  return toastId;
};

/**
 * Show multiple achievement notifications
 * @param {Array} badges - Array of badge objects
 * @param {number} delayBetween - Delay between notifications in ms
 */
export const showMultipleAchievementNotifications = (
  badges = [],
  delayBetween = 1500
) => {
  badges.forEach((badge, index) => {
    setTimeout(() => {
      showAchievementNotification(badge);
    }, index * delayBetween);
  });
};

/**
 * Show achievement milestone notification
 * @param {number} percentage - Achievement percentage
 */
export const showMilestoneNotification = (percentage) => {
  const MilestoneToast = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 backdrop-blur-xl border border-purple-400/50 rounded-xl p-4 shadow-lg shadow-purple-500/20"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl"
        >
          ⭐
        </motion.div>
        <div>
          <p className="font-bold text-white">Milestone Reached!</p>
          <p className="text-sm text-gray-300">
            You've reached {percentage}% achievement completion
          </p>
        </div>
      </div>
    </motion.div>
  );

  toast.custom((t) => <MilestoneToast />, {
    duration: 4000,
    position: "top-center",
  });
};

/**
 * Achievement notification component for inline display
 */
export const AchievementNotificationInline = ({ badge, onClose = () => {} }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-600/20 backdrop-blur-xl border border-yellow-400/50 rounded-xl p-6 shadow-2xl shadow-yellow-500/20 w-full max-w-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="text-4xl flex-shrink-0"
            >
              {badge.icon}
            </motion.div>

            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                🎉 {badge.name} Unlocked!
              </h3>
              <p className="text-sm text-gray-300 mb-2">
                {badge.description}
              </p>
              <div className="inline-block px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-semibold uppercase">
                {badge.tier} Tier Achievement
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Animated progress bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 5 }}
          origin="left"
          className="h-1 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-full mt-4"
        />
      </div>
    </motion.div>
  );
};

export default showAchievementNotification;
