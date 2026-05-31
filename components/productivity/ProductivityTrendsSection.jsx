"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AIProductivityInsights from "./AIProductivityInsights";

import {
  Flame,
  Clock3,
  BarChart3,
  Brain,
  TrendingUp,
} from "lucide-react";

import {
  ResponsiveContainer,
    Bar,
  XAxis,
  YAxis,
  BarChart,
  CartesianGrid,
} from "recharts";

import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";

import {
  getAnalyticsSummary,
} from "@/utils/productivityAnalytics";

export default function ProductivityTrendsSection({ isDark }) {
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        if (!user) return;

        const token = await user.getIdToken();

        const data = await apiFetch(
          "/api/productivity/session",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSessions(data.sessions || []);
      } catch (error) {
        console.error(
          "Failed to load productivity analytics:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [user]);

  const analytics = useMemo(
  () => getAnalyticsSummary(sessions),
  [sessions]
);

  if (loading) {
    return (
      <div
        className={`rounded-3xl p-6 ${
          isDark
            ? "bg-black/40 border border-white/10"
            : "bg-white border border-slate-200"
        }`}
      >
        <p className="text-sm opacity-70">
          Loading productivity analytics...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={`w-full overflow-hidden rounded-3xl p-6 ${
        isDark
          ? "bg-black/40 border border-white/10 backdrop-blur-xl"
          : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
      }`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <p
            className={`text-sm ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Focus Analytics
          </p>

          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-300" />
            Productivity Trends
          </h3>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs ${
            isDark
              ? "bg-cyan-500/10 text-cyan-200 border border-cyan-500/20"
              : "bg-cyan-100 text-cyan-700 border border-cyan-200"
          }`}
        >
          Last 7 days
        </div>
      </div>

<div className="grid lg:grid-cols-2 gap-6 items-stretch">

    {/* LEFT SIDE - CHART */}

    <div
        className={`rounded-2xl p-4 ${
        isDark
            ? "bg-black/40 border border-white/10"
            : "bg-slate-50 border border-slate-200"
        }`}
    >
        <div className="flex items-center justify-between mb-4">
        <div>
            <h4 className="text-lg font-semibold">
            Weekly Focus Trend
            </h4>

            <p
            className={`text-sm ${
                isDark
                ? "text-slate-300"
                : "text-slate-600"
            }`}
            >
            Minutes focused each day
            </p>
        </div>

        <div
            className={`text-sm ${
            isDark
                ? "text-slate-300"
                : "text-slate-600"
            }`}
        >
            Avg: {analytics.averageSessionDuration}m
        </div>
        </div>

        <div className="h-52">
        <ResponsiveContainer width="100%" height={200}>
            <BarChart
                data={analytics.weeklyFocusData}
                margin={{
                    top: 10,
                    right: 0,
                    left: -10,
                    bottom: -10,
                }}
                >
                <defs>
                    <linearGradient
                    id="barGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                    >
                    <stop
                        offset="0%"
                        stopColor="#22d3ee"
                    />

                    <stop
                        offset="50%"
                        stopColor="#6366f1"
                    />

                    <stop
                        offset="100%"
                        stopColor="#9333ea"
                    />
                    </linearGradient>
                </defs>

                <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.08}
                />

                <YAxis hide />

                <XAxis
                    dataKey="day"
                    tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                    }}
                    tickLine={false}
                    axisLine={false}
                />
                <Bar
                    dataKey="minutes"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                />
            </BarChart>
        </ResponsiveContainer>
        </div>
    </div>

    {/* RIGHT SIDE - METRICS */}

    <div className="grid grid-cols-2 gap-3">

    {/* Total Focus Time */}

    <div
        className={`rounded-xl p-3 ${
        isDark
            ? "bg-black/40 border border-white/10"
            : "bg-slate-50 border border-slate-200"
        }`}
    >
        <div className="flex items-center gap-2 mb-1">
            <Clock3 className="w-4 h-4 text-blue-500" />

            <p className="text-xs opacity-70">
                Total Focus Time
            </p>
        </div>

        <div className="flex items-end gap-1">
            <span className="text-3xl font-semibold text-blue-400 leading-none">
                {analytics.totalFocusMinutes}
            </span>

            <span className="text-sm text-blue-500 pb-0.5">
                mins
            </span>
            </div>

        <p className="text-xs text-slate-500 mt-1">
        This Week
        </p>
    </div>

    {/* Avg Session */}

    <div
        className={`rounded-xl p-3 ${
        isDark
            ? "bg-black/40 border border-white/10"
            : "bg-slate-50 border border-slate-200"
        }`}
    >
        <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-300" />
            <p className="text-xs opacity-70">
                Avg. Session
            </p>
        </div>

        <div className="flex items-end gap-1">
            <span className="text-3xl font-semibold text-emerald-300 leading-none">
                {analytics.averageSessionDuration}
            </span>

            <span className="text-sm text-emerald-400 pb-0.5">
                mins
            </span>
            </div>

        <p className="text-xs text-slate-500 mt-1">
        Per session
        </p>
    </div>

    {/* Focus Sessions */}

    <div
        className={`rounded-xl p-3 ${
        isDark
            ? "bg-black/40 border border-white/10"
            : "bg-slate-50 border border-slate-200"
        }`}
    >
        <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-cyan-300" />
            <p className="text-xs opacity-70">
                Focus Sessions
            </p>
        </div>

        <div className="text-3xl font-semibold text-cyan-300 leading-none">
            {analytics.completedFocusSessions}
        </div>

        <p className="text-xs text-slate-500 pb-0.5">
        Completed
        </p>
    </div>

    {/* Focus Streak */}

    <div
        className={`rounded-xl p-3 ${
        isDark
            ? "bg-black/40 border border-white/10"
            : "bg-slate-50 border border-slate-200"
        }`}
    >
        <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-300" />
            <p className="text-xs opacity-70">
                Focus Streak
            </p>
        </div>

        <div className="flex items-end gap-1">
            <span className="text-3xl font-semibold text-yellow-300 leading-none">
                {analytics.focusStreak}
            </span>

            <span className="text-sm text-yellow-400 pb-0.5">
                days
            </span>
            </div>

        <p className="text-xs text-slate-500 mt-1">
        Current streak
        </p>
    </div>

    {/* Best Focus Time */}

    <div
        className={`rounded-xl p-3 ${
        isDark
            ? "bg-black/40 border border-white/10"
            : "bg-slate-50 border border-slate-200"
        }`}
    >
        <div className="flex items-center gap-2 mb-1">
            <Clock3 className="w-4 h-4 text-yellow-300" />
            <p className="text-xs opacity-70">
                Best Focus Time
            </p>
        </div>

       <div
            className={`text-xl font-semibold transition-colors duration-300 ${
                isDark ? "text-slate-100" : "text-slate-900"
            }`}
            >
            {analytics.peakFocusHours}
        </div>

        <p className="text-xs text-slate-500 pb-0.5">
        Most productive
        </p>
    </div>

    {/* Consistency Score */}

    <div
        className={`rounded-xl p-3 ${
        isDark
            ? "bg-black/40 border border-white/10"
            : "bg-slate-50 border border-slate-200"
        }`}
    >
        <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-purple-300" />
            <p className="text-xs opacity-70">
                Consistency Score
            </p>
        </div>

        <div className="flex items-end gap-1">
            <span className="text-3xl font-semibold text-emerald-300 leading-none">
                {analytics.consistencyScore}
            </span>

            <span className="text-sm text-emerald-400 pb-0.5">
                %
            </span>
            </div>

        <p className="text-xs text-slate-500 mt-1">
        This week
        </p>
    </div>
    </div>
    </div>
    
    <AIProductivityInsights
        analytics={analytics}
        isDark={isDark}
    />
    </motion.div>
  );
}