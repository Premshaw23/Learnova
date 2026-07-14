/**
 * attendanceAnomalyService.js
 *
 * AI-powered attendance anomaly detection service for Learnova.
 * Implements rolling-average trend analysis, risk scoring, and alert generation.
 *
 * Resolves: https://github.com/Premshaw23/Learnova/issues/3438
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const RISK_THRESHOLDS = {
  SAFE: 75,       // >= 75% → Safe
  AT_RISK: 65,    // >= 65% && < 75% → At Risk
  CRITICAL: 0,    // < 65% → Critical
};

export const RISK_LEVELS = {
  SAFE: "SAFE",
  AT_RISK: "AT_RISK",
  CRITICAL: "CRITICAL",
};

export const TREND_DIRECTIONS = {
  IMPROVING: "IMPROVING",
  DECLINING: "DECLINING",
  STABLE: "STABLE",
};

// ─── Core Utilities ───────────────────────────────────────────────────────────

/**
 * Computes the rolling average attendance rate over a sliding window.
 * @param {number[]} rates - Ordered list of attendance percentages (oldest first)
 * @param {number} windowSize - Number of periods to average
 * @returns {number[]} Rolling averages
 */
export function computeRollingAverage(rates = [], windowSize = 4) {
  if (!rates || rates.length === 0) return [];
  return rates.map((_, idx) => {
    const start = Math.max(0, idx - windowSize + 1);
    const slice = rates.slice(start, idx + 1);
    return parseFloat(
      (slice.reduce((sum, v) => sum + v, 0) / slice.length).toFixed(2)
    );
  });
}

/**
 * Determines the attendance trend direction based on rolling averages.
 * @param {number[]} rollingAvgs - Rolling average values
 * @returns {"IMPROVING"|"DECLINING"|"STABLE"}
 */
export function detectTrendDirection(rollingAvgs = []) {
  if (rollingAvgs.length < 2) return TREND_DIRECTIONS.STABLE;
  const recent = rollingAvgs.slice(-3);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const delta = last - first;
  if (delta >= 3) return TREND_DIRECTIONS.IMPROVING;
  if (delta <= -3) return TREND_DIRECTIONS.DECLINING;
  return TREND_DIRECTIONS.STABLE;
}

/**
 * Computes a risk score (0–100) for a student based on attendance data.
 * Higher score = more at risk.
 * @param {object} params
 * @param {number} params.currentRate - Current attendance percentage
 * @param {string} params.trend - Trend direction
 * @param {number} params.subjectsAtRisk - Number of subjects below threshold
 * @returns {number} Risk score (0–100)
 */
export function computeRiskScore({ currentRate, trend, subjectsAtRisk = 0 }) {
  let score = Math.max(0, 100 - currentRate); // base: higher absence = higher risk

  // Trend modifier
  if (trend === TREND_DIRECTIONS.DECLINING) score += 10;
  if (trend === TREND_DIRECTIONS.IMPROVING) score = Math.max(0, score - 10);

  // Subjects at risk modifier
  score += subjectsAtRisk * 5;

  return Math.min(100, Math.round(score));
}

/**
 * Maps attendance percentage to a risk level.
 * @param {number} rate
 * @returns {"SAFE"|"AT_RISK"|"CRITICAL"}
 */
export function getRiskLevel(rate) {
  if (rate >= RISK_THRESHOLDS.SAFE) return RISK_LEVELS.SAFE;
  if (rate >= RISK_THRESHOLDS.AT_RISK) return RISK_LEVELS.AT_RISK;
  return RISK_LEVELS.CRITICAL;
}

// ─── Alert Generator ──────────────────────────────────────────────────────────

/**
 * Generates alert messages for a student based on their risk profile.
 * @param {object} student
 * @param {string} student.name
 * @param {number} student.currentRate
 * @param {string} student.riskLevel
 * @param {number} student.classesNeeded
 * @returns {string[]} List of alert messages
 */
export function generateStudentAlerts({ name, currentRate, riskLevel, classesNeeded }) {
  const alerts = [];

  if (riskLevel === RISK_LEVELS.CRITICAL) {
    alerts.push(
      `🔴 Critical: ${name}, your attendance is at ${currentRate.toFixed(1)}%. ` +
      `You need ${classesNeeded} more classes to reach the 75% threshold.`
    );
  } else if (riskLevel === RISK_LEVELS.AT_RISK) {
    alerts.push(
      `🟡 Warning: ${name}, your attendance (${currentRate.toFixed(1)}%) is approaching the minimum. ` +
      `Attend ${classesNeeded} more class(es) to stay safe.`
    );
  }

  return alerts;
}

/**
 * Detects batch-level anomalies (entire class with low attendance).
 * @param {object[]} students - Array of student risk profiles
 * @param {number} threshold - Percentage of students to trigger batch alert
 * @returns {object|null} Batch anomaly object or null
 */
export function detectBatchAnomaly(students = [], threshold = 0.4) {
  if (students.length === 0) return null;

  const atRiskCount = students.filter(
    (s) => s.riskLevel !== RISK_LEVELS.SAFE
  ).length;

  const ratio = atRiskCount / students.length;

  if (ratio >= threshold) {
    return {
      detected: true,
      affectedCount: atRiskCount,
      totalCount: students.length,
      ratio: parseFloat((ratio * 100).toFixed(1)),
      message: `⚠️ Batch Alert: ${atRiskCount} out of ${students.length} students (${(ratio * 100).toFixed(0)}%) are at or below attendance risk threshold.`,
    };
  }

  return { detected: false };
}

// ─── Main Analyzer ────────────────────────────────────────────────────────────

/**
 * Analyzes attendance records for a list of students and returns full risk profiles.
 *
 * @param {object[]} students - Array of student objects
 * @param {string} students[].id - Student ID
 * @param {string} students[].name - Student name
 * @param {number} students[].currentRate - Current attendance %
 * @param {number[]} students[].weeklyRates - Past weekly attendance rates (oldest first)
 * @param {number} students[].totalClasses - Total classes held
 * @param {number} students[].attendedClasses - Classes attended
 * @param {number} [students[].subjectsAtRisk] - Subjects below threshold
 * @returns {object} Analysis result with student profiles + batch anomaly
 */
export function analyzeAttendanceAnomalies(students = []) {
  const profiles = students.map((student) => {
    const {
      id,
      name,
      currentRate,
      weeklyRates = [],
      totalClasses = 0,
      attendedClasses = 0,
      subjectsAtRisk = 0,
    } = student;

    const rollingAvgs = computeRollingAverage(weeklyRates, 4);
    const trend = detectTrendDirection(rollingAvgs);
    const riskLevel = getRiskLevel(currentRate);
    const riskScore = computeRiskScore({ currentRate, trend, subjectsAtRisk });

    // Classes needed to reach 75% threshold
    const classesNeeded = Math.max(
      0,
      Math.ceil(
        (RISK_THRESHOLDS.SAFE * totalClasses - attendedClasses * 100) /
          (100 - RISK_THRESHOLDS.SAFE)
      )
    );

    const alerts = generateStudentAlerts({
      name,
      currentRate,
      riskLevel,
      classesNeeded,
    });

    return {
      id,
      name,
      currentRate,
      riskLevel,
      riskScore,
      trend,
      rollingAvgs,
      weeklyRates,
      classesNeeded,
      alerts,
      subjectsAtRisk,
    };
  });

  const batchAnomaly = detectBatchAnomaly(profiles);

  return {
    profiles,
    batchAnomaly,
    summary: {
      total: profiles.length,
      safe: profiles.filter((p) => p.riskLevel === RISK_LEVELS.SAFE).length,
      atRisk: profiles.filter((p) => p.riskLevel === RISK_LEVELS.AT_RISK).length,
      critical: profiles.filter((p) => p.riskLevel === RISK_LEVELS.CRITICAL).length,
    },
  };
}
