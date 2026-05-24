"use client";

import React, { useMemo, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";

const STATUS_LABELS = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  none: "No class",
};

const STATUS_BADGES = {
  present: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  late: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  absent: "text-rose-300 bg-rose-500/10 border-rose-500/20",
  none: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

const getDateKey = (date) => date.toISOString().slice(0, 10);

const mockStatusFromDate = (isoDate, isWeekend) => {
  if (isWeekend) {
    return "none";
  }

  const hash = isoDate
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const bucket = hash % 10;

  if (bucket < 7) return "present";
  if (bucket === 7) return "late";
  if (bucket === 8) return "absent";
  return "none";
};

const getIntensityForPresent = (isoDate) => {
  const hash = isoDate
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return (hash % 3) + 1;
};

const buildAttendanceValues = (recentActivity = []) => {
  const activityMap = new Map();

  recentActivity.forEach((entry) => {
    if (entry?.date) {
      activityMap.set(entry.date, entry);
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 84 }, (_, index) => {
    const offset = 83 - index;
    const date = new Date(today);
    date.setDate(today.getDate() - offset);

    const dateKey = getDateKey(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const activity = activityMap.get(dateKey);
    const status = activity?.status ?? mockStatusFromDate(dateKey, isWeekend);
    const intensity = status === "present" ? getIntensityForPresent(dateKey) : 0;

    return {
      date: dateKey,
      status,
      intensity,
      label: date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      rate:
        status === "present"
          ? 100 - (4 - intensity) * 10
          : status === "late"
          ? 72
          : status === "absent"
          ? 18
          : 0,
      subject: activity?.subject || "Attendance",
    };
  });
};

const getCellClassName = (value) => {
  if (!value || !value.status) {
    return "fill-slate-800/20 stroke-slate-700/40";
  }

  if (value.status === "present") {
    switch (value.intensity) {
      case 1:
        return "fill-emerald-500/30 stroke-emerald-400/40";
      case 2:
        return "fill-emerald-500/60 stroke-emerald-400/60";
      default:
        return "fill-emerald-500 stroke-emerald-400/70";
    }
  }

  if (value.status === "late") {
    return "fill-amber-400/75 stroke-amber-300/60";
  }

  if (value.status === "absent") {
    return "fill-rose-500/80 stroke-rose-400/60";
  }

  return "fill-slate-700/50 stroke-slate-500/60";
};

const AttendanceHeatmap = ({ recentActivity = [] }) => {
  const values = useMemo(
    () => {
      if (!recentActivity || recentActivity.length === 0) {
        return [];
      }
      return buildAttendanceValues(recentActivity);
    },
    [recentActivity],
  );

  const [tooltip, setTooltip] = useState(null);

  const startDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 83);
    return date;
  }, []);

  const endDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const showTooltip = (value, event) => {
    if (!value || !value.date) {
      setTooltip(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const left = rect.left + rect.width / 2 + window.scrollX;
    const top = rect.top - 10 + window.scrollY;

    setTooltip({
      status: value.status,
      date: value.label,
      subject: value.subject,
      rate: value.rate,
      left,
      top,
    });
  };

  const clearTooltip = () => setTooltip(null);

  const isEmpty = values.length === 0;

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 shadow-2xl transition-all duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Attendance heatmap
          </p>
          <h3 className="text-2xl font-semibold text-white">
            Last 12 weeks overview
          </h3>
          <p className="max-w-xl text-sm text-slate-400">
            A compact GitHub-style view of your attendance cadence with live hover states and clear daily status.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <div
              key={status}
              className={`rounded-2xl border px-3 py-2 ${STATUS_BADGES[status]}`}
            >
              <span className="block font-semibold text-white">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-4 overflow-x-auto">
        {isEmpty ? (
          <div className="min-h-[220px] flex items-center justify-center rounded-3xl border border-dashed border-slate-700/60 bg-slate-950/60 p-8">
            <div className="text-center">
              <div className="mb-2 h-3.5 w-24 rounded-full bg-slate-700/70 animate-pulse" />
              <p className="text-sm text-slate-400">
                Loading attendance history…
              </p>
            </div>
          </div>
        ) : (
          <div className="min-w-[340px] sm:min-w-[520px]">
            <CalendarHeatmap
              startDate={startDate}
              endDate={endDate}
              values={values}
              showWeekdayLabels
              gutterSize={6}
              weekdayLabels={["Mon", "Wed", "Fri"]}
              classForValue={getCellClassName}
              transformDayElement={(rect, value) =>
                React.cloneElement(rect, {
                  className: `${rect.props.className} cursor-pointer rounded-lg transition-all duration-200 ease-out ${getCellClassName(value)}`,
                  onMouseEnter: (event) => showTooltip(value, event),
                  onMouseLeave: clearTooltip,
                  onTouchStart: (event) => showTooltip(value, event),
                })
              }
            />
          </div>
        )}
      </div>

      <div className="mt-4 rounded-3xl bg-white/5 border border-white/10 px-4 py-4 text-sm text-slate-400">
        <p className="font-medium text-slate-100">How to read this chart</p>
        <p className="mt-2 leading-6">
          Darker tiles mean strong presence, amber tiles show late check-ins, and red tiles highlight absences.
          Weekends are shown as muted tiles for a clean, premium dashboard feel.
        </p>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 max-w-xs -translate-x-1/2 rounded-3xl border border-white/10 bg-slate-950/95 px-4 py-3 text-sm text-slate-100 shadow-2xl backdrop-blur-xl"
          style={{ left: tooltip.left, top: tooltip.top }}
        >
          <div className="flex items-center justify-between gap-2 pb-2 text-xs uppercase tracking-[0.24em] text-slate-500">
            <span>{tooltip.date}</span>
            <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-200 bg-white/5">
              {STATUS_LABELS[tooltip.status]}
            </span>
          </div>
          <div className="text-sm text-white font-semibold">
            {tooltip.subject}
          </div>
          <div className="mt-1 text-slate-400">
            Attendance confidence: {tooltip.rate}%
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHeatmap;
