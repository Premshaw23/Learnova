import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateConsecutiveAttendance,
  calculateEarlyBirdCount,
  calculateAttendancePercentage,
  calculateBadgeProgress,
  getNewlyUnlockedBadges,
} from "./badgeEngine";

// Mock statsService
vi.mock("@/services/statsService", () => ({
  getWeekdaysSince: vi.fn(() => 100),
}));

describe("badgeEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateConsecutiveAttendance", () => {
    it("returns 0 for empty array", () => {
      expect(calculateConsecutiveAttendance([])).toBe(0);
    });

    it("calculates consecutive weekdays correctly backwards from today", () => {
      // Set system time to a fixed Wednesday
      const wednesday = new Date("2026-06-24T12:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(wednesday);

      const records = [
        { date: "2026-06-24" }, // Wednesday
        { date: "2026-06-23" }, // Tuesday
        { date: "2026-06-22" }, // Monday
        { date: "2026-06-19" }, // Friday
        { date: "2026-06-18" }, // Thursday
      ];
      expect(calculateConsecutiveAttendance(records)).toBe(5);

      vi.useRealTimers();
    });
  });

  describe("calculateEarlyBirdCount", () => {
    it("returns 0 for empty array", () => {
      expect(calculateEarlyBirdCount([])).toBe(0);
    });

    it("counts records before 8:00 AM", () => {
      const earlyDate1 = new Date();
      earlyDate1.setDate(earlyDate1.getDate() - 1);
      earlyDate1.setHours(7, 30, 0, 0);

      const earlyDate2 = new Date();
      earlyDate2.setHours(8, 0, 0, 0);

      const lateDate = new Date();
      lateDate.setHours(8, 15, 0, 0);

      const records = [
        { timestamp: earlyDate1.toISOString() },
        { timestamp: earlyDate2.toISOString() },
        { timestamp: lateDate.toISOString() },
      ];
      expect(calculateEarlyBirdCount(records)).toBe(2);
    });
  });

  describe("calculateAttendancePercentage", () => {
    it("returns 0 for empty array", () => {
      expect(calculateAttendancePercentage([])).toBe(0);
    });

    it("calculates percentage relative to getWeekdaysSince()", () => {
      const records = [
        { date: "2026-05-28" },
        { date: "2026-05-27" },
      ];
      // getWeekdaysSince is mocked to 100, so 2 / 100 = 2%
      expect(calculateAttendancePercentage(records)).toBe(2);
    });
  });

  describe("calculateBadgeProgress", () => {
    it("returns correct progress schema for all badges", () => {
      const progress = calculateBadgeProgress([]);
      expect(progress).toHaveProperty("PERFECT_ATTENDANCE");
      expect(progress).toHaveProperty("EARLY_BIRD");
      expect(progress).toHaveProperty("CONSISTENCY_CHAMPION");
    });
  });

  describe("getNewlyUnlockedBadges", () => {
    it("returns empty array when no new badges unlocked", () => {
      const newBadges = getNewlyUnlockedBadges([], []);
      expect(newBadges).toEqual([]);
    });
  });
});
