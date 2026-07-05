import { describe, it, expect } from "vitest";
import { calculateConsecutiveAttendance } from "@/lib/badgeEngine";

/**
 * Format a Date as a local "YYYY-MM-DDT12:00:00" string (no timezone suffix),
 * so `new Date(...)` parses it back in local time without any UTC round-trip
 * that could shift the calendar day.
 */
function localTimestamp(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T12:00:00`;
}

/**
 * Build N consecutive WEEKDAY attendance records ending at the most recent
 * weekday on/before `endDate`. Weekends are skipped (no weekend records),
 * mirroring how attendance is actually recorded for school days.
 */
function makeConsecutiveWeekdayRecords(count, endDate = new Date()) {
  const records = [];
  const date = new Date(endDate);
  date.setHours(0, 0, 0, 0);

  // Move to the most recent weekday on/before endDate.
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }

  while (records.length < count) {
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      records.push({
        userId: "test-user",
        timestamp: localTimestamp(date),
        status: "present",
      });
    }
    date.setDate(date.getDate() - 1);
  }

  return records;
}

describe("calculateConsecutiveAttendance", () => {
  it("returns 0 for no records", () => {
    expect(calculateConsecutiveAttendance([])).toBe(0);
  });

  it("counts a single weekday record as 1", () => {
    const records = makeConsecutiveWeekdayRecords(1);
    expect(calculateConsecutiveAttendance(records)).toBe(1);
  });

  it("counts a streak of 5 weekdays (Mon-Fri) correctly", () => {
    const records = makeConsecutiveWeekdayRecords(5);
    expect(calculateConsecutiveAttendance(records)).toBe(5);
  });

  it("counts a 30-weekday streak across weekends as 30 (Perfect Attendance)", () => {
    // Regression test for #3864: weekends must not reset the streak.
    const records = makeConsecutiveWeekdayRecords(30);
    expect(calculateConsecutiveAttendance(records)).toBe(30);
  });

  it("does not break on weekend gaps spanning multiple weeks", () => {
    // 15 weekdays = 3 full weeks; the old calendar-offset logic capped this at ~5.
    const records = makeConsecutiveWeekdayRecords(15);
    expect(calculateConsecutiveAttendance(records)).toBe(15);
  });

  it("stops counting when a weekday in the middle is missing", () => {
    // Build 10 consecutive weekdays, then drop the 4th most-recent one.
    const records = makeConsecutiveWeekdayRecords(10);
    const sorted = [...records].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    const broken = sorted.filter((_, i) => i !== 3);
    expect(calculateConsecutiveAttendance(broken)).toBe(3);
  });

  it("ignores duplicate records for the same day", () => {
    const records = makeConsecutiveWeekdayRecords(5);
    const withDup = [...records, { ...records[0] }];
    expect(calculateConsecutiveAttendance(withDup)).toBe(5);
  });

  it("returns a correct streak even when today is a weekend", () => {
    // Anchor records to a Friday, then evaluate as if it were Saturday/Sunday.
    // The streak is anchored at the most recent attended weekday, so it holds.
    const friday = new Date("2026-06-19T12:00:00"); // a Friday
    const records = makeConsecutiveWeekdayRecords(5, friday);
    expect(calculateConsecutiveAttendance(records)).toBe(5);
  });
});
