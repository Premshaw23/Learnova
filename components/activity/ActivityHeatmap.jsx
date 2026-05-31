"use client";

import React, { useEffect, useMemo, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { Activity } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { getUserActivity } from "@/services/activityService";

const SCALE_BREAKPOINTS = [0, 1, 3, 6];

const formatFullDate = (isoDate) => {
  try {
    const date = new Date(`${isoDate}T00:00:00Z`);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return isoDate;
  }
};

const getCellClassName = (value) => {
  if (!value || !value.count) {
    return "fill-slate-800/30 stroke-slate-700/40";
  }

  if (value.count < SCALE_BREAKPOINTS[1]) {
    return "fill-emerald-500/25 stroke-emerald-400/35";
  }

  if (value.count < SCALE_BREAKPOINTS[2]) {
    return "fill-emerald-500/50 stroke-emerald-400/45";
  }

  if (value.count < SCALE_BREAKPOINTS[3]) {
    return "fill-emerald-500/80 stroke-emerald-400/60";
  }

  return "fill-emerald-400 stroke-emerald-300/60";
};

const buildHeatmapValues = (records = []) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dataMap = new Map(records.map((item) => [item.date, item.count]));

  return Array.from({ length: 84 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (83 - index));
    const isoDate = date.toISOString().slice(0, 10);

    return {
      date: isoDate,
      count: dataMap.get(isoDate) || 0,
      label: formatFullDate(isoDate),
    };
  });
};

const ActivityHeatmap = ({ userId: userIdProp }) => {
  const auth = useAuthContext();
  const userId = userIdProp || auth?.user?.uid;
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchActivity = async () => {
      if (!userId) {
        setRecords([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const activity = await getUserActivity(userId);
        if (!active) return;
        setRecords(activity);
      } catch (err) {
        if (!active) return;
        console.error("Error fetching user activity:", err);
        setError("Unable to load activity data.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchActivity();
    return () => {
      active = false;
    };
  }, [userId]);

  const values = useMemo(() => buildHeatmapValues(records), [records]);

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

  const summaryText = () => {
    if (isLoading) return "Loading activity chart…";
    if (error) return "Could not fetch activity data.";
    if (!records || records.length === 0) return "No activity yet.";
    return "Daily contributions over the last 12 weeks.";
  };

  const showTooltip = (value, event) => {
    if (!value || !value.date) {
      setTooltip(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const top = rect.top - 10 + window.scrollY;
    const left = rect.left + rect.width / 2 + window.scrollX;

    setTooltip({
      date: value.label,
      count: value.count,
      left,
      top,
    });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <section className="bg-black/20 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-slate-400">
            Activity Heatmap
          </p>
          <h2 className="text-2xl font-semibold text-white">
            Contribution cadence
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Track your real activity by day with GitHub-style intensity levels and hover details.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-300 grid grid-cols-4 gap-2 sm:grid-cols-4">
          <div className="text-center">
            <span className="block text-white font-semibold">0</span>
            <span className="text-slate-500">Inactive</span>
          </div>
          <div className="text-center">
            <span className="block text-white font-semibold">1–2</span>
            <span className="text-slate-500">Low</span>
          </div>
          <div className="text-center">
            <span className="block text-white font-semibold">3–5</span>
            <span className="text-slate-500">Medium</span>
          </div>
          <div className="text-center">
            <span className="block text-white font-semibold">6+</span>
            <span className="text-slate-500">High</span>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[280px] rounded-3xl border border-white/10 bg-slate-950/80 p-4">
          {isLoading ? (
            <div className="grid grid-cols-12 gap-2 py-6 px-2">
              {Array.from({ length: 84 }).map((_, index) => (
                <div
                  key={index}
                  className="h-6 rounded-lg bg-slate-800/50 animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="min-h-[220px] flex items-center justify-center text-slate-300">
              {summaryText()}
            </div>
          ) : !records || records.length === 0 ? (
            <div className="min-h-[220px] flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-700/60 bg-slate-950/60 p-8 text-center">
              <Activity className="h-10 w-10 text-slate-400" />
              <p className="text-lg font-semibold text-white">No activity yet</p>
              <p className="text-sm text-slate-400 max-w-sm">
                Your profile will start showing a heatmap once daily activity data is available.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[360px]">
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
                      className: `${rect.props.className} cursor-pointer rounded-md transition duration-200 ease-out ${getCellClassName(value)}`,
                      onMouseEnter: (event) => showTooltip(value, event),
                      onMouseLeave: hideTooltip,
                      onTouchStart: (event) => showTooltip(value, event),
                      title: `${formatFullDate(value?.date || "")} – ${value?.count || 0} activities`,
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
        <p className="font-medium text-white">What you see</p>
        <p className="mt-2 text-slate-300">
          Each day tile represents one calendar date. Lighter greens mean fewer contributions, while deeper greens show more activity.
        </p>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 rounded-3xl border border-white/10 bg-slate-950/95 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-xl"
          style={{ left: tooltip.left, top: tooltip.top }}
        >
          <p className="text-slate-300 text-xs uppercase tracking-[0.22em]">
            {tooltip.date}
          </p>
          <p className="mt-1 font-semibold text-white">
            {tooltip.count} activity{tooltip.count === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </section>
  );
};

export default ActivityHeatmap;
