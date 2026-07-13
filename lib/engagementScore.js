export const DEFAULT_ENGAGEMENT_WEIGHTS = {
  attendance: 0.3,
  activity: 0.2,
  assignment: 0.25,
  academic: 0.25,
};

export function normalizeEngagementWeights(weights = {}) {
  const normalized = {
    attendance: Number(weights.attendance ?? DEFAULT_ENGAGEMENT_WEIGHTS.attendance),
    activity: Number(weights.activity ?? DEFAULT_ENGAGEMENT_WEIGHTS.activity),
    assignment: Number(weights.assignment ?? DEFAULT_ENGAGEMENT_WEIGHTS.assignment),
    academic: Number(weights.academic ?? DEFAULT_ENGAGEMENT_WEIGHTS.academic),
  };

  const total =
    normalized.attendance +
    normalized.activity +
    normalized.assignment +
    normalized.academic;

  if (total <= 0) {
    return { ...DEFAULT_ENGAGEMENT_WEIGHTS };
  }

  return {
    attendance: normalized.attendance / total,
    activity: normalized.activity / total,
    assignment: normalized.assignment / total,
    academic: normalized.academic / total,
  };
}

export function normalizeScore(value) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
}

export function calculateEngagementScore(
  scorePayload = {},
  weightsPayload = DEFAULT_ENGAGEMENT_WEIGHTS
) {
  const attendanceScore = normalizeScore(scorePayload.attendanceScore);
  const activityScore = normalizeScore(scorePayload.activityScore);
  const assignmentScore = normalizeScore(scorePayload.assignmentScore);
  const academicScore = normalizeScore(scorePayload.academicScore);
  const weights = normalizeEngagementWeights(weightsPayload);

  const overall =
    attendanceScore * weights.attendance +
    activityScore * weights.activity +
    assignmentScore * weights.assignment +
    academicScore * weights.academic;

  return {
    attendanceScore,
    activityScore,
    assignmentScore,
    academicScore,
    overallScore: normalizeScore(overall),
    weights: weights,
  };
}

export function getEngagementCategory(score) {
  const normalized = normalizeScore(score);

  if (normalized >= 90) {
    return "Excellent";
  }
  if (normalized >= 75) {
    return "Good";
  }
  if (normalized >= 60) {
    return "Moderate";
  }
  return "Needs Attention";
}

export function getEngagementTrend(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      trend: "stable",
      change: 0,
      latest: null,
      previous: null,
      history: [],
    };
  }

  const sorted = [...history].sort(
    (a, b) => new Date(a.calculatedAt) - new Date(b.calculatedAt)
  );

  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : latest;
  const change = normalizeScore(latest.overallScore) - normalizeScore(previous.overallScore);
  let trend = "stable";

  if (change >= 5) {
    trend = "improving";
  } else if (change <= -5) {
    trend = "declining";
  }

  return {
    trend,
    change: Math.round(change * 100) / 100,
    latest,
    previous,
    history: sorted.map((entry) => ({
      date: new Date(entry.calculatedAt).toLocaleDateString([], {
        month: "short",
        day: "numeric",
      }),
      score: normalizeScore(entry.overallScore),
    })),
  };
}
