/**
 * lib/badge-verification.js
 *
 * Badge verification logic to ensure students meet all requirements before
 * badges are awarded. Prevents badge fraud and false credential claims.
 *
 * This module validates:
 * - Early Bird: Verified attendance before 9:05 AM
 * - Perfect Week: Actual 5+ day streak with validated attendance records
 * - Active Participant: Level 5+ with verified XP calculation
 */

import { BADGES, calculateLevel } from '@/utils/gamification';

/**
 * Verify early bird badge requirements.
 * Student must have at least one verified attendance before 9:05 AM.
 * @param {Object} studentData - Student document with attendanceHistory
 * @returns {boolean} True if early bird requirements are met
 */
export function verifyEarlyBirdRequirements(studentData) {
  const { attendanceHistory = [] } = studentData;

  if (!Array.isArray(attendanceHistory) || attendanceHistory.length === 0) {
    return false;
  }

  return attendanceHistory.some((record) => {
    // Verify record has required fields
    if (!record.time || typeof record.time !== 'string') {
      return false;
    }

    // Verify time format HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(record.time)) {
      return false;
    }

    // Check if before 9:05 AM
    return record.time < '09:05';
  });
}

/**
 * Verify perfect week badge requirements.
 * Student must have a verified streak of 5+ days.
 * @param {Object} studentData - Student document with streak info
 * @returns {boolean} True if perfect week requirements are met
 */
export function verifyPerfectWeekRequirements(studentData) {
  const { currentStreak = 0, lastAttendanceDate } = studentData;

  // Streak must be at least 5
  if (currentStreak < 5) {
    return false;
  }

  // Streak must be current (last attendance within last 24 hours)
  if (!lastAttendanceDate) {
    return false;
  }

  const lastDate = new Date(lastAttendanceDate);
  const now = new Date();
  const hoursSinceLastAttendance = (now - lastDate) / (1000 * 60 * 60);

  // Streak is only valid if attendance was marked in last 24 hours
  return hoursSinceLastAttendance <= 24;
}

/**
 * Verify active participant badge requirements.
 * Student must have verified level 5 or higher.
 * @param {Object} studentData - Student document with totalXp
 * @returns {boolean} True if active participant requirements are met
 */
export function verifyActiveParticipantRequirements(studentData) {
  const { totalXp = 0 } = studentData;

  // Validate XP is a positive number
  if (typeof totalXp !== 'number' || totalXp < 0) {
    return false;
  }

  // Calculate level from XP
  const currentLevel = calculateLevel(totalXp);

  // Must be level 5 or higher
  return currentLevel >= 5;
}

/**
 * Verify a specific badge's requirements.
 * @param {string} badgeId - ID of the badge to verify
 * @param {Object} studentData - Complete student document
 * @returns {Object} { isValid: boolean, reason: string }
 */
export function verifyBadgeRequirements(badgeId, studentData) {
  if (!badgeId || typeof badgeId !== 'string') {
    return { isValid: false, reason: 'Invalid badge ID' };
  }

  if (!studentData || typeof studentData !== 'object') {
    return { isValid: false, reason: 'Invalid student data' };
  }

  switch (badgeId) {
    case BADGES.EARLY_BIRD.id:
      if (verifyEarlyBirdRequirements(studentData)) {
        return { isValid: true, reason: 'Early bird requirements verified' };
      }
      return { isValid: false, reason: 'No verified early attendance records found' };

    case BADGES.PERFECT_WEEK.id:
      if (verifyPerfectWeekRequirements(studentData)) {
        return { isValid: true, reason: 'Perfect week requirements verified' };
      }
      return { isValid: false, reason: 'Streak does not meet 5-day requirement or is not current' };

    case BADGES.ACTIVE_PARTICIPANT.id:
      if (verifyActiveParticipantRequirements(studentData)) {
        return { isValid: true, reason: 'Active participant requirements verified' };
      }
      return { isValid: false, reason: 'Student level does not meet minimum level 5 requirement' };

    default:
      return { isValid: false, reason: `Unknown badge ID: ${badgeId}` };
  }
}

/**
 * Verify all unlocked badges for a student.
 * Returns only badges that pass validation.
 * @param {Array<string>} unlockedBadgeIds - List of badge IDs to verify
 * @param {Object} studentData - Complete student document
 * @returns {Array<string>} Verified badge IDs
 */
export function verifyAllUnlockedBadges(unlockedBadgeIds, studentData) {
  if (!Array.isArray(unlockedBadgeIds)) {
    return [];
  }

  return unlockedBadgeIds.filter((badgeId) => {
    const verification = verifyBadgeRequirements(badgeId, studentData);
    return verification.isValid;
  });
}
