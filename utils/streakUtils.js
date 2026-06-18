/**
 * Streak Calculation Utilities
 * 
 * Consecutive calendar days form a streak.
 * Current streak ends today or yesterday.
 * Longest streak is the maximum consecutive run.
 * Timezones are handled safely by standardizing calendar days to UTC midnight timestamps.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Helper function to parse YYYY-MM-DD date string timezone-safely into UTC midnight timestamp
 */
function parseDateToUTCMidnight(dateStr) {
  if (typeof dateStr !== "string" || !dateStr.trim()) return null;
  const parts = dateStr.trim().split("-");
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  return Date.UTC(year, month - 1, day);
}

/**
 * Calculates current streak in consecutive days based on calendar dates.
 * Current streak continues if the student has activity today or yesterday.
 * Duplicate dates are ignored.
 */
export function calculateCurrentStreak(activityDates) {
  if (!Array.isArray(activityDates) || activityDates.length === 0) return 0;

  const datesSet = new Set();
  activityDates.forEach((dateStr) => {
    const ts = parseDateToUTCMidnight(dateStr);
    if (ts !== null) {
      datesSet.add(ts);
    }
  });

  if (datesSet.size === 0) return 0;

  // Align client's local calendar day to UTC midnight
  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayUTC = todayUTC - MS_PER_DAY;

  // Determine starting point for current streak check
  let startDay = null;
  if (datesSet.has(todayUTC)) {
    startDay = todayUTC;
  } else if (datesSet.has(yesterdayUTC)) {
    startDay = yesterdayUTC;
  }

  if (startDay === null) {
    return 0;
  }

  let streak = 0;
  let currentCheck = startDay;

  while (datesSet.has(currentCheck)) {
    streak++;
    currentCheck -= MS_PER_DAY;
  }

  return streak;
}

/**
 * Calculates longest streak in consecutive calendar days.
 * Longest streak is the maximum run of consecutive active calendar days.
 */
export function calculateLongestStreak(activityDates) {
  if (!Array.isArray(activityDates) || activityDates.length === 0) return 0;

  const datesSet = new Set();
  activityDates.forEach((dateStr) => {
    const ts = parseDateToUTCMidnight(dateStr);
    if (ts !== null) {
      datesSet.add(ts);
    }
  });

  if (datesSet.size === 0) return 0;

  // Sort timestamps ascending (oldest first)
  const sortedTimestamps = Array.from(datesSet).sort((a, b) => a - b);

  let longestStreak = 0;
  let currentStreak = 0;
  let prevTimestamp = null;

  for (const ts of sortedTimestamps) {
    if (prevTimestamp === null) {
      currentStreak = 1;
    } else if (ts - prevTimestamp === MS_PER_DAY) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    
    longestStreak = Math.max(longestStreak, currentStreak);
    prevTimestamp = ts;
  }

  return longestStreak;
}
