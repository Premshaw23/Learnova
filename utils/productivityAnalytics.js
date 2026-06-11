const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MAX_IMPROVEMENT_PERCENT = 500;

/**
 * Returns the local calendar date string (YYYY-MM-DD) for a Date object.
 * Uses local timezone consistently — avoids the UTC shift from toISOString().
 * @param {Date} date
 * @returns {string}
 */
function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns chart-ready weekly focus data bucketed by local day of week.
 * @param {Array} sessions
 * @returns {Array<{day: string, minutes: number}>}
 */
export function getWeeklyFocusData(sessions = []) {
  const dailyMap = {
    Sun: 0,
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
  };

  sessions.forEach((session) => {
    if (session.type !== "focus") return;
    const date = new Date(session.completedAt);
    const day = WEEK_DAYS[date.getDay()];
    dailyMap[day] += session.duration;
  });

  return WEEK_DAYS.map((day) => ({
    day,
    minutes: dailyMap[day],
  }));
}

/**
 * Calculates total focus minutes across all sessions.
 * @param {Array} sessions
 * @returns {number}
 */
export function getTotalFocusMinutes(sessions = []) {
  return sessions
    .filter((session) => session.type === "focus")
    .reduce((sum, session) => sum + session.duration, 0);
}

/**
 * Returns total number of completed focus sessions.
 * @param {Array} sessions
 * @returns {number}
 */
export function getCompletedFocusSessions(sessions = []) {
  return sessions.filter((session) => session.type === "focus").length;
}

/**
 * Calculates average focus session duration in minutes.
 * @param {Array} sessions
 * @returns {number}
 */
export function getAverageSessionDuration(sessions = []) {
  const focusSessions = sessions.filter((session) => session.type === "focus");
  if (focusSessions.length === 0) return 0;

  const totalDuration = focusSessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );

  return Math.round(totalDuration / focusSessions.length);
}

/**
 * Calculates consistency score based on active focus days within the past 7 local calendar days.
 * @param {Array} sessions
 * @returns {number} Percentage 0-100.
 */
export function getConsistencyScore(sessions = []) {
  const today = toLocalDateKey(new Date());
  const activeDays = new Set();

  sessions.forEach((session) => {
    if (session.type !== "focus") return;

    const sessionDate = new Date(session.completedAt);
    const sessionKey = toLocalDateKey(sessionDate);
    const todayDate = new Date(today);
    const diffMs = todayDate - new Date(sessionKey);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays < 7) {
      activeDays.add(sessionKey);
    }
  });

  return Math.round((activeDays.size / 7) * 100);
}

/**
 * Calculates current focus streak — consecutive local calendar days with at least one focus session.
 * @param {Array} sessions
 * @returns {number}
 */
export function getFocusStreak(sessions = []) {
  const focusDates = new Set(
    sessions
      .filter((session) => session.type === "focus")
      .map((session) => toLocalDateKey(new Date(session.completedAt)))
  );

  if (focusDates.size === 0) return 0;

  let streak = 0;
  const currentDate = new Date();

  while (true) {
    const dateKey = toLocalDateKey(currentDate);

    if (focusDates.has(dateKey)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Detects the user's most productive focus time period based on local hour.
 * @param {Array} sessions
 * @returns {string}
 */
export function getPeakFocusHours(sessions = []) {
  const buckets = {
    Morning: 0,
    Afternoon: 0,
    Evening: 0,
    Night: 0,
  };

  sessions.forEach((session) => {
    if (session.type !== "focus") return;

    const hour = new Date(session.completedAt).getHours();

    if (hour >= 5 && hour < 12) {
      buckets.Morning++;
    } else if (hour >= 12 && hour < 17) {
      buckets.Afternoon++;
    } else if (hour >= 17 && hour < 22) {
      buckets.Evening++;
    } else {
      buckets.Night++;
    }
  });

  let peakPeriod = "Morning";
  let highestCount = 0;

  Object.entries(buckets).forEach(([period, count]) => {
    if (count > highestCount) {
      highestCount = count;
      peakPeriod = period;
    }
  });

  return peakPeriod;
}

/**
 * Returns productivity improvement percentage comparing first half vs second half of sessions.
 * Clamped to +/-500% to prevent extreme values from near-zero averages.
 * @param {Array} sessions
 * @returns {number}
 */
export function getProductivityImprovement(sessions = []) {
  const focusSessions = sessions.filter((session) => session.type === "focus");

  if (focusSessions.length < 4) return 0;

  const midpoint = Math.floor(focusSessions.length / 2);

  const firstHalf = focusSessions.slice(0, midpoint);
  const secondHalf = focusSessions.slice(midpoint);

  const firstAvg =
    firstHalf.reduce((sum, session) => sum + session.duration, 0) /
    firstHalf.length;

  const secondAvg =
    secondHalf.reduce((sum, session) => sum + session.duration, 0) /
    secondHalf.length;

  if (firstAvg === 0) return 0;

  const improvement = Math.round(((secondAvg - firstAvg) / firstAvg) * 100);

  return Math.max(-MAX_IMPROVEMENT_PERCENT, Math.min(MAX_IMPROVEMENT_PERCENT, improvement));
}

/**
 * Returns daily average focus minutes across all unique local calendar days with sessions.
 * @param {Array} sessions
 * @returns {number}
 */
export function getDailyAverage(sessions = []) {
  const totalFocusMinutes = getTotalFocusMinutes(sessions);

  const uniqueDays = new Set(
    sessions
      .filter((session) => session.type === "focus")
      .map((session) => toLocalDateKey(new Date(session.completedAt)))
  );

  if (uniqueDays.size === 0) return 0;

  return Math.round(totalFocusMinutes / uniqueDays.size);
}

/**
 * Returns a complete analytics summary object for the productivity dashboard.
 * @param {Array} sessions
 * @returns {Object}
 */
export function getAnalyticsSummary(sessions = []) {
  return {
    totalFocusMinutes: getTotalFocusMinutes(sessions),
    completedFocusSessions: getCompletedFocusSessions(sessions),
    averageSessionDuration: getAverageSessionDuration(sessions),
    consistencyScore: getConsistencyScore(sessions),
    focusStreak: getFocusStreak(sessions),
    peakFocusHours: getPeakFocusHours(sessions),
    productivityImprovement: getProductivityImprovement(sessions),
    dailyAverage: getDailyAverage(sessions),
    weeklyFocusData: getWeeklyFocusData(sessions),
  };
}
