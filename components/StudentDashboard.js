"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

import {
  Calendar,
  Clock,
  MapPin,
  Camera,
  CheckCircle,
  Shield,
  Smartphone,
  TrendingUp,
  Target,
  Award,
  RefreshCw,
  Download,
  Star,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import ChartSkeleton from "@/components/ui/ChartSkeleton";

import { Navbar } from "./Navbar";
import { useAuth } from "@/hooks/useAuth";

import AchievementSection from "./AchievementSection";
import AttendanceChart from "./AttendanceChart";

import {
  weeklySchedule,
} from "@/constants/mockData";
import { getUserActivities } from "@/services/activityService";

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

import AttendanceAnalytics from "./dashboard/AttendanceAnalytics";
import StreakCounter from "./gamification/StreakCounter";
import XpProgressBar from "./gamification/XpProgressBar";
import BadgeGallery from "./gamification/BadgeGallery";
import ComplaintForm from "@/components/ComplaintForm";

const StudentDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState(null);

  const [todayClasses, setTodayClasses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingClass, setUpcomingClass] = useState(null);
  const [isAttendanceWindow, setIsAttendanceWindow] =
    useState(false);

  const [gamificationData, setGamificationData] =
    useState(null);

  const [viewMode, setViewMode] = useState("heatmap");

  const [showComplaint, setShowComplaint] =
    useState(false);

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

    fetchActivity();
  }, [user]);

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        if (!user) return;

        const token = await user.getIdToken();

        const res = await fetch(
          "/api/student/gamification",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setGamificationData(data);
        }
      } catch (err) {
        console.error(
          "Failed to load gamification data",
          err
        );
      }
    };

    fetchGamification();
  }, [user]);

  // Attendance stats
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

  // Achievement data
  const attendancePerformance = useMemo(() => {
    return {
      attendancePercentage:
        attendanceStats?.percentage ?? 0,

      streakDays:
        gamificationData?.currentStreak ?? 8,
    };
  }, [attendanceStats, gamificationData]);

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const updateDashboard = async () => {
      try {
        const now = new Date();

        setCurrentTime(now);

        const hour = now.getHours();
        const minute = now.getMinutes();
        const day = now.getDay();

        const isWeekday = day >= 1 && day <= 5;

        const isAttendanceTime =
          hour === 9 && minute <= 10;

        const newIsAttendance =
          isWeekday && isAttendanceTime;

        setIsAttendanceWindow((prev) =>
          prev !== newIsAttendance
            ? newIsAttendance
            : prev
        );

        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];

        const today = dayNames[day];

        const classes =
          weeklySchedule[today] || [];

        setTodayClasses(classes);

        const upcoming = classes.find((cls) => {
          const [startTime] =
            cls.time.split("-");

          const [classHour, classMinute] =
            startTime
              .split(":")
              .map(Number);

          return (
            hour < classHour ||
            (hour === classHour &&
              minute < classMinute)
          );
        });

        setUpcomingClass(upcoming || null);

        setError(null);
      } catch (err) {
        setError(
          "Failed to load dashboard data. Please try again."
        );

        console.error(
          "Error updating dashboard:",
          err
        );
      }
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

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "text-green-400 bg-green-500/10 border-green-500/30";

      case "absent":
        return "text-red-400 bg-red-500/10 border-red-500/30";

      case "late":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";

      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getUserInitials = () => {
    if (!user?.displayName && !user?.email) {
      return "U";
    }

    return (
      user?.displayName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() ||
      user?.email?.[0]?.toUpperCase() ||
      "U"
    );
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden flex items-center justify-center">
        <div className="relative z-10 text-center text-white px-4">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>

          <h2 className="text-2xl font-bold mb-2">
            Error Loading Dashboard
          </h2>

          <p className="text-gray-400 mb-6">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <RefreshCw className="w-5 h-5 mr-2 inline" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      <Navbar />

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

      {/* Attendance Heatmap */}
      <div className="relative z-10 mt-8">
        <div className="max-w-7xl mx-auto px-6">
          <AttendanceHeatmap />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  color,
  label,
  value,
}) => {
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
      className={`bg-gradient-to-r ${styles[color]} border rounded-xl p-4`}
    >
      <div className="text-sm">{label}</div>

      <div className="text-xl font-bold">
        {value}
      </div>
    </div>
  );
};

const QuickStat = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">
      {icon}

      <span className="text-gray-300 text-sm">
        {label}
      </span>
    </div>

    <span className="text-white font-semibold">
      {value}
    </span>
  </div>
);

const SecurityItem = ({
  label,
  status,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">
      <CheckCircle className="w-4 h-4 text-green-400" />

      <span className="text-gray-300 text-sm">
        {label}
      </span>
    </div>

    <span className="text-green-400 text-sm">
      {status}
    </span>
  </div>
);

export default StudentDashboard;
