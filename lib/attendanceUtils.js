/**
 * Calculate attendance percentage
 * @param {number} attended - Number of classes attended
 * @param {number} total - Total number of classes held
 * @returns {number} Percentage rounded to 2 decimal places
 * @throws {Error} When total is 0 (division by zero)
 */
export function calculateAttendancePercentage(attended, total) {
  if (total === 0) {
    throw new Error("Total classes cannot be zero");
  }
  if (attended < 0 || total < 0) {
    throw new Error("Attendance values cannot be negative");
  }
  if (attended > total) {
    throw new Error("Attended classes cannot exceed total classes");
  }
  return Math.round((attended / total) * 10000) / 100;
}

/**
 * Count attendance by status from records array
 * @param {Array} records - Array of attendance records
 * @returns {{ present: number, absent: number, late: number }}
 */
export function countAttendanceByStatus(records) {
  if (!Array.isArray(records)) {
    throw new Error("Records must be an array");
  }
  return records.reduce(
    (acc, record) => {
      const status = record.status?.toLowerCase();
      if (status === "present") acc.present += 1;
      else if (status === "absent") acc.absent += 1;
      else if (status === "late") acc.late += 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0 }
  );
}

/**
 * Check if attendance is below threshold
 * @param {number} percentage - Current attendance percentage
 * @param {number} threshold - Minimum required percentage (default 75)
 * @returns {boolean} True if below threshold
 */
export function isBelowThreshold(percentage, threshold = 75) {
  if (typeof percentage !== "number" || typeof threshold !== "number") {
    throw new Error("Percentage and threshold must be numbers");
  }
  return percentage < threshold;
}

/**
 * Get attendance status label
 * @param {number} percentage
 * @returns {'excellent' | 'good' | 'warning' | 'critical'}
 */
export function getAttendanceStatus(percentage) {
  if (percentage >= 90) return "excellent";
  if (percentage >= 75) return "good";
  if (percentage >= 60) return "warning";
  return "critical";
}

/**
 * Evaluate overall student attendance from records array
 * @param {Array} records - Array of attendance records
 * @param {number} threshold - Minimum required percentage
 * @returns {{ percentage: number, isBelowThreshold: boolean, status: string, present: number, absent: number, total: number }}
 */
export function evaluateStudentAttendance(records, threshold = 75) {
  if (!Array.isArray(records)) {
    throw new Error("Records must be an array");
  }
  const counts = countAttendanceByStatus(records);
  // Total considered classes are present + absent (excluding late or treating late as present/absent depending on rules. Here we just count present + absent)
  // Let's assume late counts as present, or we just sum all as total if they are records of classes.
  // Actually, standard logic: total = present + absent + late.
  const total = counts.present + counts.absent + counts.late;

  if (total === 0) {
    return {
      percentage: 100,
      isBelowThreshold: false,
      status: "excellent",
      present: 0,
      absent: 0,
      total: 0,
    };
  }

  // usually late might count as present or half present. We will assume present for now, or just use present count against total.
  // Wait, let's use standard logic: attended = present + late.
  const attended = counts.present + counts.late;
  const percentage = calculateAttendancePercentage(attended, total);

  return {
    percentage,
    isBelowThreshold: isBelowThreshold(percentage, threshold),
    status: getAttendanceStatus(percentage),
    present: counts.present,
    absent: counts.absent,
    late: counts.late,
    total,
  };
}

/**
 * Predict whether a student's attendance is likely to fall below the threshold
 * @param {Array} records - Array of attendance records
 * @param {number} threshold - Minimum required percentage
 * @returns {{
 *   projectedPercentage: number,
 *   riskLevel: 'low' | 'moderate' | 'high',
 *   trend: 'declining' | 'improving' | 'stable',
 *   recommendations: Array<string>
 * }}
 */
export function predictStudentAttendance(records, threshold = 75) {
  if (!Array.isArray(records)) {
    throw new Error("Records must be an array");
  }

  // Sort records by date ascending to analyze chronological trend
  const sortedRecords = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  const total = sortedRecords.length;

  if (total === 0) {
    return {
      projectedPercentage: 100,
      riskLevel: "low",
      trend: "stable",
      recommendations: [
        "No attendance records available yet.",
        "Encourage regular attendance once classes begin."
      ]
    };
  }

  const counts = countAttendanceByStatus(sortedRecords);
  const currentAttended = counts.present + counts.late;
  const currentPercentage = Math.round((currentAttended / total) * 100);

  // If we have fewer than 5 records, we cannot establish a reliable trend.
  // Fall back to current attendance rate with basic recommendations.
  if (total < 5) {
    const riskLevel = currentPercentage < threshold ? "high" : (currentPercentage < threshold + 7 ? "moderate" : "low");
    const recommendations = [];
    if (riskLevel === "high") {
      recommendations.push(
        "Attendance is currently below the required threshold.",
        "Ensure your child attends all upcoming classes to build a strong baseline."
      );
    } else if (riskLevel === "moderate") {
      recommendations.push(
        "Attendance is close to the minimum requirement.",
        "Monitor attendance closely during these initial classes."
      );
    } else {
      recommendations.push(
        "Off to a great start! Maintain this consistent attendance.",
        "Keep up the good work to establish a strong routine."
      );
    }

    return {
      projectedPercentage: currentPercentage,
      riskLevel,
      trend: "stable",
      recommendations
    };
  }

  // We have 5 or more records. Let's calculate overall and recent rates.
  // Recent rate is based on the last 5 classes.
  const recentRecords = sortedRecords.slice(-5);
  const recentCounts = countAttendanceByStatus(recentRecords);
  const recentAttended = recentCounts.present + recentCounts.late;
  const recentRate = recentAttended / 5; // recent rate (0 to 1)

  const overallRate = currentAttended / total; // overall rate (0 to 1)

  // Trend detection
  const diff = (recentRate - overallRate) * 100;
  let trend = "stable";
  if (diff < -5) trend = "declining";
  else if (diff > 5) trend = "improving";

  // Projected attendance: project over next N = 10 classes assuming the recent trend continues
  const N_project = 10;
  const projectedAttended = currentAttended + (N_project * recentRate);
  const projectedTotal = total + N_project;
  const projectedPercentage = Math.round((projectedAttended / projectedTotal) * 100);

  // Determine risk level based on projected percentage and trend
  let riskLevel = "low";
  if (projectedPercentage < threshold) {
    riskLevel = "high";
  } else if (projectedPercentage < threshold + 7) {
    riskLevel = "moderate";
  }

  // Generate recommendations
  const recommendations = [];
  if (riskLevel === "high") {
    recommendations.push(
      `Critical: Attendance is projected to fall below the required ${threshold}% threshold (${projectedPercentage}%).`,
      "Immediate action is recommended. Please contact the school coordinator or class teacher.",
      "Discuss with your child to identify and resolve any difficulties they are facing with attendance."
    );
  } else if (riskLevel === "moderate") {
    recommendations.push(
      `Warning: Attendance is trending near the threshold limit (${projectedPercentage}%).`,
      "Ensure your child attends all remaining classes this week to stabilize their rate.",
      "Consider setting daily study goals to keep your child engaged and motivated."
    );
  } else {
    if (trend === "declining") {
      recommendations.push(
        "Attendance is currently safe, but recent records show a declining trend.",
        "Keep a close eye on their daily attendance to prevent falling into the warning zone."
      );
    } else {
      recommendations.push(
        "Excellent! Consistent attendance projected.",
        "Acknowledge your child's diligence and support their continued engagement."
      );
    }
  }

  return {
    projectedPercentage: Math.max(0, Math.min(100, projectedPercentage)),
    riskLevel,
    trend,
    recommendations
  };
}

