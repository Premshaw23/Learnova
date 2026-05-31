"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

import {
  Calendar,
  Clock,
  MapPin,
  Camera,
  Shield,
  TrendingUp,
  Target,
  Award,
  RefreshCw,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import ChartSkeleton from "@/components/ui/ChartSkeleton";

import { Navbar } from "./Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useAttendance } from "@/hooks/useAttendance";
import { useCurriculum } from "@/hooks/useCurriculum";

import AchievementSection from "./AchievementSection";
import AttendanceChart from "./AttendanceChart";

import { weeklySchedule } from "@/constants/mockData";

import AttendanceAnalytics from "./dashboard/AttendanceAnalytics";
import StreakCounter from "./gamification/StreakCounter";
import XpProgressBar from "./gamification/XpProgressBar";
import BadgeGallery from "./gamification/BadgeGallery";

import ComplaintForm from "@/components/ComplaintForm";
import StreakTracker from "@/components/ui/StreakTracker";

const AttendanceHeatmap = dynamic(
  () => import("./AttendanceHeatmap"),
  {
    ssr: false,
    loading: () => <ChartSkeleton variant="heatmap" />,
  }
);

const AttendanceCalendar = dynamic(
  () => import("./AttendanceCalendar"),
  {
    ssr: false,
    loading: () => <ChartSkeleton variant="heatmap" />,
  }
);

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ATTENDANCE_WINDOW_START_HOUR = 9;
const ATTENDANCE_WINDOW_END_MINUTE = 10;

const getUserInitials = (user) => {
  if (!user?.displayName && !user?.email) {
    return "U";
  }

  return (
    user?.displayName
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"
  );
};

const getDayName = (dayIndex) => DAY_NAMES[dayIndex] || DAY_NAMES[0];

const isWeekday = (dayIndex) => dayIndex >= 1 && dayIndex <= 5;

const parseClassStartTime = (time = "") => {
  const [startTime = "00:00"] = String(time).split("-");
  const [hour = "0", minute = "0"] = startTime.split(":");

  return {
    hour: Number(hour),
    minute: Number(minute),
  };
};

  const [showComplaint, setShowComplaint] =
    useState(false);

    const [skillPath, setSkillPath] = useState("standard"); 
    const [showDiagnosticQuiz, setShowDiagnosticQuiz] = useState(true);

    useEffect(() => {
    const fetchActivity = async () => {
      try {
        if (!user?.uid) return;
        const activities = await getUserActivities(user.uid);
        const mapped = activities.map(a => ({
         subject: a.title,
          date: a.timestamp?.toLocaleDateString() || "",
          status: a.progress >= 100 ? "present" : "late",
          }));
setRecentActivity(mapped);
      } catch (err) {
        console.error("Failed to load activity", err);
      }
    };
const getUpcomingClass = (classes, now) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    classes.find((cls) => {
      const startTime = parseClassStartTime(cls?.time);
      const classStartMinutes = startTime.hour * 60 + startTime.minute;

      return classStartMinutes > currentMinutes;
    }) || null
  );
};

const getTodaySchedule = (now, schedule = weeklySchedule) => {
  const dayIndex = now.getDay();
  const dayName = getDayName(dayIndex);
  const classes = schedule[dayName] || [];

  return {
    dayName,
    classes,
    upcomingClass: getUpcomingClass(classes, now),
    isAttendanceWindow:
      isWeekday(dayIndex) &&
      now.getHours() === ATTENDANCE_WINDOW_START_HOUR &&
      now.getMinutes() <= ATTENDANCE_WINDOW_END_MINUTE,
  };
};

const getScheduleTickKey = (now) =>
  `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

const DashboardError = ({ error, onRetry }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>

      <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>

      <p className="text-muted-foreground text-sm mb-6">{error}</p>

      <button
        onClick={onRetry}
        className="w-full bg-gradient-to-r from-green-500 to-blue-500 py-3 rounded-xl font-bold text-white"
      >
        <RefreshCw className="w-4 h-4 mr-2 inline" />
        Retry
      </button>
    </div>
  </div>
);

const DashboardHeader = ({ user, currentTime, getInitials }) => (
  <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border p-4 sm:p-6 shadow-xl">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt="Profile"
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-cover border border-accent/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{getInitials(user)}</span>
            </div>
          )}

          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background" />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-bold">
              {user?.displayName || user?.email?.split("@")[0] || "Student"}
            </h1>

            <StreakTracker />
          </div>

          <div className="text-sm text-muted-foreground">{user?.email || "No email"}</div>
        </div>
      </div>

      <div className="text-left md:text-right">
        <div className="text-lg sm:text-xl font-mono">
          {currentTime?.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        <div className="text-xs text-muted-foreground">
          {currentTime?.toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </div>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();

  const { recentActivity, gamificationData } = useAttendance({ role: "student", user });
  const { curriculum } = useCurriculum({ role: "student", user });

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduleTime, setScheduleTime] = useState(new Date());
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState("heatmap");
  const [showComplaint, setShowComplaint] = useState(false);
  const lastScheduleTickRef = useRef(getScheduleTickKey(new Date()));

  const attendanceStats = useMemo(() => {
    const counts = recentActivity.reduce(
      (acc, curr) => {
        const status = curr?.status?.toLowerCase();

        if (status === "present") acc.present++;
        else if (status === "absent") acc.absent++;
        else if (status === "late") acc.late++;

        return acc;
      },
      {
        present: 0,
        absent: 0,
        late: 0,
      }
    );

    const total =
      counts.present +
      counts.absent +
      counts.late;

    const percentage =
      total > 0
        ? Math.round(
            ((counts.present + counts.late) /
              total) *
              100
          )
        : 0;

    return {
      ...counts,
      total,
      percentage,
    };
  }, [recentActivity]);

  const attendancePerformance = useMemo(() => {
    return {
      attendancePercentage:
        attendanceStats?.percentage ?? 0,
      streakDays:
        gamificationData?.currentStreak ?? 0,
    };
  }, [attendanceStats, gamificationData]);

  const scheduleState = useMemo(
    () => getTodaySchedule(scheduleTime, weeklySchedule),
    [scheduleTime]
  );

  const todayClasses = scheduleState.classes;
  const upcomingClass = scheduleState.upcomingClass;
  const isAttendanceWindow = scheduleState.isAttendanceWindow;

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const updateDashboard = () => {
      const now = new Date();

      setCurrentTime(now);

      const scheduleTickKey = getScheduleTickKey(now);
      if (lastScheduleTickRef.current !== scheduleTickKey) {
        lastScheduleTickRef.current = scheduleTickKey;
        setScheduleTime(now);
      }

      setError(null);
    };

    updateDashboard();

    const timer = setInterval(
      updateDashboard,
      1000
    );

    return () => {
      clearInterval(timer);
      clearTimeout(loadingTimer);
    };
  }, []);

  if (loading) {
    const handleEvaluateQuiz = (scoreOutOfFive) => {
      const percentage = (scoreOutOfFive / 5) * 100;
  
      if (percentage >= 80) {
        setSkillPath("advanced"); 
      } else if (percentage <= 40) {
        setSkillPath("booster");  
      } else {
        setSkillPath("standard"); 
      }
        setShowDiagnosticQuiz(false); 
      };
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Navbar />
      {/* --- PASTE CHANGE 3 START --- */}
      {showDiagnosticQuiz ? (
        <div className="max-w-7xl mx-auto mt-6 px-6 relative z-20">
          <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-black border border-blue-500/30 rounded-2xl p-6 text-white backdrop-blur-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              <h3 className="text-lg font-bold">Dynamic Module Evaluation</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Choose an option below to test how the layout alters itself seamlessly depending on student skill level.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => handleEvaluateQuiz(5)} 
                className="bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Simulate Advanced Track (Skip Basics)
              </button>
              <button 
                onClick={() => handleEvaluateQuiz(2)} 
                className="bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Simulate Booster Track (Add Helpers)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto mt-6 px-6 relative z-20">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Current Adaptive Layout Sequence:</span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
              skillPath === 'advanced' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
              skillPath === 'booster' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              'bg-blue-500/20 text-blue-400 border border-white/10'
            }`}>
              {skillPath} Sequence Active
            </span>
          </div>
        </div>
      )}
      {/* --- PASTE CHANGE 3 END --- */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto pt-20 pb-6 px-6">
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-xl border border-accent/30 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center border border-accent/30">
                      <span className="text-sm font-bold text-white">
                        {getUserInitials()}
                      </span>
                    </div>
                  )}

                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black" />
                </div>

                <div>
                  <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
                    {user?.displayName ||
                      user?.email?.split("@")[0] ||
                      "Student"}
                  </h1>

                  <div className="text-sm text-gray-400">
                    {user?.email || "No email"}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-mono text-white">
                  {currentTime?.toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </div>

                <div className="text-xs text-gray-400">
                  {currentTime?.toLocaleDateString(
                    [],
                    {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT CONTINUES */}
      {/* --- PASTE THIS BLOCK RIGHT HERE TO DISPLAY DYNAMIC CONTENT SECTIONS --- */}
      <div className="max-w-7xl mx-auto px-6">
        {skillPath === "advanced" && (
          <div className="mt-6 p-5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <h4 className="text-purple-400 font-bold text-sm mb-1">🚀 Fast-Track Projects Unlocked</h4>
          <p className="text-xs text-gray-400">The layout has automatically removed foundational reading sequences. Enjoy your high-level coding challenges!</p>
        </div>
      )}

      {skillPath === "booster" && (
        <div className="mt-6 p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <h4 className="text-yellow-400 font-bold text-sm mb-1">💡 Supplemental Booster Modules Active</h4>
        <p className="text-xs text-gray-400">We have populated extra summary workflows and alternative video references to assist you with core terms.</p>
      </div>
    )}
  </div>
      {/* Keep all your remaining JSX exactly same below this */}

      <div className="relative z-10 max-w-7xl mx-auto pt-20 pb-12 px-4 sm:px-6 space-y-6">
        <DashboardHeader
          user={user}
          currentTime={currentTime}
          getInitials={getUserInitials}
        />

        {/* Remaining UI same structure */}

      </div>
    </div>
  );
};

const StatCard = ({ color, label, value }) => {
  const styles = {
    green:
      "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
    red:
      "from-red-500/20 to-red-600/20 border-red-500/30 text-red-400",
    yellow:
      "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400",
    blue:
      "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
  };

  return (
    <div
      className={`bg-gradient-to-r ${styles[color]} border rounded-xl p-3 sm:p-4`}
    >
      <div className="text-[10px] sm:text-sm opacity-80">
        {label}
      </div>

      <div className="text-base sm:text-xl font-bold">
        {value}
      </div>
    </div>
  );
};

export default StudentDashboard;