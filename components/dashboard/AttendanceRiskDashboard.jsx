"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  RefreshCw,
  Mail,
} from "lucide-react";
import ExportDropdown from "@/components/ui/ExportDropdown";
import { exportAnalyticsCSV, exportAnalyticsPDF } from "@/utils/exportUtils";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

/**
 * AttendanceRiskDashboard
 *
 * Displays at-risk students fetched from /api/analytics/attendance-risk.
 * Shows risk badge (At Risk / Warning / Good), attendance %, and trend arrow.
 * Allows one-click email notification to the student.
 * Supports one-click CSV / PDF export of the currently-filtered data.
 *
 * Part of feat: AI-powered attendance pattern analysis (issue #2183)
 * Export feature: issue #3528
 */

const RISK_CONFIG = {
  at_risk: {
    label: "At Risk",
    icon: AlertTriangle,
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    row: "border-rose-500/20 bg-rose-500/5",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    row: "border-amber-500/20 bg-amber-500/5",
  },
  good: {
    label: "Good",
    icon: CheckCircle,
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    row: "",
  },
};

const TrendIcon = ({ trend }) => {
  if (trend === "declining")
    return <TrendingDown className="w-4 h-4 text-rose-400" aria-label="Declining trend" />;
  if (trend === "improving")
    return <TrendingUp className="w-4 h-4 text-emerald-400" aria-label="Improving trend" />;
  return <Minus className="w-4 h-4 text-slate-400" aria-label="Stable trend" />;
};

const RiskBadge = ({ riskLevel }) => {
  const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.good;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export default function AttendanceRiskDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all | at_risk | warning | good
  const [notifiedIds, setNotifiedIds] = useState(new Set());
  const [sendingId, setSendingId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchRiskData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/attendance-risk");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiskData();
  }, [fetchRiskData]);

  const handleNotify = useCallback(async (student) => {
    if (notifiedIds.has(student.userId)) return;
    setSendingId(student.userId);
    try {
      const emailjsServiceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const emailjsTemplateId =
        process.env.NEXT_PUBLIC_EMAILJS_ATTENDANCE_TEMPLATE_ID;
      const emailjsPublicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
        toast.error("Email notification service is not configured.");
        return;
      }

      const emailjs = (await import("@emailjs/browser")).default;
      await emailjs.send(
        emailjsServiceId,
        emailjsTemplateId,
        {
          to_email: student.email,
          to_name: student.studentName,
          attendance_rate: `${student.attendanceRate}%`,
          risk_level:
            RISK_CONFIG[student.riskLevel]?.label || student.riskLevel,
          trend: student.trend,
        },
        emailjsPublicKey
      );

      setNotifiedIds((prev) => new Set([...prev, student.userId]));
      toast.success(`Notification sent to ${student.studentName}`);
    } catch (err) {
      console.error("Failed to send notification:", err);
      toast.error(`Failed to send notification to ${student.studentName}`);
    } finally {
      setSendingId(null);
    }
  }, [notifiedIds]);

  const filteredStudents = useMemo(() => {
    return data?.students?.filter((s) => filter === "all" || s.riskLevel === filter) ?? [];
  }, [data?.students, filter]);

  // Export handler — exports the currently-filtered student list
  const handleExport = useCallback((format) => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const meta = {
          className: "All Classes",
          dateRange: "Last 28 days",
          teacherName: user?.displayName || user?.email || "N/A",
        };
        const summary = {
          totalStudents: data?.totalStudents,
          atRiskCount: data?.atRiskCount,
          warningCount: data?.warningCount,
        };
        if (format === "csv") {
          exportAnalyticsCSV(filteredStudents, meta);
        } else {
          exportAnalyticsPDF(filteredStudents, meta, summary);
        }
        toast.success(`Exported as ${format.toUpperCase()}`);
      } catch (err) {
        console.error("Export failed:", err);
        toast.error("Export failed. Please try again.");
      } finally {
        setIsExporting(false);
      }
    }, 300);
  }, [data, filteredStudents, user]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground dark:text-white">
            <span className="text-purple-400"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg></span>
            AI Early Warning System
          </h3>
          {data && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.atRiskCount ?? 0} at risk · {data.warningCount ?? 0} warning ·{" "}
              {data.totalStudents ?? 0} total · updated{" "}
              {data.generatedAt && !isNaN(new Date(data.generatedAt).getTime())
                ? new Date(data.generatedAt).toLocaleTimeString()
                : "N/A"}
            </p>
          )}
        </div>

        {/* Actions: Refresh + Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRiskData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh attendance risk data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          {/* Export dropdown — only active when data is loaded */}
          {data && filteredStudents.length > 0 && (
            <ExportDropdown
              onExport={handleExport}
              isExporting={isExporting || loading}
              label="Export"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 transition-colors"
            />
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filter students by risk level">
        {["all", "at_risk", "warning", "good"].map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            disabled={loading || !data}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors capitalize ${
              filter === f
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Student list / Content area */}
      {loading ? (
        <div className="space-y-3 animate-pulse" aria-label="Loading student risk data">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-slate-200/20 dark:bg-white/5"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-rose-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchRiskData}
            className="mt-3 text-xs underline opacity-70 hover:opacity-100"
            aria-label="Retry loading attendance risk data"
          >
            Retry
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No students match this filter.
        </p>
      ) : (
        <div className="space-y-2">
          {filteredStudents.map((student) => {
            const rowConfig =
              RISK_CONFIG[student.riskLevel] || RISK_CONFIG.good;
            const alreadyNotified = notifiedIds.has(student.userId);
            const isSending = sendingId === student.userId;
            const attendanceRateVal = student.attendanceRate ?? 0;

            return (
              <div
                key={student.userId || student.email || student.studentName}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border ${rowConfig.row || "border-white/10"} transition-colors`}
              >
                {/* Student info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground dark:text-white truncate">
                    {student.studentName || "Unknown Student"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {student.email || "No Email"}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className={`font-bold tabular-nums ${
                      attendanceRateVal < 75
                        ? "text-rose-400"
                        : attendanceRateVal < 80
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {student.attendanceRate != null ? `${student.attendanceRate}%` : "—"}
                  </span>
                  <TrendIcon trend={student.trend} />
                  <RiskBadge riskLevel={student.riskLevel} />
                </div>

                {/* Notify button */}
                {student.riskLevel !== "good" && (
                  <button
                    onClick={() => handleNotify(student)}
                    disabled={alreadyNotified || isSending || loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      alreadyNotified
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default"
                        : "bg-white/5 hover:bg-white/10 text-muted-foreground border-white/10 disabled:opacity-50"
                    }`}
                    aria-label={`Notify ${student.studentName || "student"} about attendance`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {isSending
                      ? "Sending…"
                      : alreadyNotified
                        ? "Notified"
                        : "Notify"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
