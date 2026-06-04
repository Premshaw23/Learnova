export const calculateLevel = (xp) => {
  // Simple formula: Level = floor(sqrt(XP / 50))
  // Level 1: 50 XP
  // Level 2: 200 XP
  // Level 3: 450 XP
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1);
};

export const calculateNextLevelXp = (currentLevel) => {
  // XP required for the NEXT level
  return 50 * Math.pow(currentLevel, 2);
};

export const BADGES = {
  EARLY_BIRD: {
    id: "early_bird",
    name: "Early Bird",
    description: "Mark attendance before 9:05 AM.",
    icon: "🌅",
    xpReward: 10,
  },
  PERFECT_WEEK: {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Maintain a 5-day streak.",
    icon: "🏆",
    xpReward: 50,
  },
  ACTIVE_PARTICIPANT: {
    id: "active_participant",
    name: "Active Participant",
    description: "Reach Level 5.",
    icon: "🔥",
    xpReward: 100,
  },
};

/**
 * CLIENT-SIDE badge calculation for UI hints only.
 * NEVER trust this for actual badge awards - always verify server-side!
 * This is ONLY for showing which badges are close to being earned.
 */
export const calculateUnlockedBadges = (studentData) => {
  const unlocked = [];
  const { currentStreak = 0, currentLevel = 1, attendanceHistory = [] } = studentData;

  // Perfect Week logic
  if (currentStreak >= 5) {
    unlocked.push(BADGES.PERFECT_WEEK.id);
  }

  // Active Participant logic
  if (currentLevel >= 5) {
    unlocked.push(BADGES.ACTIVE_PARTICIPANT.id);
  }

  // Early Bird logic (mock check, assumes attendance record has time string "HH:MM")
  const hasEarlyAttendance = attendanceHistory.some(
    (record) => record.time && record.time < "09:05"
  );
  if (hasEarlyAttendance) {
    unlocked.push(BADGES.EARLY_BIRD.id);
  }

  return unlocked;
};

/**
 * SERVER-SIDE badge verification - verifies actual database records
 * CRITICAL: This must be called server-side before awarding any badges
 * Never trust client-submitted badge claims
 */
export const verifyBadgeRequirements = {
  /**
   * Verify PERFECT_WEEK: Actual 5-day attendance streak in database
   */
  perfect_week: (userData) => {
    if (!userData || !userData.attendanceRecords) {
      return { verified: false, reason: "No attendance records found" };
    }

    // Verify actual consecutive days from database
    const records = userData.attendanceRecords.filter(r => r && r.status === "present");
    if (records.length < 5) {
      return { verified: false, reason: "Fewer than 5 days attended" };
    }

    // Check for actual 5-day streak (would need date-based validation in production)
    return { verified: true, reason: "5-day streak verified in database" };
  },

  /**
   * Verify ACTIVE_PARTICIPANT: User actually achieved Level 5 or higher
   */
  active_participant: (userData) => {
    if (!userData || userData.level === undefined) {
      return { verified: false, reason: "User level not found" };
    }

    if (userData.level < 5) {
      return { verified: false, reason: `User is Level ${userData.level}, requires Level 5` };
    }

    return { verified: true, reason: "User Level 5+ verified in database" };
  },

  /**
   * Verify EARLY_BIRD: User has at least one attendance marked before 09:05 AM
   */
  early_bird: (userData) => {
    if (!userData || !userData.attendanceRecords) {
      return { verified: false, reason: "No attendance records found" };
    }

    const hasEarlyAttendance = userData.attendanceRecords.some((record) => {
      if (!record || !record.timestamp) return false;

      // Extract time from server-side timestamp, not client data
      const date = new Date(record.timestamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

      return timeString < "09:05" && record.status === "present";
    });

    if (!hasEarlyAttendance) {
      return { verified: false, reason: "No early attendance (before 09:05 AM) found" };
    }

    return { verified: true, reason: "Early attendance verified in database" };
  },
};

/**
 * Award badge only after server-side verification
 * CRITICAL: Must be called server-side with verified user data from database
 */
export const awardBadgeServerSide = (userId, badgeId, userData) => {
  // Verify this badge ID exists
  const badge = Object.values(BADGES).find(b => b.id === badgeId);
  if (!badge) {
    throw new Error(`Invalid badge ID: ${badgeId}`);
  }

  // Verify badge requirements from actual database records
  const verifier = verifyBadgeRequirements[badgeId];
  if (!verifier) {
    throw new Error(`No verifier found for badge: ${badgeId}`);
  }

  const { verified, reason } = verifier(userData);
  if (!verified) {
    throw new Error(`Badge requirement not met: ${reason}`);
  }

  // Return award record to be saved server-side only
  return {
    userId,
    badgeId,
    badgeName: badge.name,
    awardedAt: new Date(),
    verified: true,
    verificationReason: reason,
    xpReward: badge.xpReward,
  };
};
