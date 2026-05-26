import {
  getWeekdaysSince,
  initializeUserStats,
  updateUserStat,
  recalculateAttendanceRate,
} from "../statsService";

global.fetch = jest.fn();

describe("statsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getWeekdaysSince", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it("should calculate correct number of weekdays for a given start date", () => {
      jest.useFakeTimers().setSystemTime(new Date("2024-01-10T12:00:00Z"));
      const weekdays = getWeekdaysSince(new Date("2024-01-01T12:00:00Z"));
      expect(weekdays).toBe(8);
    });

    it("should default to start of year if no start date is provided", () => {
      jest.useFakeTimers().setSystemTime(new Date("2024-01-10T12:00:00Z"));
      const weekdays = getWeekdaysSince();
      expect(weekdays).toBe(8);
    });

    it("should return at least 1 even if checked exactly on Jan 1st of a weekend", () => {
      jest.useFakeTimers().setSystemTime(new Date("2023-01-01T12:00:00Z"));
      const weekdays = getWeekdaysSince();
      expect(weekdays).toBe(1);
    });
  });

  describe("initializeUserStats", () => {
    it("should do nothing if userId is falsy", async () => {
      await initializeUserStats(null);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should POST to /api/stats with initialize action", async () => {
      fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {} }) });
      await initializeUserStats("user123");
      expect(fetch).toHaveBeenCalledWith("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize" }),
      });
    });

    it("should throw on failure response", async () => {
      fetch.mockResolvedValue({ ok: false, json: async () => ({ error: "Failed" }) });
      await expect(initializeUserStats("user123")).rejects.toThrow("Failed");
    });
  });

  describe("updateUserStat", () => {
    it("should do nothing if userId is falsy", async () => {
      await updateUserStat(null, "Courses Enrolled");
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should POST to /api/stats with update action and field", async () => {
      fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {} }) });
      await updateUserStat("user123", "Study Hours", 2);
      expect(fetch).toHaveBeenCalledWith("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", statField: "Study Hours", value: 2 }),
      });
    });

    it("should default value to 1", async () => {
      fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {} }) });
      await updateUserStat("user123", "Courses Enrolled");
      expect(fetch).toHaveBeenCalledWith("/api/stats", expect.objectContaining({
        body: JSON.stringify({ action: "update", statField: "Courses Enrolled", value: 1 }),
      }));
    });
  });

  describe("recalculateAttendanceRate", () => {
    it("should return early if no userId", async () => {
      const result = await recalculateAttendanceRate(null);
      expect(result).toBeUndefined();
    });

    it("should POST to /api/stats with recalculateAttendance action", async () => {
      fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { rate: 87 } }) });
      const rate = await recalculateAttendanceRate("user123");
      expect(fetch).toHaveBeenCalledWith("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recalculateAttendance" }),
      });
      expect(rate).toBe(87);
    });

    it("should throw on failure response", async () => {
      fetch.mockResolvedValue({ ok: false, json: async () => ({ error: "Query failed" }) });
      await expect(recalculateAttendanceRate("user123")).rejects.toThrow("Query failed");
    });
  });
});
