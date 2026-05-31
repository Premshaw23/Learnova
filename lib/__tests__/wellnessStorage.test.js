import {
  DEFAULT_WATER_GLASSES,
  WELLNESS_WATER_GOAL,
  normalizeDailyGoals,
  normalizeMoodHistory,
  normalizeMoodKey,
  normalizeWaterGlasses,
} from "@/lib/wellnessStorage";

const moodKeys = ["happy", "calm", "tired", "stressed", "overwhelmed"];

describe("wellnessStorage", () => {
  describe("normalizeDailyGoals", () => {
    it("returns an empty list for wrong-shaped stored goals", () => {
      expect(normalizeDailyGoals({ bad: true })).toEqual([]);
      expect(normalizeDailyGoals("not-an-array")).toEqual([]);
      expect(normalizeDailyGoals(null)).toEqual([]);
    });

    it("keeps valid goals and removes invalid entries", () => {
      expect(
        normalizeDailyGoals([
          { id: "goal-1", text: " Hydrate ", complete: true },
          { id: "goal-2", text: "Stretch", complete: false },
          { id: "", text: "Missing id", complete: true },
          { id: "goal-3", text: "", complete: true },
          "bad",
        ]),
      ).toEqual([
        { id: "goal-1", text: "Hydrate", complete: true },
        { id: "goal-2", text: "Stretch", complete: false },
      ]);
    });
  });

  describe("normalizeMoodKey", () => {
    it("accepts valid raw and JSON-encoded mood keys", () => {
      expect(normalizeMoodKey("calm", moodKeys)).toBe("calm");
      expect(normalizeMoodKey("\"stressed\"", moodKeys)).toBe("stressed");
    });

    it("falls back for invalid mood keys", () => {
      expect(normalizeMoodKey("unknown", moodKeys)).toBe("happy");
      expect(normalizeMoodKey(null, moodKeys)).toBe("happy");
    });

    it("returns the provided fallback even when it is outside the allowlist", () => {
      expect(normalizeMoodKey("unknown", [], "calm")).toBe("calm");
      expect(normalizeMoodKey("unknown", ["happy"], "calm")).toBe("calm");
    });

    it("falls back when a quoted mood string cannot be parsed", () => {
      expect(normalizeMoodKey('"calm\\x"', moodKeys)).toBe("happy");
    });
  });

  describe("normalizeMoodHistory", () => {
    it("returns an empty list for wrong-shaped history", () => {
      expect(normalizeMoodHistory({ bad: true }, moodKeys)).toEqual([]);
      expect(normalizeMoodHistory("not-an-array", moodKeys)).toEqual([]);
    });

    it("keeps only valid mood history entries", () => {
      expect(
        normalizeMoodHistory(
          [
            { key: "happy", timestamp: "2026-05-29T10:00:00.000Z" },
            { key: "unknown", timestamp: "2026-05-29T10:01:00.000Z" },
            { key: "calm", timestamp: "invalid-date" },
            { key: "\"tired\"", timestamp: "2026-05-29T10:02:00.000Z" },
          ],
          moodKeys,
        ),
      ).toEqual([
        { key: "happy", timestamp: "2026-05-29T10:00:00.000Z" },
        { key: "tired", timestamp: "2026-05-29T10:02:00.000Z" },
      ]);
    });

    it("keeps only the six most recent stored entries", () => {
      const entries = Array.from({ length: 8 }, (_, index) => ({
        key: "happy",
        timestamp: `2026-05-29T10:0${index}:00.000Z`,
      }));

      expect(normalizeMoodHistory(entries, moodKeys)).toHaveLength(6);
    });
  });

  describe("normalizeWaterGlasses", () => {
    it("falls back for non-numeric values", () => {
      expect(normalizeWaterGlasses("not-a-number")).toBe(DEFAULT_WATER_GLASSES);
      expect(normalizeWaterGlasses(null)).toBe(DEFAULT_WATER_GLASSES);
    });

    it("clamps stored values within the water goal", () => {
      expect(normalizeWaterGlasses("-2")).toBe(0);
      expect(normalizeWaterGlasses("99")).toBe(WELLNESS_WATER_GOAL);
      expect(normalizeWaterGlasses("4.9")).toBe(4);
    });
  });
});
