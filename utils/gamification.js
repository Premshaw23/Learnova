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

export const calculateUnlockedBadges = (studentData) => {
  const unlocked = [];
  const {
    currentStreak = 0,
    currentLevel = 1,
    attendanceHistory = [],
  } = studentData;

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
