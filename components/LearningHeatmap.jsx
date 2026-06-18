"use client";

import React, { useEffect, useState, useMemo } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import StreakStats from "./StreakStats";
import HeatmapLegend from "./HeatmapLegend";
import ActivityTooltip from "./ActivityTooltip";
import { getStudentActivity } from "@/services/activityService";
import { calculateCurrentStreak, calculateLongestStreak } from "@/utils/streakUtils";
import { useAuth } from "@/hooks/useAuth";

const getCellClassName = (value) => {
  if (!value || value.count === 0) {
    return "fill-zinc-200 dark:fill-zinc-800/40 stroke-zinc-300 dark:stroke-zinc-700/30";
  }

  const count = value.count;
  if (count === 1) {
    return "fill-violet-200 dark:fill-violet-900/30 stroke-violet-300/80 dark:stroke-violet-800/40";
  }
  if (count <= 3) {
    return "fill-violet-400 dark:fill-violet-700/60 stroke-violet-500/80 dark:stroke-violet-600/50";
  }
  if (count <= 5) {
    return "fill-violet-600 dark:fill-violet-500/80 stroke-violet-700/80 dark:stroke-violet-400/60";
  }
  return "fill-violet-800 dark:fill-violet-400 stroke-violet-900/80 dark:stroke-violet-300/70";
};

const formatFullDate = (isoDate) => {
  try {
    const [year, month, day] = isoDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return isoDate;
  }
};

const buildHeatmapValues = (records) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const dataMap = new Map(records.map((item) => [item.date, item.count]));

  return Array.from({ length: 365 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (364 - index));
    const localDateStr = getLocalDateString(date);

    return {
      date: localDateStr,
      count: dataMap.get(localDateStr) || 0,
      label: formatFullDate(localDateStr),
    };
  });
};

const LearningHeatmapSkeleton = () => (
  <div className="w-full bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 shadow-2xl animate-pulse space-y-6">
    <div className="space-y-2">
      <div className="h-4 w-28 bg-slate-700/50 rounded" />
      <div className="h-6 w-48 bg-slate-700/60 rounded" />
      <div className="h-4 w-96 bg-slate-700/40 rounded" />
    </div>
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 h-20 bg-slate-800/40 border border-white/5 rounded-[1.5rem]" />
      <div className="flex-1 h-20 bg-slate-800/40 border border-white/5 rounded-[1.5rem]" />
    </div>
    <div className="h-44 bg-slate-800/40 border border-white/5 rounded-[1.75rem]" />
  </div>
);

const LearningHeatmap = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchActivity = async () => {
      if (!user?.uid) {
        setRecords([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const activity = await getStudentActivity(user.uid);
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
  }, [user?.uid]);

  const values = useMemo(() => buildHeatmapValues(records), [records]);

  const activeDates = useMemo(() => {
    return records.filter((r) => r.count > 0).map((r) => r.date);
  }, [records]);

  const currentStreak = useMemo(() => {
    return calculateCurrentStreak(activeDates);
  }, [activeDates]);

  const longestStreak = useMemo(() => {
    return calculateLongestStreak(activeDates);
  }, [activeDates]);

  const startDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 364);
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

  if (isLoading) {
    return <LearningHeatmapSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 text-center text-slate-300">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <section className="bg-black/20 border border-white/10 rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl animate-fadeIn">
      <div className="flex flex-col gap-1.5 mb-6">
        <p className="text-xs uppercase tracking-[0.26em] text-slate-400">
          Learning Streak
        </p>
        <h2 className="text-2xl font-bold text-white font-sans">
          Learning Streak
        </h2>
        <p className="text-sm text-slate-400">
          Stay consistent and keep learning every day.
        </p>
      </div>

      <StreakStats currentStreak={currentStreak} longestStreak={longestStreak} />

      <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5">
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <div className="min-w-[800px] pr-2">
            <CalendarHeatmap
              startDate={startDate}
              endDate={endDate}
              values={values}
              showWeekdayLabels
              gutterSize={5}
              weekdayLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
              classForValue={getCellClassName}
              transformDayElement={(rect, value) => {
                const isFocusable = !!(value && value.date);
                return React.cloneElement(rect, {
                  className: `${rect.props.className || ""} cursor-pointer rounded-[3px] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${getCellClassName(value)}`,
                  tabIndex: isFocusable ? 0 : -1,
                  role: "gridcell",
                  "aria-label": value ? `${value.count} activities on ${value.label}` : "No activity data",
                  onMouseEnter: (event) => showTooltip(value, event),
                  onMouseLeave: hideTooltip,
                  onFocus: (event) => showTooltip(value, event),
                  onBlur: hideTooltip,
                  onTouchStart: (event) => showTooltip(value, event),
                });
              }}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
          <p className="text-xs text-slate-400 leading-5 max-w-lg text-center sm:text-left">
            Each cell represents a calendar day. Deeper shades of violet represent days with high contribution activity (login, viewing material, completing tasks, quizzes).
          </p>
          <HeatmapLegend />
        </div>
      </div>

      {tooltip && (
        <ActivityTooltip
          date={tooltip.date}
          count={tooltip.count}
          left={tooltip.left}
          top={tooltip.top}
        />
      )}
    </section>
  );
};

export default LearningHeatmap;
