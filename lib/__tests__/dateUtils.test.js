import { getLocalDateKey, getTodayKeyLocal } from "@/lib/dateUtils";

describe("dateUtils", () => {
  describe("getLocalDateKey", () => {
    test("returns IST date for midnight-crossing scenario (12:10 AM IST = previous day UTC)", () => {
      // May 25, 18:40 UTC = May 26, 00:10 IST
      const timestamp = Date.parse("2026-05-25T18:40:00Z");
      const result = getLocalDateKey(timestamp, "Asia/Kolkata");
      expect(result).toBe("2026-05-26");
    });

    test("returns same date when both UTC and IST agree", () => {
      // May 25, 12:00 UTC = May 25, 17:30 IST
      const timestamp = Date.parse("2026-05-25T12:00:00Z");
      const result = getLocalDateKey(timestamp, "Asia/Kolkata");
      expect(result).toBe("2026-05-25");
    });

    test("returns UTC date when timezone is UTC", () => {
      // May 25, 18:40 UTC should be May 25 in UTC
      const timestamp = Date.parse("2026-05-25T18:40:00Z");
      const result = getLocalDateKey(timestamp, "UTC");
      expect(result).toBe("2026-05-25");
    });

    test("handles Date object input", () => {
      const date = new Date("2026-05-25T18:40:00Z");
      const result = getLocalDateKey(date, "Asia/Kolkata");
      expect(result).toBe("2026-05-26");
    });

    test("handles edge case: exactly midnight IST", () => {
      // Midnight IST = 18:30 UTC previous day
      const timestamp = Date.parse("2026-05-25T18:30:00Z");
      const result = getLocalDateKey(timestamp, "Asia/Kolkata");
      expect(result).toBe("2026-05-26");
    });

    test("handles edge case: 11:59 PM IST (just before midnight)", () => {
      // 11:59 PM IST = 18:29 UTC same day
      const timestamp = Date.parse("2026-05-25T18:29:00Z");
      const result = getLocalDateKey(timestamp, "Asia/Kolkata");
      expect(result).toBe("2026-05-25");
    });

    test("correctly formats with zero-padded month and day", () => {
      // Jan 5, 2026, 06:00 UTC = Jan 5, 11:30 IST
      const timestamp = Date.parse("2026-01-05T06:00:00Z");
      const result = getLocalDateKey(timestamp, "Asia/Kolkata");
      expect(result).toBe("2026-01-05");
    });

    test("handles US/Eastern timezone correctly", () => {
      // May 26, 03:00 UTC = May 25, 11:00 PM ET (EDT, UTC-4)
      const timestamp = Date.parse("2026-05-26T03:00:00Z");
      const result = getLocalDateKey(timestamp, "America/New_York");
      expect(result).toBe("2026-05-25");
    });

    test("defaults to current time when no timestamp provided", () => {
      const result = getLocalDateKey(undefined, "Asia/Kolkata");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test("matches the old sync route inline Intl logic exactly", () => {
      // Reproduce the exact inline logic from the old sync route
      const queuedAt = Date.parse("2026-05-25T19:00:00Z"); // 12:30 AM IST May 26
      const timeZone = "Asia/Kolkata";

      // Old inline logic
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const parts = formatter.formatToParts(new Date(queuedAt));
      const year = parts.find((p) => p.type === "year").value;
      const month = parts.find((p) => p.type === "month").value;
      const day = parts.find((p) => p.type === "day").value;
      const oldResult = `${year}-${month}-${day}`;

      // New utility
      const newResult = getLocalDateKey(queuedAt, timeZone);

      expect(newResult).toBe(oldResult);
    });
  });

  describe("getTodayKeyLocal", () => {
    test("returns a valid YYYY-MM-DD string", () => {
      const result = getTodayKeyLocal("Asia/Kolkata");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test("matches getLocalDateKey(Date.now())", () => {
      const now = Date.now();
      const tz = "Asia/Kolkata";
      // Allow for tiny time difference between calls
      const a = getTodayKeyLocal(tz);
      const b = getLocalDateKey(now, tz);
      expect(a).toBe(b);
    });
  });

  describe("online vs offline date consistency", () => {
    test("online and offline paths produce the same date key at midnight IST boundary", () => {
      // Simulate the critical scenario:
      // User checks in at 12:10 AM IST (18:40 UTC May 25)
      const captureTimeMs = Date.parse("2026-05-25T18:40:00Z");
      const tz = "Asia/Kolkata";

      // Online path: client calls getTodayKeyLocal() at capture time
      // We simulate by calling getLocalDateKey with the capture timestamp
      const onlineDate = getLocalDateKey(captureTimeMs, tz);

      // Offline path: queuedAt is saved as captureTimeMs, then server resolves date
      const offlineDate = getLocalDateKey(captureTimeMs, tz);

      expect(onlineDate).toBe(offlineDate);
      expect(onlineDate).toBe("2026-05-26"); // Both should be IST date
    });

    test("demonstrates the old bug: toISOString disagrees with Intl at midnight boundary", () => {
      const captureTimeMs = Date.parse("2026-05-25T18:40:00Z");

      // Old online path (broken): UTC-based
      const oldOnlineDate = new Date(captureTimeMs).toISOString().slice(0, 10);

      // Old offline path (correct): IST-based
      const offlineDate = getLocalDateKey(captureTimeMs, "Asia/Kolkata");

      // These SHOULD be the same but weren't — confirming the bug existed
      expect(oldOnlineDate).toBe("2026-05-25"); // UTC date
      expect(offlineDate).toBe("2026-05-26"); // IST date
      expect(oldOnlineDate).not.toBe(offlineDate); // The drift!
    });
  });
});
