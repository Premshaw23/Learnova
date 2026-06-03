"use client";

import React, { useMemo } from "react";
import { Flame, Trophy, TrendingUp, Award } from "lucide-react";
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateConsistency,
  getBadge,
} from "@/utils/attendanceStreak";

const InsightCard = ({ icon: Icon, label, value, color }) => {
  const colorStyles = {
    orange:
      "from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400",
    yellow:
      "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 text-yellow-400",
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400",
    purple:
      "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorStyles[color]} rounded-xl border p-4 flex items-center gap-3`}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="text-lg font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
};

const AttendanceInsights = ({ recentActivity }) => {
  const safeRecords = Array.isArray(recentActivity) ? recentActivity : [];

  const currentStreak = useMemo(
    () => calculateCurrentStreak(safeRecords),
    [safeRecords]
  );

  const longestStreak = useMemo(
    () => calculateLongestStreak(safeRecords),
    [safeRecords]
  );

  const consistency = useMemo(
    () => calculateConsistency(safeRecords),
    [safeRecords]
  );

  const badge = useMemo(() => getBadge(consistency), [consistency]);

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">
          Attendance Insights
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 px-2 py-1 rounded-full bg-white/5 border border-white/10">
          {badge}
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <InsightCard
          icon={Flame}
          label="Current Streak"
          value={`${currentStreak} ${currentStreak === 1 ? "Day" : "Days"}`}
          color="orange"
        />
        <InsightCard
          icon={Trophy}
          label="Longest Streak"
          value={`${longestStreak} ${longestStreak === 1 ? "Day" : "Days"}`}
          color="yellow"
        />
        <InsightCard
          icon={TrendingUp}
          label="Consistency"
          value={`${consistency}%`}
          color="blue"
        />
        <InsightCard icon={Award} label="Status" value={badge} color="purple" />
      </div>
    </div>
  );
};

export default AttendanceInsights;
