/**
 * attendanceAnomalyService.test.js
 *
 * Unit tests for the AI Attendance Anomaly Detection Service.
 * Resolves: https://github.com/Premshaw23/Learnova/issues/3438
 */

import {
  computeRollingAverage,
  detectTrendDirection,
  computeRiskScore,
  getRiskLevel,
  generateStudentAlerts,
  detectBatchAnomaly,
  analyzeAttendanceAnomalies,
  RISK_LEVELS,
  TREND_DIRECTIONS,
} from "../../services/attendanceAnomalyService";

// ─── computeRollingAverage ────────────────────────────────────────────────────

describe("computeRollingAverage", () => {
  it("returns empty array for empty input", () => {
    expect(computeRollingAverage([])).toEqual([]);
  });

  it("computes correct rolling average with window=4", () => {
    const rates = [80, 70, 60, 50, 40];
    const result = computeRollingAverage(rates, 4);
    expect(result[0]).toBe(80);
    expect(result[3]).toBe(parseFloat(((80 + 70 + 60 + 50) / 4).toFixed(2)));
    expect(result[4]).toBe(parseFloat(((70 + 60 + 50 + 40) / 4).toFixed(2)));
  });

  it("handles single element array", () => {
    expect(computeRollingAverage([90])).toEqual([90]);
  });
});

// ─── detectTrendDirection ─────────────────────────────────────────────────────

describe("detectTrendDirection", () => {
  it("returns STABLE for short input", () => {
    expect(detectTrendDirection([70])).toBe(TREND_DIRECTIONS.STABLE);
  });

  it("detects IMPROVING trend", () => {
    expect(detectTrendDirection([60, 65, 72])).toBe(TREND_DIRECTIONS.IMPROVING);
  });

  it("detects DECLINING trend", () => {
    expect(detectTrendDirection([80, 74, 70])).toBe(TREND_DIRECTIONS.DECLINING);
  });

  it("detects STABLE trend for small delta", () => {
    expect(detectTrendDirection([70, 71, 70])).toBe(TREND_DIRECTIONS.STABLE);
  });
});

// ─── getRiskLevel ─────────────────────────────────────────────────────────────

describe("getRiskLevel", () => {
  it("returns SAFE for attendance >= 75", () => {
    expect(getRiskLevel(80)).toBe(RISK_LEVELS.SAFE);
    expect(getRiskLevel(75)).toBe(RISK_LEVELS.SAFE);
  });

  it("returns AT_RISK for attendance between 65 and 75", () => {
    expect(getRiskLevel(70)).toBe(RISK_LEVELS.AT_RISK);
    expect(getRiskLevel(65)).toBe(RISK_LEVELS.AT_RISK);
  });

  it("returns CRITICAL for attendance < 65", () => {
    expect(getRiskLevel(60)).toBe(RISK_LEVELS.CRITICAL);
    expect(getRiskLevel(0)).toBe(RISK_LEVELS.CRITICAL);
  });
});

// ─── computeRiskScore ─────────────────────────────────────────────────────────

describe("computeRiskScore", () => {
  it("gives higher risk score for lower attendance", () => {
    const low = computeRiskScore({ currentRate: 50, trend: TREND_DIRECTIONS.STABLE });
    const high = computeRiskScore({ currentRate: 90, trend: TREND_DIRECTIONS.STABLE });
    expect(low).toBeGreaterThan(high);
  });

  it("penalizes declining trend", () => {
    const stable = computeRiskScore({ currentRate: 70, trend: TREND_DIRECTIONS.STABLE });
    const declining = computeRiskScore({ currentRate: 70, trend: TREND_DIRECTIONS.DECLINING });
    expect(declining).toBeGreaterThan(stable);
  });

  it("rewards improving trend", () => {
    const stable = computeRiskScore({ currentRate: 70, trend: TREND_DIRECTIONS.STABLE });
    const improving = computeRiskScore({ currentRate: 70, trend: TREND_DIRECTIONS.IMPROVING });
    expect(improving).toBeLessThan(stable);
  });

  it("caps at 100", () => {
    const score = computeRiskScore({
      currentRate: 0,
      trend: TREND_DIRECTIONS.DECLINING,
      subjectsAtRisk: 20,
    });
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ─── generateStudentAlerts ────────────────────────────────────────────────────

describe("generateStudentAlerts", () => {
  it("generates critical alert for CRITICAL level", () => {
    const alerts = generateStudentAlerts({
      name: "Alice",
      currentRate: 55,
      riskLevel: RISK_LEVELS.CRITICAL,
      classesNeeded: 10,
    });
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toContain("Critical");
  });

  it("generates warning alert for AT_RISK level", () => {
    const alerts = generateStudentAlerts({
      name: "Bob",
      currentRate: 68,
      riskLevel: RISK_LEVELS.AT_RISK,
      classesNeeded: 3,
    });
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toContain("Warning");
  });

  it("returns no alerts for SAFE level", () => {
    const alerts = generateStudentAlerts({
      name: "Carol",
      currentRate: 85,
      riskLevel: RISK_LEVELS.SAFE,
      classesNeeded: 0,
    });
    expect(alerts).toHaveLength(0);
  });
});

// ─── detectBatchAnomaly ───────────────────────────────────────────────────────

describe("detectBatchAnomaly", () => {
  it("detects batch anomaly when enough students are at risk", () => {
    const students = [
      { riskLevel: RISK_LEVELS.CRITICAL },
      { riskLevel: RISK_LEVELS.AT_RISK },
      { riskLevel: RISK_LEVELS.CRITICAL },
      { riskLevel: RISK_LEVELS.SAFE },
      { riskLevel: RISK_LEVELS.SAFE },
    ];
    const result = detectBatchAnomaly(students, 0.4);
    expect(result.detected).toBe(true);
  });

  it("does not trigger for low-risk class", () => {
    const students = [
      { riskLevel: RISK_LEVELS.SAFE },
      { riskLevel: RISK_LEVELS.SAFE },
      { riskLevel: RISK_LEVELS.SAFE },
      { riskLevel: RISK_LEVELS.AT_RISK },
    ];
    const result = detectBatchAnomaly(students, 0.4);
    expect(result.detected).toBe(false);
  });

  it("returns not detected for empty array", () => {
    expect(detectBatchAnomaly([])).toEqual({ detected: false });
  });
});

// ─── analyzeAttendanceAnomalies ───────────────────────────────────────────────

describe("analyzeAttendanceAnomalies", () => {
  const mockStudents = [
    {
      id: "s1",
      name: "Alice",
      currentRate: 55,
      weeklyRates: [70, 65, 60, 55],
      totalClasses: 40,
      attendedClasses: 22,
      subjectsAtRisk: 2,
    },
    {
      id: "s2",
      name: "Bob",
      currentRate: 80,
      weeklyRates: [78, 80, 82, 80],
      totalClasses: 40,
      attendedClasses: 32,
      subjectsAtRisk: 0,
    },
    {
      id: "s3",
      name: "Carol",
      currentRate: 68,
      weeklyRates: [72, 70, 68, 68],
      totalClasses: 40,
      attendedClasses: 27,
      subjectsAtRisk: 1,
    },
  ];

  it("returns correct summary counts", () => {
    const { summary } = analyzeAttendanceAnomalies(mockStudents);
    expect(summary.total).toBe(3);
    expect(summary.critical).toBe(1); // Alice
    expect(summary.safe).toBe(1);     // Bob
    expect(summary.atRisk).toBe(1);   // Carol
  });

  it("assigns correct risk levels", () => {
    const { profiles } = analyzeAttendanceAnomalies(mockStudents);
    const alice = profiles.find((p) => p.id === "s1");
    const bob = profiles.find((p) => p.id === "s2");
    expect(alice.riskLevel).toBe(RISK_LEVELS.CRITICAL);
    expect(bob.riskLevel).toBe(RISK_LEVELS.SAFE);
  });

  it("generates alerts for at-risk students", () => {
    const { profiles } = analyzeAttendanceAnomalies(mockStudents);
    const alice = profiles.find((p) => p.id === "s1");
    expect(alice.alerts.length).toBeGreaterThan(0);
  });

  it("returns empty profiles for empty input", () => {
    const { profiles, summary } = analyzeAttendanceAnomalies([]);
    expect(profiles).toHaveLength(0);
    expect(summary.total).toBe(0);
  });
});
