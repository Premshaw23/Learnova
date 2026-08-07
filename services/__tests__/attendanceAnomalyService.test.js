import { describe, it, expect, beforeEach } from "vitest";
import { AttendanceAnomalyDetector } from "../attendanceAnomalyService";

describe("AttendanceAnomalyDetector Unit Tests", () => {
  let detector;

  beforeEach(() => {
    detector = new AttendanceAnomalyDetector({
      consecutiveAbsenceThreshold: 3,
      attendanceRateWarningThreshold: 75.0,
    });
  });

  it("should return default summary when empty records are passed", () => {
    const res = detector.detectAnomalies([]);
    expect(res.hasAnomaly).toBe(false);
    expect(res.summary.totalRecords).toBe(0);
  });

  it("should detect consecutive absence spikes and generate instructor alerts", () => {
    const records = [
      {
        studentId: "s1",
        studentName: "Alice",
        date: "2026-08-01",
        status: "present",
      },
      {
        studentId: "s1",
        studentName: "Alice",
        date: "2026-08-02",
        status: "absent",
      },
      {
        studentId: "s1",
        studentName: "Alice",
        date: "2026-08-03",
        status: "absent",
      },
      {
        studentId: "s1",
        studentName: "Alice",
        date: "2026-08-04",
        status: "absent",
      },
    ];

    const res = detector.detectAnomalies(records);
    expect(res.hasAnomaly).toBe(true);
    expect(res.summary.maxConsecutiveAbsences).toBe(3);
    expect(res.alerts.length).toBeGreaterThan(0);
    expect(res.alerts[0]).toContain("Alice has missed 3 consecutive sessions");
  });

  it("should detect low attendance rate warning threshold breach", () => {
    const records = [
      {
        studentId: "s2",
        studentName: "Bob",
        date: "2026-08-01",
        status: "present",
      },
      {
        studentId: "s2",
        studentName: "Bob",
        date: "2026-08-02",
        status: "absent",
      },
      {
        studentId: "s2",
        studentName: "Bob",
        date: "2026-08-03",
        status: "present",
      },
      {
        studentId: "s2",
        studentName: "Bob",
        date: "2026-08-04",
        status: "absent",
      },
    ];

    const res = detector.detectAnomalies(records);
    expect(res.hasAnomaly).toBe(true);
    expect(res.summary.attendancePercentage).toBe(50.0);
    expect(
      res.alerts.some((a) => a.includes("WARNING: Overall attendance rate"))
    ).toBe(true);
  });
});
