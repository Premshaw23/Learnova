"use client";

/**
 * AIAttendanceDashboard.jsx
 *
 * Entry-point wrapper for the AI Attendance features.
 * Combines:
 *  - Anomaly detection & risk analysis (AttendanceAnomalyDashboard)
 *  - CSV export for risk reports
 *
 * Resolves: https://github.com/Premshaw23/Learnova/issues/3438
 */

import React, { useState } from "react";
import toast from "react-hot-toast";
import AttendanceAnomalyDashboard from "./AttendanceAnomalyDashboard";
import { exportRiskToCSV } from "../utils/exportToCSV";

export default function AIAttendanceDashboard({ riskData = [], tenantId }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filteredData = riskData.filter(
        (item) => item.tenantId === tenantId
      );
      if (filteredData.length === 0) {
        toast.error("No data available for export.");
        return;
      }
      exportRiskToCSV(filteredData);
      toast.success("Risk report exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Map riskData to the shape expected by AttendanceAnomalyDashboard
  const students = riskData
    .filter((item) => !tenantId || item.tenantId === tenantId)
    .map((item) => ({
      id: item.id || item.userId || item.studentId,
      name: item.name || item.studentName || "Unknown",
      currentRate: item.attendanceRate ?? item.currentRate ?? 0,
      weeklyRates: item.weeklyRates || [],
      totalClasses: item.totalClasses || 0,
      attendedClasses: item.attendedClasses || 0,
      subjectsAtRisk: item.subjectsAtRisk || 0,
    }));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl px-6 py-4 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white">AI Attendance Risk Analysis</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Powered by rolling-average anomaly detection
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting || !riskData?.length}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm disabled:bg-slate-700 disabled:text-slate-400 transition-colors"
        >
          {isExporting ? "Exporting..." : "📥 Export Report"}
        </button>
      </div>

      {/* Main Anomaly Dashboard */}
      <AttendanceAnomalyDashboard
        students={students}
        title="Student Risk Overview"
        showBatchAlert
      />
    </div>
  );
}
