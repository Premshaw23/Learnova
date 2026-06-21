/**
 * lib/badgeEngine.js
 * 
 * Core badge calculation and management engine.
 * Automatically calculates achievements based on attendance records.
 */

import { getWeekdaysSince } from "@/services/statsService";

/**
 * Badge definitions with criteria and metadata
 */
export const BADGE_DEFINITIONS = {
  PERFECT_ATTENDANCE: {
    id: "perfect_attendance",
    name: "Perfect Attendance",
    description: "Achieve 30 consecutive attendance days",
    icon: "🎯",
    color: "from-yellow-500 to-amber-600",
    tier: "gold",
    criteria: {
      type: "consecutive_attendance",
      threshold: 30,
    },
    unlocked: false,
    progress: 0,
    earnedDate: null,
  },
  EARLY_BIRD: {
    id: "early_bird",
    name: "Early Bird",
    description: "Attend before 8:00 AM on 10 different days",
    icon: "🌅",
    color: "from-orange-500 to-red-600",
    tier: "silver",
    criteria: {
      type: "early_attendance",
      threshold: 10,
      timeLimit: "08:00",
    },
    unlocked: false,
    progress: 0,
    earnedDate: null,
  },
  CONSISTENCY_CHAMPION: {
    id: "consistency_champion",
    name: "Consistency Champion",
    description: "Maintain 95%+ attendance during a semester",
    icon: "⭐",
    color: "from-blue-500 to-purple-600",
    tier: "platinum",
    criteria: {
      type: "attendance_percentage",
      threshold: 95,
      period: "semester",
    },
    unlocked: false,
    progress: 0,
    earnedDate: null,
  },
};

/**
 * Calculate badge progress from attendance records
 * @param {Array} attendanceRecords - Array of attendance records
 * @returns {Object} Badge progress data for all badges
 */
export function calculateBadgeProgress(attendanceRecords = []) {
  const badgeProgress = {};

  // Calculate Perfect Attendance (consecutive days)
  const consecutiveDays = calculateConsecutiveAttendance(attendanceRecords);
  badgeProgress.PERFECT_ATTENDANCE = {
    progress: Math.min(consecutiveDays, 30),
    unlocked: consecutiveDays >= 30,
    earnedDate: consecutiveDays >= 30 ? new Date() : null,
    current: consecutiveDays,
  };

  // Calculate Early Bird (before 8:00 AM)
  const earlyBirdCount = calculateEarlyBirdCount(attendanceRecords);
  badgeProgress.EARLY_BIRD = {
    progress: Math.min(earlyBirdCount, 10),
    unlocked: earlyBirdCount >= 10,
    earnedDate: earlyBirdCount >= 10 ? new Date() : null,
    current: earlyBirdCount,
  };

  // Calculate Consistency Champion (95% attendance)
  const attendancePercentage = calculateAttendancePercentage(attendanceRecords);
  badgeProgress.CONSISTENCY_CHAMPION = {
    progress: Math.min(attendancePercentage, 100),
    unlocked: attendancePercentage >= 95,
    earnedDate: attendancePercentage >= 95 ? new Date() : null,
    current: Math.round(attendancePercentage),
  };

  return badgeProgress;
}

/**
 * Calculate consecutive attendance days
 * @param {Array} attendanceRecords - Array of attendance records sorted by date (desc)
 * @returns {number} Number of consecutive days from today backwards
 */
export function calculateConsecutiveAttendance(attendanceRecords = []) {
  if (!attendanceRecords.length) return 0;

  // Sort records by date in descending order
  const sorted = [...attendanceRecords].sort((a, b) => {
    const dateA = new Date(a.date || a.timestamp);
    const dateB = new Date(b.date || b.timestamp);
    return dateB - dateA;
  });

  let consecutiveDays = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const record of sorted) {
    const recordDate = new Date(record.date || record.timestamp);
    recordDate.setHours(0, 0, 0, 0);

    // Skip non-weekdays
    const dayOfWeek = recordDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Check if this is the expected date
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(expectedDate.getDate() - consecutiveDays);

    if (recordDate.getTime() === expectedDate.getTime()) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  return consecutiveDays;
}

/**
 * Calculate early bird attendance count (before 8:00 AM)
 * @param {Array} attendanceRecords - Array of attendance records
 * @returns {number} Count of early arrivals
 */
export function calculateEarlyBirdCount(attendanceRecords = []) {
  if (!attendanceRecords.length) return 0;

  const earlyDates = new Set();

  for (const record of attendanceRecords) {
    const timestamp = record.timestamp || record.date;
    if (!timestamp) continue;

    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Check if before 8:00 AM
    if (hours < 8 || (hours === 8 && minutes === 0)) {
      const dateKey = date.toISOString().split("T")[0];
      earlyDates.add(dateKey);
    }
  }

  return earlyDates.size;
}

/**
 * Calculate attendance percentage
 * @param {Array} attendanceRecords - Array of attendance records
 * @returns {number} Attendance percentage (0-100)
 */
export function calculateAttendancePercentage(attendanceRecords = []) {
  if (!attendanceRecords.length) return 0;

  // Get unique dates with attendance
  const attendanceDates = new Set();
  for (const record of attendanceRecords) {
    const date = record.date || record.timestamp?.split("T")[0];
    if (date) attendanceDates.add(date);
  }

  // Calculate expected school days (weekdays only)
  const days = getWeekdaysSince();
  if (days === 0) return 0;

  const percentage = Math.round((attendanceDates.size / days) * 100);
  return Math.min(100, percentage);
}

/**
 * Get count of weekdays since start of semester/year
 * For simplicity, calculate from September (typical semester start)
 * @returns {number} Count of weekdays
 */
export function getSemesterWeekdays() {
  return getWeekdaysSince();
}

/**
 * Get badges with progress for a user
 * @param {Array} attendanceRecords - User's attendance records
 * @param {Array} earnedBadges - Previously earned badges (from DB)
 * @returns {Array} Array of badge objects with progress
 */
export function getBadgesWithProgress(attendanceRecords = [], earnedBadges = []) {
  const progress = calculateBadgeProgress(attendanceRecords);
  const earnedIds = new Set(earnedBadges.map((b) => b.id));

  return Object.entries(BADGE_DEFINITIONS).map(([key, badge]) => {
    const badgeProgress = progress[key];
    const isEarned = earnedIds.has(badge.id);

    return {
      ...badge,
      progress: badgeProgress.progress,
      current: badgeProgress.current,
      unlocked: isEarned || badgeProgress.unlocked,
      earnedDate: isEarned
        ? earnedBadges.find((b) => b.id === badge.id)?.earnedDate
        : badgeProgress.earnedDate,
    };
  });
}

/**
 * Get newly unlocked badges
 * @param {Array} attendanceRecords - User's attendance records
 * @param {Array} previouslyEarned - Previously earned badges
 * @returns {Array} Array of newly unlocked badges
 */
export function getNewlyUnlockedBadges(attendanceRecords = [], previouslyEarned = []) {
  const badges = getBadgesWithProgress(attendanceRecords, previouslyEarned);
  const earnedIds = new Set(previouslyEarned.map((b) => b.id));

  return badges.filter((badge) => badge.unlocked && !earnedIds.has(badge.id));
}

/**
 * Format badge progress for display
 * @param {Object} badge - Badge object
 * @returns {string} Formatted progress string
 */
export function formatBadgeProgress(badge) {
  const { criteria, progress, current } = badge;

  switch (criteria.type) {
    case "consecutive_attendance":
      return `${current}/${criteria.threshold} days`;
    case "early_attendance":
      return `${current}/${criteria.threshold} times`;
    case "attendance_percentage":
      return `${current}%/${criteria.threshold}%`;
    default:
      return `${Math.round(progress)}%`;
  }
}

/**
 * Get badge achievement statistics
 * @param {Array} badges - Array of badge objects
 * @returns {Object} Statistics about badges
 */
export function getBadgeStatistics(badges = []) {
  const stats = {
    total: badges.length,
    unlocked: badges.filter((b) => b.unlocked).length,
    locked: badges.filter((b) => !b.unlocked).length,
    averageProgress: Math.round(
      badges.reduce((sum, b) => sum + b.progress, 0) / Math.max(1, badges.length)
    ),
  };

  return stats;
}
