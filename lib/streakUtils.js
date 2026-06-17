export function normalizeStreakCount(value, fallback = 0) {
  let parsed = Number.NaN;
  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string" && value.trim() !== "") {
    parsed = Number(value.trim());
  }

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function getStreakBadge(streak) {
  const count = normalizeStreakCount(streak);

  if (count >= 100) {
    return "🏆 Learning Master";
  }

  if (count >= 30) {
    return "🥇 Study Champion";
  }

  if (count >= 7) {
    return "🎖 Consistent Learner";
  }

  return "";
}

export function getNextMilestone(streak) {
  const count = normalizeStreakCount(streak);

  if (count < 7) return 7;
  if (count < 30) return 30;
  if (count < 100) return 100;

  return null;
}