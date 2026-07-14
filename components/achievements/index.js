/**
 * components/achievements/index.js
 * 
 * Barrel export for all achievement-related components and utilities.
 * Simplifies imports throughout the application.
 */

export { default as BadgeCard } from "../BadgeCard";
export { default as AchievementProgress } from "../AchievementProgress";
export { default as StudentAchievementCard } from "../StudentAchievementCard";
export {
  showAchievementNotification,
  showMultipleAchievementNotifications,
  showMilestoneNotification,
  AchievementNotificationInline,
} from "../AchievementNotification";

// Export badge engine functions
export {
  BADGE_DEFINITIONS,
  calculateBadgeProgress,
  calculateConsecutiveAttendance,
  calculateEarlyBirdCount,
  calculateAttendancePercentage,
  getBadgesWithProgress,
  getNewlyUnlockedBadges,
  formatBadgeProgress,
  getBadgeStatistics,
} from "@/lib/badgeEngine";

// Export custom hooks
export { default as useAchievements } from "@/hooks/useAchievements";
