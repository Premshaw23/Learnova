"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage";

const MOOD_EMOJIS = {
  happy: "😄",
  calm: "😌",
  tired: "😴",
  stressed: "😟",
  overwhelmed: "😤",
};

const MOOD_LABELS = {
  happy: "Happy",
  calm: "Calm",
  tired: "Tired",
  stressed: "Stressed",
  overwhelmed: "Overwhelmed",
};

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split("T")[0];
  });
}

function formatDateLabel(dateKey) {
  const today = getTodayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];

  if (dateKey === today) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";

  const date = new Date(dateKey);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** Read a raw localStorage value and parse it, bypassing any caching layer */
function readLiveValue(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildTimeline() {
  const today = getTodayKey();

  // Always read today's live values directly from localStorage — never use snapshots for today
  const currentMood  = readLiveValue("learnova-wellness-mood");
  const currentStress = readLiveValue("learnova-wellness-stress");
  const currentWater  = readLiveValue("learnova-wellness-water");
  const reflection    = readLiveValue("learnova-wellness-reflections");
  const moodHistory   = readLiveValue("learnova-wellness-mood-history") ?? [];

  // Load snapshots for past days only
  const snapshots = readLiveValue("learnova-wellness-snapshots") ?? {};

  // Build today's entry purely from live keys — ignore whatever is in snapshots[today]
  const todayEntry = {
    mood:          currentMood  || null,
    stress:        currentStress !== null ? Number(currentStress) : null,
    water:         currentWater  !== null ? Number(currentWater)  : null,
    hasReflection: !!(reflection && (reflection.wentWell || reflection.proudOf)),
  };

  // Persist the fresh today entry back so other components can read it
  snapshots[today] = todayEntry;
  try {
    window.localStorage.setItem(
      "learnova-wellness-snapshots",
      JSON.stringify(snapshots)
    );
  } catch {}

  // Fill past days from mood history where snapshots are still missing
  if (Array.isArray(moodHistory)) {
    moodHistory.forEach((entry) => {
      if (!entry?.timestamp) return;
      const dayKey = new Date(entry.timestamp).toISOString().split("T")[0];
      if (dayKey !== today && !snapshots[dayKey]) {
        snapshots[dayKey] = {
          mood: entry.key || null,
          stress: null,
          water: null,
          hasReflection: false,
        };
      }
    });
  }

  return getLast7Days().map((dateKey) => ({
    dateKey,
    label: formatDateLabel(dateKey),
    ...(snapshots[dateKey] || { mood: null, stress: null, water: null, hasReflection: false }),
  }));
}

export default function WellnessJourneyTimeline() {
  const [history, setHistory] = useState([]);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const refreshTimeline = () => {
      const timeline = buildTimeline();
      setHistory(timeline);

      // Compute insights
      const daysWithData = timeline.filter(
        (d) => d.mood || d.stress !== null || d.water !== null
      );

      if (daysWithData.length === 0) {
        setInsights(null);
        return;
      }

      // Most frequent mood
      const moodCount = {};
      daysWithData.forEach((d) => {
        if (d.mood) moodCount[d.mood] = (moodCount[d.mood] || 0) + 1;
      });
      const topMood =
        Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      // Average stress
      const stressDays = daysWithData.filter((d) => d.stress !== null);
      const avgStress =
        stressDays.length > 0
          ? Math.round(
              stressDays.reduce((sum, d) => sum + d.stress, 0) / stressDays.length
            )
          : null;

      // Best hydration day
      const waterDays = daysWithData.filter((d) => d.water !== null && d.water > 0);
      const bestWaterDay =
        waterDays.length > 0
          ? waterDays.reduce((best, d) => (d.water > best.water ? d : best))
          : null;

      // Stress trend
      let stressTrend = "neutral";
      if (stressDays.length >= 4) {
        const half = Math.floor(stressDays.length / 2);
        const recent = stressDays.slice(0, half);
        const older  = stressDays.slice(half);
        const recentAvg = recent.reduce((s, d) => s + d.stress, 0) / recent.length;
        const olderAvg  = older.reduce((s, d)  => s + d.stress, 0) / older.length;
        if (recentAvg < olderAvg - 5) stressTrend = "improving";
        else if (recentAvg > olderAvg + 5) stressTrend = "increasing";
      }

      setInsights({ topMood, avgStress, bestWaterDay, stressTrend });
    };

    refreshTimeline();
    window.addEventListener("learnova-wellness-updated", refreshTimeline);
    window.addEventListener("storage", refreshTimeline);

    return () => {
      window.removeEventListener("learnova-wellness-updated", refreshTimeline);
      window.removeEventListener("storage", refreshTimeline);
    };
  }, []);

  const hasAnyData = history.some(
    (d) => d.mood || d.stress !== null || d.water !== null
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-[2rem] border border-white/10 bg-white/80 dark:bg-slate-950/70 dark:border-slate-700 shadow-2xl shadow-slate-950/20 backdrop-blur-xl p-6 lg:p-8 transition-colors duration-300"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
            Wellness
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">
            Wellness Journey Timeline
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Review your wellbeing trends from the last 7 days.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-4 text-center shadow-sm">
          <CalendarDays className="mx-auto h-6 w-6 text-slate-500 dark:text-slate-300" />
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            7-Day View
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-8 space-y-3">
        {!hasAnyData ? (
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No wellness history available yet. Start tracking your mood, stress,
            and hydration to see your journey here.
          </div>
        ) : (
          history.map((day) => {
            const hasData =
              day.mood || day.stress !== null || day.water !== null;
            return (
              <div
                key={day.dateKey}
                className={`rounded-3xl border p-4 transition-colors duration-200 ${
                  hasData
                    ? "border-slate-200/80 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-900/70"
                    : "border-slate-200/80 dark:border-slate-700/70 bg-slate-50/80 dark:bg-slate-900/60"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-[90px] text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {day.label}
                  </span>

                  {hasData ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {day.mood && (
                        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-violet-500/10 px-3 py-1.5 text-sm text-violet-700 dark:text-violet-300">
                          {MOOD_EMOJIS[day.mood]} {MOOD_LABELS[day.mood]}
                        </span>
                      )}
                      {day.stress !== null && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-sm ${
                            day.stress >= 70
                              ? "bg-orange-500/10 text-orange-700 dark:text-orange-300"
                              : day.stress >= 35
                              ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300"
                              : "bg-green-500/10 text-green-700 dark:text-green-300"
                          }`}
                        >
                          Stress {day.stress}%
                        </span>
                      )}
                      {day.water !== null && day.water > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-500/10 px-3 py-1.5 text-sm text-blue-700 dark:text-blue-300">
                          💧 {day.water} glasses
                        </span>
                      )}
                      {day.hasReflection && (
                        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-fuchsia-500/10 px-3 py-1.5 text-sm text-fuchsia-700 dark:text-fuchsia-300">
                          📝 Reflection
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      No data recorded
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Weekly Insights */}
      {insights && (
        <div className="mt-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            Weekly Insights
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Most Frequent Mood</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {insights.topMood
                  ? `${MOOD_EMOJIS[insights.topMood]} ${MOOD_LABELS[insights.topMood]}`
                  : "N/A"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Average Stress</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {insights.avgStress !== null ? `${insights.avgStress}%` : "N/A"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Best Hydration</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {insights.bestWaterDay
                  ? `${insights.bestWaterDay.water} glasses (${formatDateLabel(
                      insights.bestWaterDay.dateKey
                    )})`
                  : "N/A"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Stress Trend</p>
              <p className="mt-2 flex items-center gap-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {insights.stressTrend === "improving" && (
                  <>
                    <TrendingDown className="h-6 w-6 text-green-500" /> Improving
                  </>
                )}
                {insights.stressTrend === "increasing" && (
                  <>
                    <TrendingUp className="h-6 w-6 text-orange-500" /> Increasing
                  </>
                )}
                {insights.stressTrend === "neutral" && (
                  <>
                    <Minus className="h-6 w-6 text-slate-400" /> Steady
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}
