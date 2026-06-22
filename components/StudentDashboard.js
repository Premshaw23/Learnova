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
  GripVertical,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import ChartSkeleton from "@/components/ui/ChartSkeleton";

import { Navbar } from "./Navbar";
import { dashboardContentOffsetClass } from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAttendance } from "@/hooks/useAttendance";
import { useCurriculum } from "@/hooks/useCurriculum";
import { useIsMounted } from "@/hooks/useIsMounted";
import EngagementScoreCard from "@/components/EngagementScoreCard";
import EngagementTrendChart from "@/components/EngagementTrendChart";
import EngagementBreakdown from "@/components/EngagementBreakdown";
import { calculateEngagementScore, getEngagementCategory } from "@/lib/engagementScore";

const AchievementSection = dynamic(() => import("./AchievementSection"), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
});

const StudentAchievementsPanel = dynamic(
  () => import("./achievements/StudentAchievementsPanel"),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

const AttendanceChart = dynamic(() => import("./AttendanceChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

import { weeklySchedule } from "@/constants/mockData";
import AttendanceAnalytics from "./dashboard/AttendanceAnalytics";
import StreakCounter from "./gamification/StreakCounter";
import XpProgressBar from "./gamification/XpProgressBar";
import BadgeGallery from "./gamification/BadgeGallery";

import ComplaintForm from "@/components/ComplaintForm";
import StreakTracker from "@/components/ui/StreakTracker";
import AttendanceInsights from "@/components/AttendanceInsights";
import ExportDropdown from "@/components/ui/ExportDropdown";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";
import { toast } from "react-hot-toast";
import QuickNotes from "@/components/productivity/QuickNotes";

const AttendanceHeatmap = dynamic(() => import("./AttendanceHeatmap"), {
  ssr: false,
  loading: () => <ChartSkeleton variant="heatmap" />,
});

const AttendanceCalendar = dynamic(() => import("./AttendanceCalendar"), {
  ssr: false,
  loading: () => <ChartSkeleton variant="heatmap" />,
});

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

// ── Utility Functions ──────────────────────────────────────────────────────

const getUserInitials = (user) => {
  if (!user?.displayName && !user?.email) {
    return "U";
  }

  return (
    user?.displayName
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U"
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

// ── Components ─────────────────────────────────────────────────────────────

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
              <span className="text-sm font-bold text-white">
                {getInitials(user)}
              </span>
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

          <div className="text-sm text-muted-foreground">
            {user?.email || "No email"}
          </div>
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

const StatCard = ({ color, label, value }) => {
  const styles = {
    green:
      "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
    red: "from-red-500/20 to-red-600/20 border-red-500/30 text-red-400",
    yellow:
      "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
  };

  return (
    <div
      className={`bg-gradient-to-r ${styles[color]} border rounded-xl p-3 sm:p-4`}
    >
      <div className="text-[10px] sm:text-sm opacity-80">{label}</div>

      <div className="text-base sm:text-xl font-bold">{value}</div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

const StudentDashboard = () => {
  const { user } = useAuth();

  const { recentActivity, gamificationData } = useAttendance({
    role: "student",
    user,
  });
  const { curriculum } = useCurriculum({ role: "student", user });
  const isMounted = useIsMounted();

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduleTime, setScheduleTime] = useState(new Date());
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState("heatmap");
  const [showComplaint, setShowComplaint] = useState(false);
  const [skillPath, setSkillPath] = useState("standard");
  const [showDiagnosticQuiz, setShowDiagnosticQuiz] = useState(false);
  const [engagementHistory, setEngagementHistory] = useState([]);
  const [engagementRecord, setEngagementRecord] = useState(null);
  const [engagementError, setEngagementError] = useState(null);
  const [engagementSaved, setEngagementSaved] = useState(false);
  const lastScheduleTickRef = useRef(getScheduleTickKey(new Date()));

  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [roadmap, setRoadmap] = useState([]);
  const [studyGroups] = useState([
  {
    name: "Web Development Group",
    subject: "Web Development",
    members: 15,
  },
  {
    name: "Data Science Circle",
    subject: "Data Science",
    members: 10,
  },
  {
    name: "AI Learners Hub",
    subject: "Artificial Intelligence",
    members: 12,
  },
]);

const [events] = useState([
  {
    title: "Mathematics Class",
    date: "10 June",
    type: "Class",
    color: "text-blue-400",
  },
  {
    title: "Physics Assignment",
    date: "12 June",
    type: "Assignment",
    color: "text-yellow-400",
  },
  {
    title: "Mid-Term Examination",
    date: "20 June",
    type: "Exam",
    color: "text-red-400",
  },
  {
    title: "Summer Holiday",
    date: "25 June",
    type: "Holiday",
    color: "text-green-400",
  },
]);

const [performanceData] = useState([
  {
    subject: "Mathematics",
    currentScore: 88,
    previousScore: 80,
  },
  {
    subject: "Science",
    currentScore: 92,
    previousScore: 85,
  },
  {
    subject: "Programming",
    currentScore: 95,
    previousScore: 90,
  },
]);

const [teacherFeedback] = useState([
  {
    subject: "Mathematics",
    teacher: "Mr. Sharma",
    rating: "⭐⭐⭐⭐⭐",
    comment: "Excellent understanding of concepts and problem solving.",
    recommendation: "Try advanced mathematical challenges.",
    status: "Acknowledged",
  },
  {
    subject: "Science",
    teacher: "Mrs. Patel",
    rating: "⭐⭐⭐⭐",
    comment: "Good classroom participation and practical skills.",
    recommendation: "Focus more on written explanations.",
    status: "Pending",
  },
  {
    subject: "Programming",
    teacher: "Mr. Johnson",
    rating: "⭐⭐⭐⭐⭐",
    comment: "Shows excellent coding skills and creativity.",
    recommendation: "Start contributing to real-world projects.",
    status: "Acknowledged",
  },
]);

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

    const total = counts.present + counts.absent + counts.late;

    const percentage =
      total > 0
        ? Math.round(((counts.present + counts.late) / total) * 100)
        : 0;

    return {
      ...counts,
      total,
      percentage,
    };
  }, [recentActivity]);

  const attendancePerformance = useMemo(() => {
    return {
      attendancePercentage: attendanceStats?.percentage ?? 0,
      streakDays: gamificationData?.currentStreak ?? 0,
    };
  }, [attendanceStats, gamificationData]);

  const activityParticipationScore = useMemo(() => {
    return Math.min(100, Math.round((recentActivity.length / 10) * 100));
  }, [recentActivity.length]);

  const assignmentSubmissionScore = useMemo(() => {
    return Math.min(
      100,
      Math.round(
        (recentActivity.filter((item) => item?.status === "present").length /
          8) *
          100
      )
    );
  }, [recentActivity]);

  const academicPerformanceScore = useMemo(() => {
    const totalXp = gamificationData?.totalXp ?? 0;
    return Math.min(100, Math.round((totalXp / 1200) * 100));
  }, [gamificationData]);

  const engagementMetrics = useMemo(() => {
    return calculateEngagementScore({
      attendanceScore: attendanceStats?.percentage ?? 0,
      activityScore: activityParticipationScore,
      assignmentScore: assignmentSubmissionScore,
      academicScore: academicPerformanceScore,
    });
  }, [
    attendanceStats?.percentage,
    activityParticipationScore,
    assignmentSubmissionScore,
    academicPerformanceScore,
  ]);

  const scheduleState = useMemo(
    () => getTodaySchedule(scheduleTime, weeklySchedule),
    [scheduleTime]
  );

  const todayClasses = scheduleState.classes;
  const upcomingClass = scheduleState.upcomingClass;
  const isAttendanceWindow = scheduleState.isAttendanceWindow;

  // ── Effects ────────────────────────────────────────────────────────────

  // Fetch engagement history
  useEffect(() => {
    if (!user?.uid) return;

    const controller = new AbortController();

    const fetchEngagement = async () => {
      try {
        setEngagementError(null);
        const token = await user.getIdToken();
        const response = await fetch(
          `/api/engagement-scores?studentId=${encodeURIComponent(user.uid)}&limit=12`,
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Unable to load engagement data: ${response.status}`);
        }
        const payload = await response.json();
        setEngagementHistory(payload?.data?.history || []);
        setEngagementRecord(payload?.data?.latest || null);
      } catch (err) {
        if (err.name !== "AbortError") {
          setEngagementError(err.message);
        }
      }
    };

    fetchEngagement();

    return () => controller.abort();
  }, [user?.uid]);

  // Persist engagement metrics
  useEffect(() => {
    if (!user?.uid || engagementSaved || !engagementMetrics) return;

    const persistEngagement = async () => {
      try {
        const token = await user.getIdToken();
        await fetch("/api/engagement-scores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentId: user.uid,
            attendanceScore: engagementMetrics.attendanceScore,
            activityScore: engagementMetrics.activityScore,
            assignmentScore: engagementMetrics.assignmentScore,
            academicScore: engagementMetrics.academicScore,
          }),
        });
        setEngagementSaved(true);
      } catch {
        // Do not block dashboard if persistence fails.
      }
    };

    persistEngagement();
  }, [user?.uid, engagementMetrics, engagementSaved]);

  // Dashboard update loop
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

    const timer = setInterval(updateDashboard, 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(loadingTimer);
    };
  }, [isMounted]);

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
const generateRoadmap = () => {
  const ROADMAPS = {
    "Web Development": {
      Beginner: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
    },
    "Data Science": {
      Beginner: [
        "Python",
        "NumPy",
        "Pandas",
        "Data Visualization",
        "Machine Learning",
      ],
    },
    "Artificial Intelligence": {
      Beginner: [
        "Python",
        "Math Basics",
        "Machine Learning",
        "Deep Learning",
        "LLMs",
      ],
    },
  };

  if (!goal) return;

  setRoadmap(ROADMAPS[goal]?.[level] || []);
};

  const handleExportAttendance = (format) => {
    if (!recentActivity || recentActivity.length === 0) {
      toast.error("No attendance records to export.");
      return;
    }
    const exportData = recentActivity.map((record) => ({
      Date: record.date,
      Time: record.timestamp
        ? new Date(record.timestamp).toLocaleTimeString()
        : "-",
      Status: record.status.toUpperCase(),
      Confidence: `${Math.round(record.confidenceScore * 100)}%`,
    }));
    const filename = `attendance_${user?.displayName || "student"}_${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      exportToCSV(exportData, filename);
      toast.success("Attendance exported to CSV");
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
        `Attendance Report: ${user?.displayName || "Student"}`,
        filename
      );
      toast.success("Attendance exported to PDF");
    }
  };

  // ── Dashboard Customization & Reordering State ──────────────────────────
  const [widgetOrder, setWidgetOrder] = useState([
    "roadmap",
    "studyGroups",
    "attendanceInsights",
    "calendar",
    "performance",
    "feedback",
    "suggestions",
    "engagement",
    "achievements",
  ]);
  const [hiddenWidgets, setHiddenWidgets] = useState([]);
  const [customizingLayout, setCustomizingLayout] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState(null);
  const [draggedOverId, setDraggedOverId] = useState(null);

  // Load layout from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem("learnova_student_widget_order");
    const savedHidden = localStorage.getItem("learnova_student_hidden_widgets");
    if (savedOrder) {
      try {
        setWidgetOrder(JSON.parse(savedOrder));
      } catch (e) {
        console.error("Error parsing widget order", e);
      }
    }
    if (savedHidden) {
      try {
        setHiddenWidgets(JSON.parse(savedHidden));
      } catch (e) {
        console.error("Error parsing hidden widgets", e);
      }
    }
  }, []);

  const handleDragStart = (e, id) => {
    setDraggedWidgetId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (draggedWidgetId !== id) {
      setDraggedOverId(id);
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggedWidgetId;
    if (!sourceId || sourceId === targetId) return;

    setWidgetOrder((prevOrder) => {
      const sourceIndex = prevOrder.indexOf(sourceId);
      const targetIndex = prevOrder.indexOf(targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prevOrder;

      const newOrder = [...prevOrder];
      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, sourceId);
      
      localStorage.setItem("learnova_student_widget_order", JSON.stringify(newOrder));
      return newOrder;
    });

    setDraggedWidgetId(null);
    setDraggedOverId(null);
    toast.success("Layout updated", { id: "dnd-toast" });
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDraggedOverId(null);
  };

  const moveWidget = (id, direction) => {
    setWidgetOrder((prevOrder) => {
      const index = prevOrder.indexOf(id);
      if (index === -1) return prevOrder;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prevOrder.length) return prevOrder;

      const newOrder = [...prevOrder];
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;

      localStorage.setItem("learnova_student_widget_order", JSON.stringify(newOrder));
      return newOrder;
    });
    toast.success("Widget shifted", { id: "shift-toast" });
  };

  const hideWidget = (id) => {
    setHiddenWidgets((prevHidden) => {
      const newHidden = [...prevHidden, id];
      localStorage.setItem("learnova_student_hidden_widgets", JSON.stringify(newHidden));
      return newHidden;
    });
    toast.success("Widget hidden. Recover it from the top editor panel.", { id: "hide-toast" });
  };

  const showWidget = (id) => {
    setHiddenWidgets((prevHidden) => {
      const newHidden = prevHidden.filter((item) => item !== id);
      localStorage.setItem("learnova_student_hidden_widgets", JSON.stringify(newHidden));
      return newHidden;
    });
    toast.success("Widget restored.", { id: "show-toast" });
  };

  const resetLayout = () => {
    const defaultOrder = [
      "roadmap",
      "studyGroups",
      "attendanceInsights",
      "calendar",
      "performance",
      "feedback",
      "suggestions",
      "engagement",
      "achievements",
    ];
    setWidgetOrder(defaultOrder);
    setHiddenWidgets([]);
    localStorage.removeItem("learnova_student_widget_order");
    localStorage.removeItem("learnova_student_hidden_widgets");
    toast.success("Dashboard layout reset to default", { id: "reset-toast" });
  };

  const renderWidget = (id) => {
    if (hiddenWidgets.includes(id)) return null;

    let widgetContent = null;
    let widgetTitle = "";

    switch (id) {
      case "roadmap":
        widgetTitle = "AI Learning Roadmap";
        widgetContent = (
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              AI Learning Roadmap Generator
            </h2>
            <div className="flex flex-wrap gap-4 mb-4">
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="px-4 py-2 rounded-lg bg-black/40 text-white border border-white/20 select"
              >
                <option value="">Select Goal</option>
                <option value="Web Development">Web Development</option>
                <option value="Data Science">Data Science</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
              </select>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="px-4 py-2 rounded-lg bg-black/40 text-white border border-white/20 select"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <button
                onClick={generateRoadmap}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white btn"
              >
                Generate Roadmap
              </button>
            </div>
            {roadmap.length > 0 && (
              <div className="space-y-2">
                {roadmap.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 text-white"
                  >
                    Phase {index + 1}: {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        break;

      case "studyGroups":
        widgetTitle = "Peer Study Groups";
        widgetContent = (
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Student Peer Study Groups
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {studyGroups.map((group, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <h3 className="font-semibold text-white">{group.name}</h3>
                  <p className="text-sm text-gray-400">Subject: {group.subject}</p>
                  <p className="text-sm text-gray-400 mb-3">Members: {group.members}</p>
                  <button className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm">
                    Join Group
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
        break;

      case "attendanceInsights":
        widgetTitle = "Attendance Insights";
        widgetContent = (
          <div className="space-y-4">
            <div className="flex justify-end">
              <ExportDropdown onExport={handleExportAttendance} />
            </div>
            <AttendanceInsights recentActivity={recentActivity} />
          </div>
        );
        break;

      case "calendar":
        widgetTitle = "Classroom Event Calendar";
        widgetContent = (
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              📅 Classroom Event Calendar
            </h2>
            <div className="space-y-3">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div>
                    <h3 className="text-white font-semibold">{event.title}</h3>
                    <p className="text-sm text-gray-400">{event.date}</p>
                  </div>
                  <span className={`font-semibold ${event.color}`}>{event.type}</span>
                </div>
              ))}
            </div>
          </div>
        );
        break;

      case "performance":
        widgetTitle = "Student Performance";
        widgetContent = (
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              📊 Student Performance Comparison Dashboard
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {performanceData.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <h3 className="text-white font-semibold">{item.subject}</h3>
                  <p className="text-blue-400 mt-2">Current Score: {item.currentScore}%</p>
                  <p className="text-gray-400">Previous Score: {item.previousScore}%</p>
                  <p
                    className={`mt-2 font-semibold ${
                      item.currentScore > item.previousScore
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {item.currentScore > item.previousScore ? "📈 Improving" : "📉 Needs Improvement"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
        break;

      case "feedback":
        widgetTitle = "Teacher Feedback";
        widgetContent = (
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              📝 Teacher Feedback & Reviews
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {teacherFeedback.map((feedback, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <h3 className="text-white font-semibold">{feedback.subject}</h3>
                  <p className="text-blue-400 text-sm">Teacher: {feedback.teacher}</p>
                  <p className="mt-2">{feedback.rating}</p>
                  <p className="text-gray-300 mt-2">"{feedback.comment}"</p>
                  <p className="text-yellow-400 mt-2 text-sm">💡 {feedback.recommendation}</p>
                  <button
                    className={`mt-3 px-3 py-2 rounded-lg text-sm font-semibold ${
                      feedback.status === "Acknowledged"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-orange-500/20 text-orange-400"
                    }`}
                  >
                    {feedback.status}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
        break;

      case "suggestions":
        widgetTitle = "Attendance Suggestions";
        widgetContent = (
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              🤖 Smart Attendance Improvement Suggestions
            </h2>
            {attendanceStats.percentage < 60 ? (
              <ul className="space-y-3 text-red-300">
                <li>⚠️ Your attendance is critically low. Try attending every upcoming class.</li>
                <li>⏰ Enable daily reminders to avoid missing classes.</li>
                <li>📅 Create a weekly study and attendance schedule.</li>
                <li>🎯 Target at least 85% attendance over the next month.</li>
              </ul>
            ) : attendanceStats.percentage < 75 ? (
              <ul className="space-y-3 text-yellow-300">
                <li>📈 Your attendance can be improved with more consistency.</li>
                <li>📝 Track your attendance progress every week.</li>
                <li>⏰ Set alarms before your classes start.</li>
                <li>🎯 Aim to increase your attendance above 90%.</li>
              </ul>
            ) : (
              <div className="text-green-400">
                🎉 Excellent work! Your attendance is strong.
                Keep maintaining your consistency and punctuality.
              </div>
            )}
          </div>
        );
        break;

      case "engagement":
        widgetTitle = "Engagement Performance";
        widgetContent = (
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <EngagementScoreCard
              overallScore={engagementMetrics.overallScore}
              attendanceScore={engagementMetrics.attendanceScore}
              activityScore={engagementMetrics.activityScore}
              assignmentScore={engagementMetrics.assignmentScore}
              academicScore={engagementMetrics.academicScore}
            />
            <div className="space-y-6">
              <EngagementTrendChart history={engagementHistory} />
              <EngagementBreakdown
                breakdown={[
                  { label: "Attendance", value: engagementMetrics.attendanceScore },
                  { label: "Activity Participation", value: engagementMetrics.activityScore },
                  { label: "Assignment Submissions", value: engagementMetrics.assignmentScore },
                  { label: "Academic Performance", value: engagementMetrics.academicScore },
                ]}
              />
            </div>
          </div>
        );
        break;

      case "achievements":
        widgetTitle = "Achievements & Certificates";
        widgetContent = <StudentAchievementsPanel />;
        break;

      default:
        return null;
    }

    const isDragging = draggedWidgetId === id;
    const isDraggedOver = draggedOverId === id;

    return (
      <div
        key={id}
        draggable={customizingLayout}
        onDragStart={(e) => handleDragStart(e, id)}
        onDragOver={(e) => handleDragOver(e, id)}
        onDrop={(e) => handleDrop(e, id)}
        onDragEnd={handleDragEnd}
        className={`transition-all duration-300 relative ${
          customizingLayout ? "cursor-grab" : ""
        } ${isDragging ? "opacity-45 scale-95 border-2 border-dashed border-purple-500" : ""} ${
          isDraggedOver ? "border-2 border-dashed border-green-500 scale-[1.01] bg-green-500/5 animate-pulse" : ""
        }`}
      >
        {customizingLayout && (
          <div className="absolute -top-3 left-4 right-4 z-30 flex items-center justify-between bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-purple-500/30 text-white text-xs font-medium select-none shadow-md">
            <div className="flex items-center gap-1">
              <GripVertical className="w-3.5 h-3.5 text-purple-400 cursor-grab active:cursor-grabbing" />
              <span>{widgetTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveWidget(id, "up")}
                disabled={widgetOrder.indexOf(id) === 0}
                className="p-1 hover:text-purple-400 disabled:opacity-30 disabled:hover:text-white transition-colors"
                title="Move Up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => moveWidget(id, "down")}
                disabled={widgetOrder.indexOf(id) === widgetOrder.length - 1}
                className="p-1 hover:text-purple-400 disabled:opacity-30 disabled:hover:text-white transition-colors"
                title="Move Down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => hideWidget(id)}
                className="p-1 hover:text-red-400 transition-colors"
                title="Hide Widget"
              >
                <EyeOff className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
              </button>
            </div>
          </div>
        )}
        <div className={customizingLayout ? "pt-2 pointer-events-none opacity-80" : ""}>
          {widgetContent}
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <DashboardError error={error} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div
      className={`min-h-screen bg-background relative overflow-x-hidden ${dashboardContentOffsetClass}`}
    >
      <Navbar />

      {/* Diagnostic Quiz Section */}
      {showDiagnosticQuiz ? (
        <div className="max-w-7xl mx-auto mt-6 px-6 relative z-20">
          <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-black border border-blue-500/30 rounded-2xl p-6 text-white backdrop-blur-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              <h3 className="text-lg font-bold">Dynamic Module Evaluation</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Choose an option below to test how the layout alters itself
              seamlessly depending on student skill level.
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
            <span className="text-sm text-gray-400">
              Current Adaptive Layout Sequence:
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                skillPath === "advanced"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : skillPath === "booster"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-white/10"
              }`}
            >
              {skillPath} Sequence Active
            </span>
          </div>
        </div>
      )}
      {/* Main Dashboard Header */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto pt-20 pb-6 px-6">
          <DashboardHeader
            user={user}
            currentTime={currentTime}
            getInitials={getUserInitials}
          />
        </div>
      </div>

      {/* Dashboard Customization controls */}
      <div className="max-w-7xl mx-auto px-6 mb-4 flex justify-end gap-3 flex-wrap relative z-20">
        <button
          onClick={() => setCustomizingLayout(prev => !prev)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            customizingLayout
              ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/10"
              : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          {customizingLayout ? "Exit Customization" : "Customize Layout"}
        </button>
        {customizingLayout && (
          <button
            onClick={resetLayout}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-semibold transition animate-in fade-in zoom-in-95 duration-200"
          >
            Reset Layout
          </button>
        )}
      </div>

      {/* Customize Toolbar panel */}
      {customizingLayout && (
        <div className="max-w-7xl mx-auto mt-2 px-6 relative z-30 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-purple-900/30 via-slate-900/40 to-black border border-purple-500/30 rounded-2xl p-6 text-white backdrop-blur-xl shadow-xl shadow-purple-500/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  <h3 className="text-lg font-bold">Customize Dashboard Layout</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Drag and drop the cards to rearrange them, or use the manual arrow keys. Hide cards you don't need.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCustomizingLayout(false)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-purple-500/20 active:scale-95"
                >
                  Save & Finish
                </button>
              </div>
            </div>

            {hiddenWidgets.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-xs text-gray-400 block mb-2 font-semibold tracking-wide uppercase">Hidden Widgets (Click to Restore):</span>
                <div className="flex flex-wrap gap-2">
                  {hiddenWidgets.map((hiddenId) => {
                    const labelMap = {
                      roadmap: "AI Roadmap",
                      studyGroups: "Peer Study Groups",
                      attendanceInsights: "Attendance Insights",
                      calendar: "Event Calendar",
                      performance: "Performance Comparison",
                      feedback: "Teacher Feedback",
                      suggestions: "Attendance Suggestions",
                      engagement: "Engagement Score",
                      achievements: "Achievements & Certificates",
                    };
                    return (
                      <button
                        key={hiddenId}
                        onClick={() => showWidget(hiddenId)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:text-green-400 hover:bg-white/10 hover:border-green-500/40 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {labelMap[hiddenId] || hiddenId}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Widget Grid */}
      <div className="space-y-8 mt-6 max-w-7xl mx-auto px-6 relative z-10 pb-6">
        {widgetOrder.map((id) => renderWidget(id))}
      </div>

      {/* Gamification System */}
      <div className="max-w-7xl mx-auto mt-8 px-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🎮</span> Gamification & Progress
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            <StreakCounter currentStreak={attendancePerformance.streakDays} />
            <XpProgressBar 
              currentLevel={gamificationData?.currentLevel ?? 1} 
              currentXp={gamificationData?.currentXp ?? 0} 
            />
          </div>
          <div>
            <BadgeGallery unlockedBadges={gamificationData?.unlockedBadges ?? []} />
          </div>
        </div>
      </div>

      {/* Adaptive Content Sections */}
      {skillPath === "advanced" && (
        <div className="max-w-7xl mx-auto mt-6 px-6">
          <div className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <h4 className="text-purple-400 font-bold text-sm mb-1">
              🚀 Fast-Track Projects Unlocked
            </h4>
            <p className="text-xs text-gray-400">
              The layout has automatically removed foundational reading
              sequences. Enjoy your high-level coding challenges!
            </p>
          </div>
        </div>
      )}

      {skillPath === "booster" && (
        <div className="max-w-7xl mx-auto mt-6 px-6">
          <div className="p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <h4 className="text-yellow-400 font-bold text-sm mb-1">
              💡 Supplemental Booster Modules Active
            </h4>
            <p className="text-xs text-gray-400">
              We have populated extra summary workflows and alternative video
              references to assist you with core terms.
            </p>
          </div>
        </div>
      )}
      
      <QuickNotes />
    </div>
  );
};

export default StudentDashboard;