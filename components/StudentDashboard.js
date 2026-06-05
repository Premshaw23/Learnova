"use client";

// ============================================================================
// 📦 CORE IMPORTS & DEPENDENCIES
// ============================================================================
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { toast } from "react-hot-toast";

// ============================================================================
// 🎨 ICONS (Lucide React)
// ============================================================================
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
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  BookOpen
} from "lucide-react";

// ============================================================================
// 🧩 COMPONENTS & HOOKS
// ============================================================================
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import ChartSkeleton from "@/components/ui/ChartSkeleton";
import StreakTracker from "@/components/ui/StreakTracker";
import ExportDropdown from "@/components/ui/ExportDropdown";
import { Navbar } from "./Navbar";

import { useAuth } from "@/hooks/useAuth";
import { useAttendance } from "@/hooks/useAttendance";
import { useCurriculum } from "@/hooks/useCurriculum";
import { useIsMounted } from "@/hooks/useIsMounted";

import { weeklySchedule } from "@/constants/mockData";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";

// ============================================================================
// ⚙️ CONSTANTS & CONFIGURATION
// ============================================================================
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
const REFRESH_INTERVAL_MS = 1000;

// ============================================================================
// 🛠️ UTILITY FUNCTIONS
// ============================================================================

/**
 * Extracts initials from a user object for avatar fallback.
 * @param {Object} user - The authenticated user object.
 * @returns {string} The user's initials (max 2 characters).
 */
const getUserInitials = (user) => {
  if (!user?.displayName && !user?.email) {
    return "U";
  }

  return (
    user?.displayName
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) ||
    user?.email?.[0]?.toUpperCase() ||
    "U"
  );
};

/**
 * Returns the string name of the day based on JS Date index.
 * @param {number} dayIndex - The index of the day (0-6).
 * @returns {string} The name of the day.
 */
const getDayName = (dayIndex) => DAY_NAMES[dayIndex] || DAY_NAMES[0];

/**
 * Checks if a given day index represents a weekday.
 * @param {number} dayIndex - The index of the day (0-6).
 * @returns {boolean} True if weekday, false if weekend.
 */
const isWeekday = (dayIndex) => dayIndex >= 1 && dayIndex <= 5;

/**
 * Parses a class time string (e.g., "09:00-10:30") into hour and minute integers.
 * @param {string} time - The time string to parse.
 * @returns {Object} An object containing { hour, minute }.
 */
const parseClassStartTime = (time = "") => {
  const [startTime = "00:00"] = String(time).split("-");
  const [hour = "0", minute = "0"] = startTime.split(":");

  return {
    hour: Number(hour),
    minute: Number(minute),
  };
};

/**
 * Finds the next upcoming class based on current time.
 * @param {Array} classes - Array of class objects for the day.
 * @param {Date} now - The current Date object.
 * @returns {Object|null} The upcoming class object, or null.
 */
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

/**
 * Computes the complete schedule state for the current day.
 * @param {Date} now - The current Date object.
 * @param {Object} schedule - The master weekly schedule object.
 * @returns {Object} The compiled schedule state.
 */
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

/**
 * Generates a unique string key based on the current minute to prevent over-rendering.
 * @param {Date} now - The current Date object.
 * @returns {string} Formatted tick key.
 */
const getScheduleTickKey = (now) =>
  `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;


// ============================================================================
// 🎨 INLINE SKELETON LOADERS FOR DYNAMIC IMPORTS
// ============================================================================

const WidgetSkeleton = () => (
  <div className="w-full h-full min-h-[150px] bg-card/50 animate-pulse rounded-2xl border border-white/5 flex flex-col p-6 space-y-4">
    <div className="h-6 bg-white/10 rounded-md w-1/3"></div>
    <div className="h-4 bg-white/5 rounded-md w-1/2"></div>
    <div className="flex-1 bg-white/5 rounded-xl mt-4"></div>
  </div>
);

const HeatmapSkeleton = () => (
  <div className="w-full h-[300px] bg-card/50 animate-pulse rounded-2xl border border-white/5 p-6 flex flex-col">
    <div className="h-6 bg-white/10 rounded-md w-1/4 mb-6"></div>
    <div className="flex-1 grid grid-cols-12 gap-2">
      {[...Array(60)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-sm"></div>
      ))}
    </div>
  </div>
);

// ============================================================================
// 🚀 ADVANCED CODE-SPLITTING: DYNAMIC IMPORTS (Issue #3257)
// ============================================================================
// Extracted heavy UI chunks via Next.js Dynamic Imports to reduce FCP.

const AchievementSection = dynamic(() => import("./AchievementSection"), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});

const AttendanceChart = dynamic(() => import("./AttendanceChart"), {
  ssr: false,
  loading: () => <ChartSkeleton variant="bar" />,
});

const AttendanceAnalytics = dynamic(() => import("./dashboard/AttendanceAnalytics"), {
  ssr: false,
  loading: () => <ChartSkeleton variant="line" />,
});

const StreakCounter = dynamic(() => import("./gamification/StreakCounter"), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});

const XpProgressBar = dynamic(() => import("./gamification/XpProgressBar"), {
  ssr: false,
  loading: () => <div className="h-20 bg-card/50 animate-pulse rounded-2xl border border-white/5" />,
});

const BadgeGallery = dynamic(() => import("./gamification/BadgeGallery"), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});

const ComplaintForm = dynamic(() => import("@/components/ComplaintForm"), {
  ssr: false,
  loading: () => <WidgetSkeleton />
});

const AttendanceInsights = dynamic(() => import("@/components/AttendanceInsights"), {
  ssr: false,
  loading: () => <WidgetSkeleton />
});

const AttendanceHeatmap = dynamic(() => import("./AttendanceHeatmap"), {
  ssr: false,
  loading: () => <HeatmapSkeleton />,
});

const AttendanceCalendar = dynamic(() => import("./AttendanceCalendar"), {
  ssr: false,
  loading: () => <HeatmapSkeleton />,
});


// ============================================================================
// 🛡️ ERROR BOUNDARY FOR LAZY CHUNKS
// ============================================================================
/**
 * Catches errors in dynamically imported chunks to prevent full-page crashes.
 */
class LazyChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Chunk load error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-8 border-2 border-red-500/20 bg-red-500/5 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm transition-all">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <h3 className="text-red-400 font-black text-xl mb-2 tracking-tight">Component Failure</h3>
          <p className="text-sm text-red-300/80 mb-6 max-w-sm">
            We could not load this section of the dashboard. This is usually caused by a poor network connection during chunk fetching.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white transition-all duration-200 bg-red-500 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 hover:bg-red-600"
          >
            <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            Try Loading Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 👁️ INTERSECTION OBSERVER LAZY WRAPPER
// ============================================================================
/**
 * Defer rendering of children until they scroll into the viewport.
 * Dramatically improves performance on slow devices.
 */
const LazySection = ({ children, minHeight = "250px", rootMargin = "200px" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin }
    );

    if (domRef.current) {
      observer.observe(domRef.current);
    }

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div 
      ref={domRef} 
      style={{ minHeight: isVisible ? "auto" : minHeight }}
      className={`transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {isVisible ? (
        <LazyChunkErrorBoundary>
          {children}
        </LazyChunkErrorBoundary>
      ) : (
        <div className="w-full h-full min-h-[inherit] bg-card/20 rounded-3xl border border-white/5 animate-pulse" />
      )}
    </div>
  );
};

// ============================================================================
// 🧩 SUB-COMPONENTS
// ============================================================================

/**
 * Standardized error display for the entire dashboard.
 */
const DashboardError = ({ error, onRetry }) => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950" />
    <div className="text-center max-w-md relative z-10 bg-zinc-900/50 p-8 rounded-3xl border border-red-500/20 shadow-2xl backdrop-blur-xl">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-red-500/20">
        <AlertTriangle className="w-10 h-10 text-red-500 animate-bounce" />
      </div>
      <h2 className="text-2xl font-black mb-3 text-white tracking-tight">System Error</h2>
      <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
        {error || "An unexpected error occurred while loading your profile data."}
      </p>
      <button
        onClick={onRetry}
        className="w-full bg-gradient-to-r from-red-500 to-orange-500 py-3.5 rounded-xl font-bold text-white shadow-lg hover:shadow-red-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-5 h-5" />
        Reboot Dashboard
      </button>
    </div>
  </div>
);

/**
 * Premium Header Component.
 */
const DashboardHeader = ({ user, currentTime, getInitials }) => (
  <div className="bg-zinc-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      
      {/* User Info Left */}
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0 group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition duration-500"></div>
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt="Profile"
              width={64}
              height={64}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white/10 group-hover:border-white/20 transition-colors"
            />
          ) : (
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-white/10 shadow-inner">
              <span className="text-lg font-black text-white tracking-wider">
                {getInitials(user)}
              </span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-400 rounded-full border-[3px] border-zinc-900 shadow-sm" />
        </div>

        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              {user?.displayName || user?.email?.split("@")[0] || "Student"}
            </h1>
            <StreakTracker />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-sm text-zinc-400 font-medium">
              {user?.email || "Authenticated Securely"}
            </span>
          </div>
        </div>
      </div>

      {/* Clock Right */}
      <div className="text-left md:text-right bg-black/20 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center md:justify-end gap-2 text-indigo-400 mb-1">
          <Clock className="w-4 h-4" />
          <div className="text-xl sm:text-2xl font-black font-mono tracking-tight">
            {currentTime?.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <div className="flex items-center md:justify-end gap-2 text-zinc-400">
          <Calendar className="w-3.5 h-3.5" />
          <div className="text-xs sm:text-sm font-bold uppercase tracking-widest">
            {currentTime?.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

    </div>
  </div>
);

/**
 * Reusable Premium Stat Card.
 */
const StatCard = ({ color, label, value, icon: Icon }) => {
  const styles = {
    green: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5",
    red: "from-rose-500/10 to-rose-600/5 border-rose-500/20 text-rose-400 shadow-rose-500/5",
    yellow: "from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400 shadow-amber-500/5",
    blue: "from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 text-indigo-400 shadow-indigo-500/5",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400 shadow-purple-500/5",
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${styles[color]} border rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300 group-hover:scale-110 transform">
        {Icon && <Icon className="w-16 h-16" />}
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-2 rounded-lg bg-white/5 border border-white/5`}>
            {Icon && <Icon className="w-4 h-4" />}
          </div>
          <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-300">
            {label}
          </div>
        </div>

        <div className="text-3xl sm:text-5xl font-black tracking-tighter">
          {value}
        </div>
      </div>
    </div>
  );
};


// ============================================================================
// 🎓 MAIN DASHBOARD COMPONENT
// ============================================================================
const StudentDashboard = () => {
  // ─── HOOKS ─────────────────────────────────────────────────────────────────
  const { user } = useAuth();
  const isMounted = useIsMounted();

  const { recentActivity, gamificationData } = useAttendance({
    role: "student",
    user,
  });
  
  const { curriculum } = useCurriculum({ role: "student", user });

  // ─── STATE ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduleTime, setScheduleTime] = useState(new Date());
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState("heatmap");
  const [showComplaint, setShowComplaint] = useState(false);
  const [showDiagnosticQuiz, setShowDiagnosticQuiz] = useState(true);
  const [skillPath, setSkillPath] = useState("standard");
  
  const lastScheduleTickRef = useRef(getScheduleTickKey(new Date()));

  // ─── MEMOIZED STATS CALCULATIONS ───────────────────────────────────────────
  const attendanceStats = useMemo(() => {
    if (!recentActivity) return { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };

    const counts = recentActivity.reduce(
      (acc, curr) => {
        const status = curr?.status?.toLowerCase();
        if (status === "present") acc.present++;
        else if (status === "absent") acc.absent++;
        else if (status === "late") acc.late++;
        return acc;
      },
      { present: 0, absent: 0, late: 0 }
    );

    const total = counts.present + counts.absent + counts.late;
    const percentage = total > 0 ? Math.round(((counts.present + counts.late) / total) * 100) : 0;

    return { ...counts, total, percentage };
  }, [recentActivity]);

  const attendancePerformance = useMemo(() => {
    return {
      attendancePercentage: attendanceStats?.percentage ?? 0,
      streakDays: gamificationData?.currentStreak ?? 0,
    };
  }, [attendanceStats, gamificationData]);

  const scheduleState = useMemo(
    () => getTodaySchedule(scheduleTime, weeklySchedule),
    [scheduleTime]
  );

  const todayClasses = scheduleState.classes;
  const upcomingClass = scheduleState.upcomingClass;
  const isAttendanceWindow = scheduleState.isAttendanceWindow;

  // ─── ENGINE INTERVAL ───────────────────────────────────────────────────────
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      if (isMounted()) setLoading(false);
    }, 1500);

    const updateDashboard = () => {
      if (!isMounted()) return;
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
    const timer = setInterval(updateDashboard, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      clearTimeout(loadingTimer);
    };
  }, [isMounted]);

  // ─── HANDLERS ──────────────────────────────────────────────────────────────
  const handleEvaluateQuiz = (scoreOutOfFive) => {
    const percentage = (scoreOutOfFive / 5) * 100;
    if (percentage >= 80) {
      setSkillPath("advanced");
      toast.success("Advanced track unlocked based on evaluation.");
    } else if (percentage <= 40) {
      setSkillPath("booster");
      toast.success("Booster track activated for extra support.");
    } else {
      setSkillPath("standard");
      toast.success("Standard curriculum sequence initialized.");
    }
    setShowDiagnosticQuiz(false);
  };

  const handleExportAttendance = (format) => {
    if (!recentActivity || recentActivity.length === 0) {
      toast.error("No attendance records available to export.");
      return;
    }
    
    const exportData = recentActivity.map((record) => ({
      Date: record.date,
      Time: record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : "-",
      Status: record.status.toUpperCase(),
      Confidence: `${Math.round(record.confidenceScore * 100)}%`,
    }));
    
    const filename = `Learnova_Attendance_${user?.displayName?.replace(/\s+/g, '_') || "Student"}_${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      exportToCSV(exportData, filename);
      toast.success("Successfully exported records to CSV.");
    } else {
      const columns = [
        { header: "Date", dataKey: "Date" },
        { header: "Time", dataKey: "Time" },
        { header: "Status", dataKey: "Status" },
        { header: "Confidence", dataKey: "Confidence" },
      ];
      exportToPDF(
        exportData,
        columns,
        `Official Attendance Report: ${user?.displayName || "Student"}`,
        filename
      );
      toast.success("Successfully compiled and downloaded PDF report.");
    }
  };

  // ─── EARLY RETURNS ─────────────────────────────────────────────────────────
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={() => window.location.reload()} />;
  }

  // ─── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-x-hidden text-zinc-100 font-sans selection:bg-indigo-500/30">
      
      {/* Background Decorators */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[30%] h-[40%] rounded-full bg-purple-900/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] rounded-full bg-emerald-900/5 blur-[100px]" />
      </div>

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto pt-24 pb-20 px-4 sm:px-6 xl:px-8 space-y-8">
        
        {/* ====================================================================
            ⚡ CRITICAL PATH UI (Loads Instantly, Blocks Thread minimally)
            ==================================================================== */}
        
        {/* Diagnostic Quiz Section (Integrated from Master) */}
        {showDiagnosticQuiz ? (
          <div className="bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-zinc-900/50 border border-indigo-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
                    Dynamic Module Evaluation
                  </h3>
                </div>
                <p className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-2xl">
                  Simulate your proficiency level to adapt the dashboard interface. This determines the complexity of your recommended learning paths.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={() => handleEvaluateQuiz(5)}
                  className="flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                >
                  <TrendingUp className="w-4 h-4" />
                  Fast-Track (Advanced)
                </button>
                <button
                  onClick={() => handleEvaluateQuiz(2)}
                  className="flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  Booster (Foundational)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-300">
                Active Learning Sequence:
              </span>
            </div>
            <span
              className={`text-xs px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-inner ${
                skillPath === "advanced"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : skillPath === "booster"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              }`}
            >
              {skillPath} Track
            </span>
          </div>
        )}

        {/* Adaptive Context Banners */}
        {skillPath === "advanced" && !showDiagnosticQuiz && (
          <div className="p-5 bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl animate-in slide-in-from-left-4">
            <h4 className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-1 uppercase tracking-widest">
              <TrendingUp className="w-4 h-4" /> Fast-Track Active
            </h4>
            <p className="text-xs text-zinc-400">
              Foundational modules hidden. Advanced algorithmic challenges and rapid-fire quizzes are prioritized.
            </p>
          </div>
        )}

        {skillPath === "booster" && !showDiagnosticQuiz && (
          <div className="p-5 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl animate-in slide-in-from-left-4">
            <h4 className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1 uppercase tracking-widest">
              <BookOpen className="w-4 h-4" /> Supplemental Modules Active
            </h4>
            <p className="text-xs text-zinc-400">
              Extra video references and glossary definitions have been added to your dashboard flow.
            </p>
          </div>
        )}

        {/* Primary Dashboard Header */}
        <DashboardHeader
          user={user}
          currentTime={currentTime}
          getInitials={getUserInitials}
        />

        {/* Top KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard color="green" label="Present" value={attendanceStats.present} icon={CheckCircle2} />
          <StatCard color="yellow" label="Late" value={attendanceStats.late} icon={Clock} />
          <StatCard color="red" label="Absent" value={attendanceStats.absent} icon={AlertTriangle} />
          <StatCard color="blue" label="Overall Ratio" value={`${attendanceStats.percentage}%`} icon={TrendingUp} />
        </div>

        {/* Export Controls (Integrated from Master) */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mt-8 pt-8 border-t border-white/5">
          <h2 className="text-2xl font-black tracking-tight text-white">Behavioral Analytics</h2>
          <ExportDropdown onExport={handleExportAttendance} />
        </div>

        {/* ========================================================================
            🔥 PROGRESSIVE HYDRATION ZONE
            Everything below is wrapped in <LazySection />. These components do NOT
            block the initial page load or hydration. They only download and render
            when the user scrolls them into the viewport. Reduces FCP dramatically.
            ======================================================================== */}

        <LazySection minHeight="400px">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Heatmap/Calendar Area */}
            <div className="lg:col-span-2 flex flex-col h-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4">
                <h3 className="text-lg font-bold text-zinc-200">Historical Footprint</h3>
                <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
                  <button 
                    onClick={() => setViewMode('heatmap')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                      viewMode === 'heatmap' 
                        ? 'bg-indigo-500 text-white shadow-lg' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Heatmap
                  </button>
                  <button 
                    onClick={() => setViewMode('calendar')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                      viewMode === 'calendar' 
                        ? 'bg-indigo-500 text-white shadow-lg' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Calendar
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-zinc-900/40 border border-white/5 rounded-3xl p-2 shadow-xl">
                {viewMode === "heatmap" ? <AttendanceHeatmap /> : <AttendanceCalendar />}
              </div>
            </div>

            {/* Gamification Area */}
            <div className="flex flex-col gap-6">
              <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 shadow-xl flex-1 flex items-center justify-center">
                <XpProgressBar data={gamificationData} />
              </div>
              <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 shadow-xl flex-1 flex items-center justify-center">
                <StreakCounter data={gamificationData} />
              </div>
            </div>
            
          </div>
        </LazySection>

        {/* Master Branch: Attendance Insights Component */}
        <LazySection minHeight="250px">
          <div className="mt-4">
            <AttendanceInsights recentActivity={recentActivity} />
          </div>
        </LazySection>

        <LazySection minHeight="450px">
          <div className="mt-8">
            <h2 className="text-2xl font-black tracking-tight text-white mb-6">Engagement Trends</h2>
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
              <AttendanceAnalytics data={recentActivity} />
            </div>
          </div>
        </LazySection>

        <LazySection minHeight="300px">
          <div className="mt-8">
            <h2 className="text-2xl font-black tracking-tight text-white mb-6">Milestones & Achievements</h2>
            <AchievementSection />
          </div>
        </LazySection>

        <LazySection minHeight="400px">
          <div className="mt-8">
            <h2 className="text-2xl font-black tracking-tight text-white mb-6">Temporal Distribution</h2>
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
              <AttendanceChart data={recentActivity} />
            </div>
          </div>
        </LazySection>

        <LazySection minHeight="350px">
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-8 h-8 text-amber-400" />
              <h2 className="text-2xl font-black tracking-tight text-white">Badge Vault</h2>
            </div>
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
              <BadgeGallery />
            </div>
          </div>
        </LazySection>

        {/* Conditional Heavy Form - Only loads if the user requests it */}
        {showComplaint && (
          <LazySection minHeight="600px">
            <div className="mt-12 bg-zinc-900/80 border border-rose-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
              <ComplaintForm onClose={() => setShowComplaint(false)} />
            </div>
          </LazySection>
        )}

      </div>
    </div>
  );
};

export default StudentDashboard;