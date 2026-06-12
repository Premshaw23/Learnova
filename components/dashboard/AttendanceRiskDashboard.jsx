"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  RefreshCw,
  Mail,
} from "lucide-react";

/**
 * AttendanceRiskDashboard
 *
 * Displays at-risk students fetched from /api/analytics/attendance-risk.
 * Shows risk badge (At Risk / Warning / Good), attendance %, and trend arrow.
 * Allows one-click email notification to the student.
 *
 * Part of feat: AI-powered attendance pattern analysis (issue #2183)
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
    return <TrendingDown className="w-4 h-4 text-rose-400" />;
  if (trend === "improving")
    return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all | at_risk | warning | good
  const [notifiedIds, setNotifiedIds] = useState(new Set());
  const [sendingId, setSendingId] = useState(null);

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

  const handleNotify = async (student) => {
    if (notifiedIds.has(student.userId)) return;
    setSendingId(student.userId);
    try {
      // EmailJS is called client-side using environment variables
      const emailjsServiceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const emailjsTemplateId =
        process.env.NEXT_PUBLIC_EMAILJS_ATTENDANCE_TEMPLATE_ID;
      const emailjsPublicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
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
      }

      setNotifiedIds((prev) => new Set([...prev, student.userId]));
    } catch (err) {
      console.error("Failed to send notification:", err);
    } finally {
      setSendingId(null);
    }
  };

  const filteredStudents =
    data?.students?.filter((s) => filter === "all" || s.riskLevel === filter) ??
    [];

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-slate-200/20 dark:bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-rose-400">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchRiskData}
          className="mt-3 text-xs underline opacity-70 hover:opacity-100"
          aria-label="Action button"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground dark:text-white">
            Attendance Risk Overview
          </h3>
          {data && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.atRiskCount} at risk · {data.warningCount} warning ·{" "}
              {data.totalStudents} total · updated{" "}
              {new Date(data.generatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchRiskData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          aria-label="Action button"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "at_risk", "warning", "good"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors capitalize ${
              filter === f
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Student list */}
      {filteredStudents.length === 0 ? (
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

            return (
              <div
                key={student.userId}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border ${rowConfig.row || "border-white/10"} transition-colors`}
              >
                {/* Student info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground dark:text-white truncate">
                    {student.studentName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {student.email}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className={`font-bold tabular-nums ${
                      student.attendanceRate < 75
                        ? "text-rose-400"
                        : student.attendanceRate < 80
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {student.attendanceRate}%
                  </span>
                  <TrendIcon trend={student.trend} />
                  <RiskBadge riskLevel={student.riskLevel} />
                </div>

                {/* Notify button */}
                {student.riskLevel !== "good" && (
                  <button
                    onClick={() => handleNotify(student)}
                    disabled={alreadyNotified || isSending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      alreadyNotified
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default"
                        : "bg-white/5 hover:bg-white/10 text-muted-foreground border-white/10"
                    }`}
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
