export const DEFAULT_WATER_GLASSES = 3;
export const WELLNESS_WATER_GOAL = 8;

const RECENT_MOOD_HISTORY_LIMIT = 6;

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const toAllowedMoodSet = (allowedMoodKeys) => new Set(allowedMoodKeys || []);

const parseInteger = (value) => {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const normalizeDailyGoals = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((goal) => {
      if (!isRecord(goal)) return null;

      const id = typeof goal.id === "string" ? goal.id.trim() : "";
      const text = typeof goal.text === "string" ? goal.text.trim() : "";
      if (!id || !text) return null;

      return {
        id,
        text,
        complete: goal.complete === true,
      };
    })
    .filter(Boolean);
};

export const normalizeMoodKey = (value, allowedMoodKeys, fallback = "happy") => {
  const allowedMoodSet = toAllowedMoodSet(allowedMoodKeys);
  const fallbackMood = typeof fallback === "string" ? fallback.trim() : "";
  let candidate = value;

  if (typeof candidate === "string") {
    const trimmed = candidate.trim();
    if (allowedMoodSet.has(trimmed)) return trimmed;

    if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
      try {
        candidate = JSON.parse(trimmed);
      } catch {
        return fallbackMood;
      }
    } else {
      candidate = trimmed;
    }
  }

  return typeof candidate === "string" && allowedMoodSet.has(candidate)
    ? candidate
    : fallbackMood;
};

export const normalizeMoodHistory = (value, allowedMoodKeys) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!isRecord(entry)) return null;

      const key = normalizeMoodKey(entry.key, allowedMoodKeys, "");
      const timestamp = typeof entry.timestamp === "string" ? entry.timestamp : "";
      if (!key || !timestamp || Number.isNaN(Date.parse(timestamp))) return null;

      return { key, timestamp };
    })
    .filter(Boolean)
    .slice(0, RECENT_MOOD_HISTORY_LIMIT);
};

export const normalizeWaterGlasses = (
  value,
  fallback = DEFAULT_WATER_GLASSES,
  goal = WELLNESS_WATER_GOAL,
) => {
  const maxGlasses = Math.max(parseInteger(goal) ?? WELLNESS_WATER_GOAL, 0);
  const parsedValue = parseInteger(value);

  if (parsedValue === null) {
    const fallbackValue = parseInteger(fallback) ?? DEFAULT_WATER_GLASSES;
    return clamp(fallbackValue, 0, maxGlasses);
  }

  return clamp(parsedValue, 0, maxGlasses);
};
