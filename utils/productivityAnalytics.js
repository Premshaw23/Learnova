const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Returns chart-ready weekly focus data
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
 * Calculates total focus minutes
 */
export function getTotalFocusMinutes(sessions = []) {
  return sessions
    .filter((session) => session.type === "focus")
    .reduce((sum, session) => sum + session.duration, 0);
}

/**
 * Returns total completed focus sessions
 */
export function getCompletedFocusSessions(sessions = []) {
  return sessions.filter((session) => session.type === "focus").length;
}

/**
 * Calculates average focus session duration
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
 * Calculates consistency score
 * Based on active focus days within past 7 days
 */
export function getConsistencyScore(sessions = []) {
  const today = new Date();

  const last7Days = new Set();

  sessions.forEach((session) => {
    if (session.type !== "focus") return;

    const sessionDate = new Date(session.completedAt);

    const diffDays = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays < 7) {
      last7Days.add(sessionDate.toISOString().split("T")[0]);
    }
  });

  return Math.round((last7Days.size / 7) * 100);
}

/**
 * Calculates current focus streak
 */
export function getFocusStreak(sessions = []) {
  const focusDates = new Set(
    sessions
      .filter((session) => session.type === "focus")
      .map(
        (session) => new Date(session.completedAt).toISOString().split("T")[0]
      )
  );

  if (focusDates.size === 0) return 0;

  let streak = 0;

  const currentDate = new Date();

  while (true) {
    const dateKey = currentDate.toISOString().split("T")[0];

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
 * Detects user's most productive focus time
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
 * Returns productivity improvement percentage
 * comparing first half vs second half of sessions
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

  return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
}

/**
 * Returns daily average focus minutes
 */
export function getDailyAverage(sessions = []) {
  const totalFocusMinutes = getTotalFocusMinutes(sessions);

  const uniqueDays = new Set(
    sessions
      .filter((session) => session.type === "focus")
      .map(
        (session) => new Date(session.completedAt).toISOString().split("T")[0]
      )
  );

  if (uniqueDays.size === 0) return 0;

  return Math.round(totalFocusMinutes / uniqueDays.size);
}

/**
 * Returns formatted analytics summary object
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
