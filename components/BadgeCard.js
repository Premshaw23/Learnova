/**
 * components/BadgeCard.js
 * 
 * Displays a single badge with progress and unlock animations.
 * Supports both locked and unlocked states with responsive design.
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, Check } from "lucide-react";
import { formatBadgeProgress } from "@/lib/badgeEngine";

const BadgeCard = ({
  badge,
  isNew = false,
  onClick = () => {},
  showProgress = true,
  size = "default", // "default" | "small" | "large"
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showAnimation, setShowAnimation] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  // Size configurations
  const sizeConfig = {
    small: {
      card: "w-24 h-24 p-2",
      icon: "text-3xl",
      title: "text-xs",
      progress: "text-[10px]",
    },
    default: {
      card: "w-32 h-40 p-4",
      icon: "text-5xl",
      title: "text-sm",
      progress: "text-xs",
    },
    large: {
      card: "w-40 h-56 p-6",
      icon: "text-6xl",
      title: "text-base",
      progress: "text-sm",
    },
  };

  const config = sizeConfig[size] || sizeConfig.default;
  const { unlocked, icon, name, description, progress, current, criteria } = badge;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="relative cursor-pointer"
    >
      <AnimatePresence>
        {/* Unlock Animation */}
        {showAnimation && unlocked && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.2, opacity: 0 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`absolute inset-0 ${config.card} rounded-2xl border-2 border-yellow-400 bg-yellow-400/20 pointer-events-none`}
          />
        )}

        {/* Sparkle animation for new badges */}
        {showAnimation && unlocked && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="absolute -top-2 -right-2 text-yellow-400"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute -bottom-2 -left-2 text-yellow-400"
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Badge Card */}
      <motion.div
        className={`
          ${config.card}
          rounded-2xl
          backdrop-blur-xl
          border
          relative
          overflow-hidden
          transition-all
          duration-300
          flex
          flex-col
          items-center
          justify-center
          group
          ${
            unlocked
              ? `bg-gradient-to-br ${badge.color} border-yellow-400/30 shadow-lg shadow-yellow-500/20`
              : "bg-gradient-to-br from-gray-700/30 to-gray-800/30 border-gray-600/30 grayscale opacity-60 shadow-lg shadow-gray-900/20"
          }
        `}
      >
        {/* Background glow for unlocked badges */}
        {unlocked && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br from-yellow-300 via-transparent to-transparent pointer-events-none" />
        )}

        {/* Lock icon for locked badges */}
        {!unlocked && (
          <motion.div
            className="absolute top-2 right-2 z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Lock className="w-4 h-4 text-gray-400" />
          </motion.div>
        )}

        {/* Unlock checkmark */}
        {unlocked && (
          <motion.div
            className="absolute top-2 right-2 z-10 bg-green-500 rounded-full p-1"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.3 }}
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}

        {/* Badge Icon */}
        <motion.div
          className={`${config.icon} mb-2 z-10`}
          animate={isHovered && unlocked ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {icon}
        </motion.div>

        {/* Badge Name */}
        <h3
          className={`${config.title} font-bold text-center text-white mb-1 line-clamp-2 z-10`}
        >
          {name}
        </h3>

        {/* Progress Bar (only in default/large sizes) */}
        {showProgress && size !== "small" && (
          <motion.div className="w-full mt-2 z-10">
            <div className="h-1.5 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <p className={`${config.progress} text-gray-100 mt-1 text-center font-semibold`}>
              {formatBadgeProgress(badge)}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {isHovered && size === "default" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-50 pointer-events-none"
          >
            <div className="bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-lg p-2 text-xs text-gray-100 whitespace-nowrap">
              {description}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BadgeCard;
