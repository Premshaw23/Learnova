import { describe, it, expect } from "vitest";
import {
  predictStudentAttendance,
  getAttendanceProjection,
} from "../attendanceUtils";

describe("getAttendanceProjection", () => {
  it("reports how many classes can be safely skipped", () => {
    const result = getAttendanceProjection(9, 10, 75);
    expect(result.percentage).toBe(90);
    expect(result.status).toBe("excellent");
    expect(result.canSkip).toBe(2); // 9/12 = 75% ok, 9/13 fails
    expect(result.mustAttend).toBe(0);
  });

  it("does not allow skipping when a skip would drop below threshold", () => {
    const result = getAttendanceProjection(8, 10, 75);
    expect(result.canSkip).toBe(0); // 80%; skipping one -> 72.7%
  });

  it("reports how many classes must be attended to recover", () => {
    expect(getAttendanceProjection(6, 10, 75).mustAttend).toBe(6); // (6+6)/16 = 75%
    expect(getAttendanceProjection(7, 10, 75).mustAttend).toBe(2); // (7+2)/12 = 75%
    expect(getAttendanceProjection(6, 10, 75).canSkip).toBe(0);
  });

  it("handles zero total gracefully", () => {
    expect(getAttendanceProjection(0, 0, 75)).toEqual({
      percentage: 0,
      status: "critical",
      canSkip: 0,
      mustAttend: 0,
    });
  });

  it("clamps invalid or out-of-range input without throwing", () => {
    const negative = getAttendanceProjection(-5, 10, 75);
    expect(negative.percentage).toBe(0);
    expect(negative.mustAttend).toBeGreaterThan(0);

    const over = getAttendanceProjection(12, 10, 75);
    expect(over.percentage).toBe(100);
    expect(over.mustAttend).toBe(0);
  });
});

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
    expect(() => predictStudentAttendance(null)).toThrow(
      "Records must be an array"
    );
    expect(() => predictStudentAttendance("invalid")).toThrow(
      "Records must be an array"
    );
  });
});
