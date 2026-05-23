"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import ChartSkeleton from "@/components/ui/ChartSkeleton";

import { Navbar } from "./Navbar";
import { useAuth } from "@/hooks/useAuth";

import AttendanceChart from "./AttendanceChart";

import {
  weeklySchedule,
  mockRecentActivity,
} from "@/constants/mockData";

const AttendanceHeatmap = dynamic(
  () => import("./AttendanceHeatmap.jsx"),
  {
    ssr: false,
    loading: () => <ChartSkeleton variant="heatmap" />,
  }
);

const AttendanceCalendar = dynamic(
  () => import("./AttendanceCalendar.jsx"),
  {
    ssr: false,
    loading: () => <ChartSkeleton variant="heatmap" />,
  }
);

import AttendanceAnalytics from "./dashboard/AttendanceAnalytics";
import StreakCounter from "./gamification/StreakCounter";
import XpProgressBar from "./gamification/XpProgressBar";
import BadgeGallery from "./gamification/BadgeGallery";

const StudentDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(null);

  const [todayClasses, setTodayClasses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingClass, setUpcomingClass] = useState(null);
  const [isAttendanceWindow, setIsAttendanceWindow] = useState(false);
  const [gamificationData, setGamificationData] = useState(null);
  const [viewMode, setViewMode] = useState("heatmap");

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/student/gamification", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGamificationData(data);
        }
      } catch (err) {
        console.error("Failed to load gamification data", err);
      }
    };
    if (user) {
      fetchGamification();
    }
  }, [user]);

  // Mock schedule data is now imported from @/constants/mockData
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const updateDashboard = () => {
      const now = new Date();

      setCurrentTime(now);

      const hour = now.getHours();
      const minute = now.getMinutes();
      const day = now.getDay();

      const isWeekday = day >= 1 && day <= 5;
      const isAttendanceTime = hour === 9 && minute <= 10;
      const newIsAttendance = isWeekday && isAttendanceTime;

      setIsAttendanceWindow((prev) => (prev !== newIsAttendance ? newIsAttendance : prev));

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

      const classes = weeklySchedule[today] || [];

      setTodayClasses(classes);

      const upcoming = classes.find((cls) => {
        const [startTime] = cls.time.split("-");

        const [classHour, classMinute] = startTime
          .split(":")
          .map(Number);

        return (
          hour < classHour ||
          (hour === classHour && minute < classMinute)
        );
      });

      setUpcomingClass(upcoming || null);
    };

    updateDashboard();

    const timer = setInterval(updateDashboard, 1000);

    setRecentActivity(mockRecentActivity);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none animate-gradientMove" />

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.12)_0%,transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto pt-20 pb-6 px-6">
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* User */}
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

              {/* Time */}
              <div className="text-right">
                <div className="text-xl font-mono text-white">
                  {currentTime &&
                    currentTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </div>

                <div className="text-xs text-gray-400">
                  {currentTime &&
                    currentTime.toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <div className="flex md:flex-row flex-col space-y-1 md:space-y-0 items-center md:gap-3">
                <span className="text-sm text-gray-400">
                  Quick Actions:
                </span>

                <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  Export Data
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  System Status: Online
                </span>

                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Gamification Section */}
        {gamificationData && (
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex flex-col gap-6 flex-1">
                <div className="flex gap-4 items-center">
                  <StreakCounter currentStreak={gamificationData.currentStreak} />
                  <div className="flex-1">
                    <XpProgressBar 
                      currentLevel={gamificationData.currentLevel} 
                      currentXp={gamificationData.totalXp} 
                    />
                  </div>
                </div>
                <BadgeGallery unlockedBadges={gamificationData.unlockedBadges} />
              </div>
            </div>
            {user && user.uid && (
              <AttendanceAnalytics
                userId={user.uid}
                recentActivity={recentActivity}
              />
            )}
          </div>
        )}

        {/* Attendance Window */}
        {isAttendanceWindow && upcomingClass && (
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">
                    Mark Attendance
                  </h3>

                  <p className="text-gray-300">
                    Attendance window is open for{" "}
                    {upcomingClass.subject}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-400">
                  Next Class
                </div>

                <div className="text-white font-semibold">
                  {upcomingClass.time}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">
                    Time Window
                  </span>
                </div>

                <div className="text-white font-semibold">
                  09:00 - 09:10 AM
                </div>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">
                    Location
                  </span>
                </div>

                <div className="text-white font-semibold">
                  {upcomingClass.room}
                </div>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">
                    Security
                  </span>
                </div>

                <div className="text-white font-semibold">
                  GPS + Face + Code
                </div>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
              <span className="flex items-center justify-center space-x-2">
                <Camera className="w-5 h-5" />
                <span>Start Face Recognition</span>
                <Sparkles className="w-5 h-5" />
              </span>
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Attendance Overview
                </h2>

                <button
                  className="text-accent hover:text-accent/80 transition-colors"
                  aria-label="Refresh attendance overview"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  color="green"
                  label="Present"
                  value={attendanceStats.present}
                />

                <StatCard
                  color="red"
                  label="Absent"
                  value={attendanceStats.absent}
                />

                <StatCard
                  color="yellow"
                  label="Late"
                  value={attendanceStats.late}
                />

                <StatCard
                  color="blue"
                  label="Overall"
                  value={`${attendanceStats.percentage}%`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    Attendance Percentage
                  </span>

                  <span className="text-accent font-semibold">
                    {attendanceStats.percentage}%
                  </span>
                </div>

                <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-700"
                    style={{
                      width: `${attendanceStats.percentage}%`,
                    }}
                  />
                </div>

                <div className="text-xs text-gray-400">
                  Target: 75% minimum required
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Recent Activity
                </h2>

                <button
                  className="text-accent hover:text-accent/80 transition-colors"
                  aria-label="Download recent activity"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          activity.status === "present"
                            ? "bg-green-400"
                            : activity.status === "absent"
                            ? "bg-red-400"
                            : "bg-yellow-400"
                        }`}
                      />

                      <div>
                        <div className="text-white font-medium">
                          {activity.subject}
                        </div>

                        <div className="text-gray-400 text-sm">
                          {activity.date}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          activity.status
                        )}`}
                      >
                        {activity.status.toUpperCase()}
                      </div>

                      <div className="text-gray-400 text-sm mt-1">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap / Calendar View */}
            <div>
              <div className="flex justify-end mb-4">
                <div className="bg-black/40 backdrop-blur-md p-1 rounded-xl flex items-center border border-white/10 w-fit">
                  <button
                    onClick={() => setViewMode("heatmap")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === "heatmap"
                        ? "bg-accent text-white shadow-lg"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Heatmap
                  </button>
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === "calendar"
                        ? "bg-accent text-white shadow-lg"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Calendar
                  </button>
                </div>
              </div>

              {viewMode === "heatmap" ? (
                <AttendanceHeatmap recentActivity={recentActivity} />
              ) : (
                <AttendanceCalendar recentActivity={recentActivity} />
              )}
            </div>
          </div>

          {/* Right */}
          <div className="space-y-8">
            {/* Schedule */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-6 h-6 text-accent" />

                <h2 className="text-xl font-bold text-white">
                  Today's Classes
                </h2>
              </div>

              {todayClasses.length > 0 ? (
                <div className="space-y-3">
                  {todayClasses.map((cls, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-medium">
                          {cls.subject}
                        </div>

                        <div className="text-sm text-gray-400">
                          {cls.time}
                        </div>
                      </div>

                      <div className="text-sm text-gray-400">
                        {cls.teacher}
                      </div>

                      <div className="flex items-center space-x-1 mt-2">
                        <MapPin className="w-3 h-3 text-accent" />

                        <span className="text-xs text-accent">
                          {cls.room}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />

                  <p className="text-gray-400">
                    No classes scheduled for today
                  </p>
                </div>
              )}
            </div>

            {/* Chart */}
            <AttendanceChart />

            {/* Stats */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                Quick Stats
              </h2>

              <div className="space-y-4">
                <QuickStat
                  icon={<Target className="w-4 h-4 text-blue-400" />}
                  label="This Week"
                  value="4/5"
                />

                <QuickStat
                  icon={
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  }
                  label="This Month"
                  value="18/20"
                />

                <QuickStat
                  icon={<Award className="w-4 h-4 text-yellow-400" />}
                  label="Perfect Days"
                  value="12"
                />

                <QuickStat
                  icon={<Star className="w-4 h-4 text-purple-400" />}
                  label="Streak"
                  value="5 days"
                />
              </div>
            </div>

            {/* Security */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-6 h-6 text-green-400" />

                <h2 className="text-xl font-bold text-white">
                  Security Status
                </h2>
              </div>

              <div className="space-y-3">
                <SecurityItem
                  label="Face Registered"
                  status="Active"
                />

                <SecurityItem
                  label="Device Verified"
                  status="Trusted"
                />

                <SecurityItem
                  label="Location Access"
                  status="Granted"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-blue-400" />

                    <span className="text-gray-300 text-sm">
                      Mobile Verified
                    </span>
                  </div>

                  <span className="text-blue-400 text-sm">
                    +91 ***-***-1234
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }

          50% {
            background-position: 100% 50%;
          }

          100% {
            background-position: 0% 50%;
          }
        }

        .animate-gradientMove {
          background-size: 200% 200%;
          animation: gradientMove 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  );  
};

const StatCard = ({ color, label, value }) => {
  const styles = {
    green:
      "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400 text-green-300",
    red:
      "from-red-500/20 to-red-600/20 border-red-500/30 text-red-400 text-red-300",
    yellow:
      "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400 text-yellow-300",
    blue:
      "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400 text-blue-300",
  };

  const style = styles[color].split(" ");

  return (
    <div className={`bg-gradient-to-br ${style[0]} ${style[1]} rounded-xl p-4 border ${style[2]}`}>
      <div className={`text-2xl font-bold ${style[3]}`}>{value}</div>
      <div className={`${style[4]} text-sm`}>{label}</div>
    </div>
  );
};

const QuickStat = ({ icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">
      {icon}

      <span className="text-gray-300 text-sm">{label}</span>
    </div>

    <span className="text-white font-semibold">{value}</span>
  </div>
);

const SecurityItem = ({ label, status }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">
      <CheckCircle className="w-4 h-4 text-green-400" />

      <span className="text-gray-300 text-sm">{label}</span>
    </div>

    <span className="text-green-400 text-sm">{status}</span>
  </div>
);

export default StudentDashboard;
