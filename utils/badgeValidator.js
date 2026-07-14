/**
 * Badge Consistency Validator
 * Ensures all badges are awarded only when requirements are truly met.
 * Prevents fraud through comprehensive data validation.
 */

import { BADGES, calculateLevel } from "./gamification";

/**
 * Validates badge requirements with comprehensive data integrity checks
 */
export class BadgeValidator {
  /**
   * Validate if a student can earn the EARLY_BIRD badge
   * Requirement: Mark attendance before 9:05 AM
   *
   * @param {Array} attendanceHistory - Array of attendance records with time property
   * @returns {Object} Validation result with isValid and reason
   */
  static validateEarlyBirdBadge(attendanceHistory) {
    if (!Array.isArray(attendanceHistory) || attendanceHistory.length === 0) {
      return {
        isValid: false,
        reason: "No attendance history provided",
      };
    }

    const validEarlyRecords = attendanceHistory.filter((record) => {
      // Validate record structure
      if (!record.time || typeof record.time !== "string") {
        return false;
      }

      // Parse time string (HH:MM format)
      const timeMatch = record.time.match(/^(\d{2}):(\d{2})$/);
      if (!timeMatch) {
        return false; // Invalid time format
      }

      const [, hours, minutes] = timeMatch;
      const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
      const nineOFiveMinutes = 9 * 60 + 5; // 545 minutes

      // Verify time is before 9:05 AM
      return totalMinutes < nineOFiveMinutes;
    });

    if (validEarlyRecords.length === 0) {
      return {
        isValid: false,
        reason: "No valid early morning attendance records found",
        validCount: 0,
        totalCount: attendanceHistory.length,
      };
    }

    return {
      isValid: true,
      reason: "Student has early morning attendance records",
      validCount: validEarlyRecords.length,
      totalCount: attendanceHistory.length,
    };
  }

  /**
   * Validate if a student can earn the PERFECT_WEEK badge
   * Requirement: Maintain a 5-day consecutive attendance streak
   *
   * @param {Object} studentData - Student data object
   * @returns {Object} Validation result with isValid and reason
   */
  static validatePerfectWeekBadge(studentData) {
    const {
      currentStreak = 0,
      attendanceHistory = [],
      lastAttendanceDate = null,
    } = studentData;

    // Validate streak count
    if (typeof currentStreak !== "number" || currentStreak < 5) {
      return {
        isValid: false,
        reason: "Current streak is less than required 5 days",
        currentStreak,
        requiredStreak: 5,
      };
    }

    // Verify streak is still valid (last attendance is recent)
    if (!lastAttendanceDate) {
      return {
        isValid: false,
        reason: "No recent attendance to validate active streak",
      };
    }

    const lastAttendance = new Date(lastAttendanceDate);
    const today = new Date();
    const daysSinceLastAttendance = Math.floor(
      (today - lastAttendance) / (1000 * 60 * 60 * 24)
    );

    // Streak is only valid if last attendance is from today or yesterday
    if (daysSinceLastAttendance > 1) {
      return {
        isValid: false,
        reason: "Streak is broken - last attendance was more than 1 day ago",
        daysSinceLastAttendance,
      };
    }

    // Verify consecutive attendance records exist
    if (!Array.isArray(attendanceHistory) || attendanceHistory.length < 5) {
      return {
        isValid: false,
        reason: "Insufficient attendance records to validate 5-day streak",
        recordCount: attendanceHistory.length,
      };
    }

    // Validate last 5 records are consecutive days
    const recentRecords = attendanceHistory.slice(-5);
    let isConsecutive = true;

    for (let i = 1; i < recentRecords.length; i++) {
      const prevDate = new Date(recentRecords[i - 1].date);
      const currDate = new Date(recentRecords[i].date);
      const dayDifference = Math.floor(
        (currDate - prevDate) / (1000 * 60 * 60 * 24)
      );

      // Days should be consecutive (1 day apart)
      if (dayDifference !== 1) {
        isConsecutive = false;
        break;
      }
    }

    if (!isConsecutive) {
      return {
        isValid: false,
        reason: "Attendance records are not consecutive days",
      };
    }

    return {
      isValid: true,
      reason:
        "Student has maintained a valid 5-day consecutive attendance streak",
      currentStreak,
      daysSinceLastAttendance,
    };
  }

  /**
   * Validate if a student can earn the ACTIVE_PARTICIPANT badge
   * Requirement: Reach Level 5
   *
   * @param {Object} studentData - Student data object
   * @returns {Object} Validation result with isValid and reason
   */
  static validateActiveParticipantBadge(studentData) {
    const { totalXp = 0, currentLevel = 1, xpHistory = [] } = studentData;

    // Validate current level
    if (typeof currentLevel !== "number" || currentLevel < 5) {
      return {
        isValid: false,
        reason: "Current level is less than required Level 5",
        currentLevel,
        requiredLevel: 5,
      };
    }

    // Verify XP calculation matches level
    const calculatedLevel = calculateLevel(totalXp);
    if (calculatedLevel !== currentLevel) {
      return {
        isValid: false,
        reason: "Level does not match total XP calculation",
        totalXp,
        calculatedLevel,
        reportedLevel: currentLevel,
      };
    }

    // Verify XP history is legitimate
    if (Array.isArray(xpHistory) && xpHistory.length > 0) {
      let cumulativeXp = 0;

      for (const entry of xpHistory) {
        if (typeof entry.xp !== "number" || entry.xp < 0) {
          return {
            isValid: false,
            reason: "Invalid XP entry in history",
            invalidEntry: entry,
          };
        }

        cumulativeXp += entry.xp;

        // XP should never decrease
        if (cumulativeXp < 0) {
          return {
            isValid: false,
            reason: "Cumulative XP became negative",
          };
        }
      }

      // Verify cumulative XP matches reported total
      if (cumulativeXp !== totalXp) {
        return {
          isValid: false,
          reason: "Reported total XP does not match XP history sum",
          reportedXp: totalXp,
          calculatedXp: cumulativeXp,
        };
      }
    }

    return {
      isValid: true,
      reason: "Student has legitimately reached Level 5",
      currentLevel,
      totalXp,
    };
  }

  /**
   * Validate all badges for a student
   * Comprehensive check of all earned badges
   *
   * @param {Array} earnedBadges - List of badge IDs earned by student
   * @param {Object} studentData - Complete student data object
   * @returns {Object} Comprehensive validation report
   */
  static validateAllBadges(earnedBadges, studentData) {
    const validationReport = {
      isValid: true,
      timestamp: new Date().toISOString(),
      earnedBadges,
      validations: {},
      fraudDetected: [],
    };

    // Validate each earned badge
    if (Array.isArray(earnedBadges)) {
      for (const badgeId of earnedBadges) {
        if (badgeId === BADGES.EARLY_BIRD.id) {
          const result = this.validateEarlyBirdBadge(
            studentData.attendanceHistory
          );
          validationReport.validations[badgeId] = result;
          if (!result.isValid) {
            validationReport.isValid = false;
            validationReport.fraudDetected.push({
              badge: badgeId,
              reason: result.reason,
            });
          }
        } else if (badgeId === BADGES.PERFECT_WEEK.id) {
          const result = this.validatePerfectWeekBadge(studentData);
          validationReport.validations[badgeId] = result;
          if (!result.isValid) {
            validationReport.isValid = false;
            validationReport.fraudDetected.push({
              badge: badgeId,
              reason: result.reason,
            });
          }
        } else if (badgeId === BADGES.ACTIVE_PARTICIPANT.id) {
          const result = this.validateActiveParticipantBadge(studentData);
          validationReport.validations[badgeId] = result;
          if (!result.isValid) {
            validationReport.isValid = false;
            validationReport.fraudDetected.push({
              badge: badgeId,
              reason: result.reason,
            });
          }
        } else {
          validationReport.validations[badgeId] = {
            isValid: false,
            reason: "Unknown badge ID",
          };
          validationReport.isValid = false;
        }
      }
    }

    return validationReport;
  }

  /**
   * Calculate legitimate badges based on student data
   * Uses comprehensive validation to determine correct badges
   *
   * @param {Object} studentData - Complete student data object
   * @returns {Array} Array of legitimate badge IDs
   */
  static calculateLegitimateBadges(studentData) {
    const legitimateBadges = [];

    // Check EARLY_BIRD
    if (this.validateEarlyBirdBadge(studentData.attendanceHistory).isValid) {
      legitimateBadges.push(BADGES.EARLY_BIRD.id);
    }

    // Check PERFECT_WEEK
    if (this.validatePerfectWeekBadge(studentData).isValid) {
      legitimateBadges.push(BADGES.PERFECT_WEEK.id);
    }

    // Check ACTIVE_PARTICIPANT
    if (this.validateActiveParticipantBadge(studentData).isValid) {
      legitimateBadges.push(BADGES.ACTIVE_PARTICIPANT.id);
    }

    return legitimateBadges;
  }
}

/**
 * Enhanced badge calculation with verification
 * Replaces original calculateUnlockedBadges with comprehensive validation
 *
 * @param {Object} studentData - Complete student data object
 * @returns {Object} Result with badges and validation details
 */
export const calculateVerifiedBadges = (studentData) => {
  const legitimateBadges =
    BadgeValidator.calculateLegitimateBadges(studentData);
  const validation = BadgeValidator.validateAllBadges(
    legitimateBadges,
    studentData
  );

  return {
    badges: legitimateBadges,
    validation,
    fraudDetected: validation.fraudDetected.length > 0,
  };
};
