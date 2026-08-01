/**
 * Automated Student Attendance Anomaly Detection & Instructor Alert Service.
 * Analyzes student attendance records for consecutive absences and suspicious login patterns (#4237).
 */

export class AttendanceAnomalyDetector {
  constructor(options = {}) {
    this.consecutiveAbsenceThreshold = options.consecutiveAbsenceThreshold || 3;
    this.attendanceRateWarningThreshold =
      options.attendanceRateWarningThreshold || 75.0; // percentage
  }

  /**
   * Analyze attendance records for a single student or cohort.
   * @param {Array} attendanceRecords Array of attendance entries { studentId, studentName, date, status: 'present'|'absent' }
   */
  detectAnomalies(attendanceRecords = []) {
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return {
        hasAnomaly: false,
        summary: { totalRecords: 0, attendancePercentage: 100 },
        anomalies: [],
        alerts: [],
      };
    }

    // Sort chronologically by date
    const sorted = [...attendanceRecords].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    let consecutiveAbsences = 0;
    let maxConsecutiveAbsences = 0;
    let presentCount = 0;
    const anomalies = [];
    const alerts = [];

    sorted.forEach((record, index) => {
      if (record.status === "present") {
        presentCount++;
        consecutiveAbsences = 0;
      } else if (record.status === "absent") {
        consecutiveAbsences++;
        if (consecutiveAbsences > maxConsecutiveAbsences) {
          maxConsecutiveAbsences = consecutiveAbsences;
        }

        if (consecutiveAbsences >= this.consecutiveAbsenceThreshold) {
          anomalies.push({
            type: "CONSECUTIVE_ABSENCE_SPIKE",
            date: record.date,
            consecutiveCount: consecutiveAbsences,
            studentId: record.studentId,
            studentName: record.studentName,
          });

          alerts.push(
            `ALERT: Student ${record.studentName || record.studentId} has missed ${consecutiveAbsences} consecutive sessions as of ${record.date}.`
          );
        }
      }
    });

    const totalRecords = sorted.length;
    const attendancePercentage = parseFloat(
      ((presentCount / totalRecords) * 100).toFixed(1)
    );

    if (attendancePercentage < this.attendanceRateWarningThreshold) {
      anomalies.push({
        type: "LOW_ATTENDANCE_RATE",
        attendancePercentage,
        threshold: this.attendanceRateWarningThreshold,
      });

      alerts.push(
        `WARNING: Overall attendance rate (${attendancePercentage}%) fell below warning threshold (${this.attendanceRateWarningThreshold}%).`
      );
    }

    return {
      hasAnomaly: anomalies.length > 0,
      summary: {
        totalRecords,
        presentCount,
        absentCount: totalRecords - presentCount,
        maxConsecutiveAbsences,
        attendancePercentage,
      },
      anomalies,
      alerts,
    };
  }
}
