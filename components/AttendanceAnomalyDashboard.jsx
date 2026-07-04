"use client";

/**
 * AttendanceAnomalyDashboard.jsx
 *
 * Full AI-powered Attendance Anomaly Detection & Alert Dashboard.
 * Displays risk scores, trend indicators, batch anomaly alerts,
 * and a summary breakdown for faculty/admin.
 *
 * Resolves: https://github.com/Premshaw23/Learnova/issues/3438
 */

import React, { useMemo, useState } from "react";
import {
  analyzeAttendanceAnomalies,
  RISK_LEVELS,
  TREND_DIRECTIONS,
} from "../services/attendanceAnomalyService";

// ─── Sub-components ───────────────────────────────────────────────────────────

const RiskBadge = ({ level }) => {
  const config = {
    [RISK_LEVELS.SAFE]: {
      label: "🟢 Safe",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    [RISK_LEVELS.AT_RISK]: {
      label: "🟡 At Risk",
      cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    [RISK_LEVELS.CRITICAL]: {
      label: "🔴 Critical",
      cls: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    },
  };
  const { label, cls } = config[level] || config[RISK_LEVELS.SAFE];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
};

const TrendBadge = ({ trend }) => {
  const config = {
    [TREND_DIRECTIONS.IMPROVING]: { icon: "↗", label: "Improving", cls: "text-emerald-400" },
    [TREND_DIRECTIONS.DECLINING]: { icon: "↘", label: "Declining", cls: "text-rose-400" },
    [TREND_DIRECTIONS.STABLE]:    { icon: "→", label: "Stable",    cls: "text-slate-400" },
  };
  const { icon, label, cls } = config[trend] || config[TREND_DIRECTIONS.STABLE];
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${cls}`}>
      <span className="text-base leading-none">{icon}</span>
      {label}
    </span>
  );
};

const RiskScoreBar = ({ score }) => {
  const color =
    score >= 50 ? "bg-rose-500" : score >= 30 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-400 uppercase tracking-wider">
          Risk Score
        </span>
        <span className="text-xs font-bold text-white">{score}/100</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, color }) => (
  <div
    className={`flex flex-col items-center justify-center rounded-2xl border p-4 gap-1 ${color}`}
  >
    <span className="text-3xl font-bold">{value}</span>
    <span className="text-xs uppercase tracking-widest opacity-70">{label}</span>
  </div>
);

const BatchAnomalyBanner = ({ batchAnomaly }) => {
  if (!batchAnomaly?.detected) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
      <span className="mt-0.5 text-xl leading-none">⚠️</span>
      <div>
        <p className="font-semibold text-amber-100">Batch-Level Anomaly Detected</p>
        <p className="mt-0.5 text-amber-300/80">{batchAnomaly.message}</p>
      </div>
    </div>
  );
};

const AlertsPanel = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="space-y-2 mt-2">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-300 leading-relaxed"
        >
          {alert}
        </div>
      ))}
    </div>
  );
};

const StudentRow = ({ profile, isExpanded, onToggle }) => {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-all duration-300"
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{profile.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Attendance: {profile.currentRate.toFixed(1)}%
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <TrendBadge trend={profile.trend} />
          <RiskBadge level={profile.riskLevel} />
        </div>
        <div className="ml-2 text-slate-500 text-sm">{isExpanded ? "▲" : "▼"}</div>
      </button>

      {/* Mobile badges */}
      <div className="flex sm:hidden items-center gap-2 px-5 pb-3">
        <TrendBadge trend={profile.trend} />
        <RiskBadge level={profile.riskLevel} />
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-white/10 px-5 py-4 space-y-4">
          <RiskScoreBar score={profile.riskScore} />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-400">
            <div>
              <p className="uppercase tracking-wider mb-1 opacity-60">Classes Needed</p>
              <p className="text-white font-semibold text-sm">
                {profile.classesNeeded > 0 ? `+${profile.classesNeeded}` : "—"}
              </p>
            </div>
            <div>
              <p className="uppercase tracking-wider mb-1 opacity-60">Subjects at Risk</p>
              <p className="text-white font-semibold text-sm">{profile.subjectsAtRisk}</p>
            </div>
            <div>
              <p className="uppercase tracking-wider mb-1 opacity-60">Risk Score</p>
              <p className="text-white font-semibold text-sm">{profile.riskScore}/100</p>
            </div>
          </div>

          {/* Weekly trend mini-bars */}
          {profile.weeklyRates.length > 0 && (
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-2">
                Weekly Trend (past {profile.weeklyRates.length} weeks)
              </p>
              <div className="flex items-end gap-1 h-8">
                {profile.weeklyRates.map((rate, i) => {
                  const h = Math.max(4, Math.round((rate / 100) * 32));
                  const col =
                    rate >= 75
                      ? "bg-emerald-500"
                      : rate >= 65
                      ? "bg-amber-400"
                      : "bg-rose-500";
                  return (
                    <div
                      key={i}
                      title={`Week ${i + 1}: ${rate}%`}
                      className={`flex-1 rounded-sm ${col} transition-all duration-500`}
                      style={{ height: `${h}px` }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <AlertsPanel alerts={profile.alerts} />
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * AttendanceAnomalyDashboard
 *
 * @param {object} props
 * @param {object[]} props.students - Student data (see attendanceAnomalyService.analyzeAttendanceAnomalies)
 * @param {string}   [props.title] - Dashboard title override
 * @param {boolean}  [props.showBatchAlert] - Whether to show batch-level anomaly banner
 */
export default function AttendanceAnomalyDashboard({
  students = [],
  title = "AI Attendance Anomaly Detection",
  showBatchAlert = true,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("riskScore");

  const analysis = useMemo(
    () => analyzeAttendanceAnomalies(students),
    [students]
  );

  const { profiles, batchAnomaly, summary } = analysis;

  const filteredProfiles = useMemo(() => {
    let list = [...profiles];

    // Filter
    if (filter !== "ALL") list = list.filter((p) => p.riskLevel === filter);

    // Sort
    list.sort((a, b) => {
      if (sortBy === "riskScore") return b.riskScore - a.riskScore;
      if (sortBy === "attendance") return a.currentRate - b.currentRate;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    return list;
  }, [profiles, filter, sortBy]);

  const filterOptions = [
    { value: "ALL",                   label: "All Students" },
    { value: RISK_LEVELS.CRITICAL,    label: "🔴 Critical" },
    { value: RISK_LEVELS.AT_RISK,     label: "🟡 At Risk" },
    { value: RISK_LEVELS.SAFE,        label: "🟢 Safe" },
  ];

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-black/40 py-16 px-8 text-center">
        <div className="text-4xl">📊</div>
        <p className="text-lg font-semibold text-white">No attendance data available</p>
        <p className="text-sm text-slate-400">
          Student attendance records will appear here once data is loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            AI-Powered Analysis
          </p>
          <h2 className="text-2xl font-bold text-white mt-1">{title}</h2>
        </div>
        <div className="text-xs text-slate-500 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          Last analyzed: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Batch Anomaly Banner */}
      {showBatchAlert && <BatchAnomalyBanner batchAnomaly={batchAnomaly} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Students"
          value={summary.total}
          color="border-white/10 bg-white/5 text-white"
        />
        <SummaryCard
          label="Safe"
          value={summary.safe}
          color="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        />
        <SummaryCard
          label="At Risk"
          value={summary.atRisk}
          color="border-amber-500/30 bg-amber-500/10 text-amber-300"
        />
        <SummaryCard
          label="Critical"
          value={summary.critical}
          color="border-rose-500/30 bg-rose-500/10 text-rose-400"
        />
      </div>

      {/* Filter + Sort Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === opt.value
                ? "border-violet-500/60 bg-violet-500/20 text-violet-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {opt.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900 text-xs text-slate-300 px-3 py-1.5 outline-none focus:border-violet-500/50"
          >
            <option value="riskScore">Risk Score</option>
            <option value="attendance">Attendance %</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {filteredProfiles.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-10 text-center text-sm text-slate-400">
            No students match the selected filter.
          </div>
        ) : (
          filteredProfiles.map((profile) => (
            <StudentRow
              key={profile.id}
              profile={profile}
              isExpanded={expandedId === profile.id}
              onToggle={() =>
                setExpandedId(expandedId === profile.id ? null : profile.id)
              }
            />
          ))
        )}
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-slate-600 text-center">
        Risk scores are computed using rolling-average trend analysis. Thresholds: 🟢 ≥75% · 🟡 ≥65% · 🔴 &lt;65%
      </p>
    </div>
  );
}
