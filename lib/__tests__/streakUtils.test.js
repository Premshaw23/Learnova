import { normalizeStreakCount } from "@/lib/streakUtils";

describe("normalizeStreakCount", () => {
  it("returns valid whole-number streak counts", () => {
    expect(normalizeStreakCount("7")).toBe(7);
    expect(normalizeStreakCount(12)).toBe(12);
  });

  it("floors decimal values instead of persisting fractional streaks", () => {
    expect(normalizeStreakCount("3.9")).toBe(3);
    expect(normalizeStreakCount(4.8)).toBe(4);
  });

  it("falls back for malformed, missing, or negative values", () => {
    expect(normalizeStreakCount("not-a-number")).toBe(0);
    expect(normalizeStreakCount("12days")).toBe(0);
    expect(normalizeStreakCount(undefined)).toBe(0);
    expect(normalizeStreakCount("-2")).toBe(0);
  });

  it("supports an explicit fallback", () => {
    expect(normalizeStreakCount("bad", 5)).toBe(5);
    expect(normalizeStreakCount("-0.5", 5)).toBe(5);
  });
});
