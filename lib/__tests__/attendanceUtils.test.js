import { describe, it, expect } from "vitest";
import { predictStudentAttendance } from "../attendanceUtils";

describe("predictStudentAttendance", () => {
  it("should handle empty records correctly", () => {
    const result = predictStudentAttendance([], 75);
    expect(result.projectedPercentage).toBe(100);
    expect(result.riskLevel).toBe("low");
    expect(result.trend).toBe("stable");
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("should handle fewer than 5 records without establishing trend", () => {
    const records = [
      { date: "2026-06-01", status: "present" },
      { date: "2026-06-02", status: "present" },
      { date: "2026-06-03", status: "absent" },
    ];
    // 2/3 = 67% (rounded)
    const result = predictStudentAttendance(records, 75);
    expect(result.projectedPercentage).toBe(67);
    expect(result.riskLevel).toBe("high");
    expect(result.trend).toBe("stable");
  });

  it("should detect stable trend with high attendance", () => {
    const records = [
      { date: "2026-06-01", status: "present" },
      { date: "2026-06-02", status: "present" },
      { date: "2026-06-03", status: "present" },
      { date: "2026-06-04", status: "present" },
      { date: "2026-06-05", status: "present" },
    ];
    const result = predictStudentAttendance(records, 75);
    expect(result.projectedPercentage).toBe(100);
    expect(result.riskLevel).toBe("low");
    expect(result.trend).toBe("stable");
  });

  it("should detect declining trend correctly", () => {
    const records = [
      { date: "2026-06-01", status: "present" },
      { date: "2026-06-02", status: "present" },
      { date: "2026-06-03", status: "present" },
      { date: "2026-06-04", status: "present" },
      { date: "2026-06-05", status: "present" },
      { date: "2026-06-06", status: "absent" },
      { date: "2026-06-07", status: "absent" },
      { date: "2026-06-08", status: "absent" },
      { date: "2026-06-09", status: "absent" },
      { date: "2026-06-10", status: "absent" },
    ];
    // Overall: 5/10 = 50%
    // Recent: 0/5 = 0%
    // Projected over next 10: 5 / 20 = 25%
    const result = predictStudentAttendance(records, 75);
    expect(result.projectedPercentage).toBe(25);
    expect(result.riskLevel).toBe("high");
    expect(result.trend).toBe("declining");
  });

  it("should detect improving trend correctly", () => {
    const records = [
      { date: "2026-06-01", status: "absent" },
      { date: "2026-06-02", status: "absent" },
      { date: "2026-06-03", status: "absent" },
      { date: "2026-06-04", status: "absent" },
      { date: "2026-06-05", status: "absent" },
      { date: "2026-06-06", status: "present" },
      { date: "2026-06-07", status: "present" },
      { date: "2026-06-08", status: "present" },
      { date: "2026-06-09", status: "present" },
      { date: "2026-06-10", status: "present" },
    ];
    // Overall: 5/10 = 50%
    // Recent: 5/5 = 100%
    // Projected over next 10: (5 + 10) / 20 = 75%
    const result = predictStudentAttendance(records, 75);
    expect(result.projectedPercentage).toBe(75);
    expect(result.riskLevel).toBe("moderate");
    expect(result.trend).toBe("improving");
  });

  it("should validate that incorrect parameters throw errors", () => {
    expect(() => predictStudentAttendance(null)).toThrow("Records must be an array");
    expect(() => predictStudentAttendance("invalid")).toThrow("Records must be an array");
  });
});
