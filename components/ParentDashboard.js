"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  BookOpen,
  Award,
  Activity,
  FileText,
  ChevronDown,
  User,
  Mail,
  Bell,
  RefreshCw,
  Search,
  Sliders,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  TrendingDown,
  ShieldCheck,
  BookMarked,
  Filter,
  Check,
  LayoutDashboard,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import { Navbar } from "./Navbar";
import { dashboardContentOffsetClass } from "@/components/navigation";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";
import ExportDropdown from "@/components/ui/ExportDropdown";
import EngagementScoreCard from "@/components/EngagementScoreCard";
import EngagementTrendChart from "@/components/EngagementTrendChart";
import EngagementBreakdown from "@/components/EngagementBreakdown";
import { getEngagementCategory } from "@/lib/engagementScore";
import dynamic from "next/dynamic";

const ParentAchievementsPanel = dynamic(
  () => import("@/components/achievements/ParentAchievementsPanel"),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

// ── Shared Animation Variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

// ── Custom Animated Progress Ring ──────────────────────────────────────────
const ProgressRing = ({ percentage, color = "text-pink-500", size = 80 }) => {
  const radius = 24;
  const stroke = 3.5;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width="100%" height="100%" viewBox="0 0 60 60" className="transform -rotate-90">
        <circle
          stroke="rgba(255, 255, 255, 0.05)"
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx="30"
          cy="30"
        />
        <motion.circle
          className={`${color} stroke-current`}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
          r={radius}
          cx="30"
          cy="30"
        />
      </svg>
      <span className="absolute text-xs font-bold font-mono text-white">
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

const ParentDashboard = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "child_progress", label: "Progress", icon: Activity },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "academics", label: "Academics", icon: BookOpen },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "notices", label: "Notices", icon: Bell },
  ];

  // Linked children
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  // Child detailed data
  const [attendance, setAttendance] = useState(null);
  const [grades, setGrades] = useState([]);
  const [notices, setNotices] = useState([]);
  const [engagementRecord, setEngagementRecord] = useState(null);
  const [engagementHistory, setEngagementHistory] = useState([]);
  const [engagementError, setEngagementError] = useState(null);

  // Configurable attendance threshold
  const [threshold, setThreshold] = useState(75);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [tempThreshold, setTempThreshold] = useState(75);

  // Selected Notice Modal
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [noticeSearch, setNoticeSearch] = useState("");
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState("All");

  const parentName = userProfile?.fullName || user?.displayName || "Parent";

  // Fetch initial linked children list
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await apiFetch("/api/parent/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChildren(data.students || []);
        if (data.students && data.students.length > 0) {
          setSelectedChild(data.students[0]);
        }
      } else {
        toast.error("Failed to load portal data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch details for selected child
  const fetchChildDetails = useCallback(
    async (childId) => {
      if (!user || !childId) return;
      setDetailLoading(true);
      try {
        const token = await user.getIdToken();

        const [attRes, gradesRes, noticesRes, engRes] = await Promise.all([
          apiFetch(`/api/parent/student/${childId}/attendance`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiFetch(`/api/parent/student/${childId}/grades`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiFetch(`/api/parent/student/${childId}/notices`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiFetch(`/api/engagement-scores?studentId=${childId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (attRes.ok) {
          const data = await attRes.json();
          setAttendance(data);
        }
        if (gradesRes.ok) {
          const data = await gradesRes.json();
          setGrades(data.grades || []);
        }
        if (noticesRes.ok) {
          const data = await noticesRes.json();
          setNotices(data.notices || []);
        }
        if (engRes.ok) {
          const data = await engRes.json();
          setEngagementRecord(data.latest || null);
          setEngagementHistory(data.history || []);
          setEngagementError(null);
        } else {
          setEngagementError("Unable to load engagement data.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading child records");
      } finally {
        setDetailLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (selectedChild) {
      fetchChildDetails(selectedChild.uid);
    }
  }, [selectedChild, fetchChildDetails]);

  const handleChildSelect = (childUid) => {
    const child = children.find((c) => c.uid === childUid);
    if (child) {
      setSelectedChild(child);
    }
  };

  const saveThreshold = () => {
    setThreshold(tempThreshold);
    setShowThresholdModal(false);
    toast.success(`Attendance warning threshold set to ${tempThreshold}%`);
  };

  // Memoized stats & trends data
  const childAttendancePercentage = useMemo(() => {
    if (!attendance?.stats) return 0;
    return attendance.stats.attendancePercentage;
  }, [attendance]);

  const attendanceChartData = useMemo(() => {
    if (!attendance?.records || attendance.records.length === 0) return [];

    // Group records by date key, calculate cumulative rate trend
    const sorted = [...attendance.records].reverse();
    let totalDays = 0;
    let presentOrLate = 0;

    return sorted.slice(-15).map((record) => {
      totalDays++;
      if (record.status === "present" || record.status === "late") {
        presentOrLate++;
      }
      const rate = Math.round((presentOrLate / totalDays) * 100);
      return {
        date: new Date(record.date).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
        "Attendance Rate (%)": rate,
      };
    });
  }, [attendance]);

  // Subject-wise performance metrics
  const gradesChartData = useMemo(() => {
    return grades.map((g) => ({
      subject: g.subject.slice(0, 10),
      "Score (%)": g.score,
      maxScore: g.maxScore,
    }));
  }, [grades]);

  // Subject radar chart format (for child progress visualizer)
  const radarChartData = useMemo(() => {
    return grades.map((g) => ({
      subject: g.subject.length > 12 ? g.subject.slice(0, 10) + ".." : g.subject,
      score: Math.round((g.score / g.maxScore) * 100),
      fullMark: 100,
    }));
  }, [grades]);

  // Notice filtering & categories
  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const query = noticeSearch.toLowerCase().trim();
      const matchesSearch =
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.category.toLowerCase().includes(query);
      const matchesCategory =
        noticeCategoryFilter === "All" || n.category.toLowerCase() === noticeCategoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [notices, noticeSearch, noticeCategoryFilter]);

  const noticeCategories = useMemo(() => {
    const categories = new Set(notices.map((n) => n.category));
    return ["All", ...Array.from(categories)];
  }, [notices]);

  const engagementMetrics = useMemo(() => {
    if (!engagementRecord) {
      return {
        overallScore: 0,
        attendanceScore: 0,
        activityScore: 0,
        assignmentScore: 0,
        academicScore: 0,
        category: "Unknown",
      };
    }
    const category = getEngagementCategory(engagementRecord.overallScore);
    return {
      overallScore: engagementRecord.overallScore,
      attendanceScore: engagementRecord.attendanceScore,
      activityScore: engagementRecord.activityScore,
      assignmentScore: engagementRecord.assignmentScore,
      academicScore: engagementRecord.academicScore,
      category,
    };
  }, [engagementRecord]);

  // Derived mock rewards/achievements count for visual richness
  const mockAchievementsCount = useMemo(() => {
    if (childAttendancePercentage >= 90) return 4;
    if (childAttendancePercentage >= 80) return 2;
    return 1;
  }, [childAttendancePercentage]);

  const handleExportAttendance = (format) => {
    if (!attendance?.records || attendance.records.length === 0) {
      toast.error("No attendance records to export.");
      return;
    }
    const exportData = attendance.records.map((record) => ({
      Date: record.date,
      Time: record.timestamp
        ? new Date(record.timestamp).toLocaleTimeString()
        : "-",
      Status: record.status.toUpperCase(),
      Confidence: `${Math.round(record.confidenceScore * 100)}%`,
    }));
    const filename = `attendance_${selectedChild?.name || "report"}_${new Date().toISOString().split("T")[0]}`;
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
        `Attendance Report: ${selectedChild?.name}`,
        filename
      );
      toast.success("Attendance exported to PDF");
    }
  };

  const handleExportGrades = (format) => {
    if (!grades || grades.length === 0) {
      toast.error("No grades to export.");
      return;
    }
    const exportData = grades.map((g) => ({
      Subject: g.subject,
      Score: `${g.score} / ${g.maxScore} (${Math.round((g.score / g.maxScore) * 100)}%)`,
      Grade: g.grade,
      Term: g.term,
      Published: g.date ? new Date(g.date).toLocaleDateString() : "N/A",
    }));
    const filename = `grades_${selectedChild?.name || "report"}_${new Date().toISOString().split("T")[0]}`;
    if (format === "csv") {
      exportToCSV(exportData, filename);
      toast.success("Grades exported to CSV");
    } else {
      const columns = [
        { header: "Subject", dataKey: "Subject" },
        { header: "Score", dataKey: "Score" },
        { header: "Grade", dataKey: "Grade" },
        { header: "Term", dataKey: "Term" },
        { header: "Published", dataKey: "Published" },
      ];
      exportToPDF(
        exportData,
        columns,
        `Academic Report: ${selectedChild?.name}`,
        filename
      );
      toast.success("Grades exported to PDF");
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (children.length === 0) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto pt-32 px-6 text-center space-y-6">
          <div className="w-20 h-20 bg-pink-500/10 border border-pink-500/20 rounded-full flex items-center justify-center mx-auto text-pink-400">
            <Users className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold font-display">
            No Linked Students Found
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Your parent account is registered but hasn't been linked to any
            student accounts yet. Please contact the administrator or school
            coordinator to link your child.
          </p>
          <div className="pt-4">
            <button
              onClick={fetchDashboardData}
              className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-2.5 px-6 rounded-xl transition shadow-lg flex items-center gap-2 mx-auto"
              aria-label="Refresh Portal"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Portal
            </button>
          </div>
        </div>
    </>
  );
}

  const getAttendanceRateColor = (rate) => {
    if (rate >= 85) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (rate >= threshold) return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
    return "text-red-400 border-red-500/30 bg-red-500/10";
  };

  const getAttendanceRingColor = (rate) => {
    if (rate >= 85) return "text-emerald-500";
    if (rate >= threshold) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <>
      <Navbar />

      {/* ── Main Header / Child Profile Selector ── */}
      <div className="max-w-7xl mx-auto pt-24 pb-6 px-6">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
        >
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full filter blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/25">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">Parent Portal</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                {parentName}
              </h1>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Linked with student records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedChild?.uid || ""}
                onChange={(e) => handleChildSelect(e.target.value)}
                className="appearance-none bg-black/40 border border-white/15 text-white font-semibold rounded-2xl pl-5 pr-12 py-3 text-sm focus:outline-none focus:border-pink-500 transition-colors shadow-md cursor-pointer"
              >
                {children.map((c) => (
                  <option key={c.uid} value={c.uid}>
                    {c.name} ({c.rollNo})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4.5 h-4.5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => {
                setTempThreshold(threshold);
                setShowThresholdModal(true);
              }}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/15 hover:border-pink-500/30 transition-all text-slate-300 hover:text-white"
              title="Set Attendance Threshold"
            >
              <Sliders className="w-4.5 h-4.5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Configurable Warning Threshold Modal ── */}
      <AnimatePresence>
        {showThresholdModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/15 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-6"
            >
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-pink-400" />
                Set Attendance Threshold
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Set a customized threshold for child attendance. An automatic alert triggers when the cumulative percentage drops below this setting.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between font-mono text-sm">
                  <span>Current Target:</span>
                  <span className="font-bold text-pink-400">{tempThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={tempThreshold}
                  onChange={(e) => setTempThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowThresholdModal(false)}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveThreshold}
                  className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 rounded-xl transition text-xs font-bold shadow-lg shadow-pink-500/10 text-white"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Low Attendance Anomaly Alert ── */}
      <AnimatePresence>
        {selectedChild && childAttendancePercentage < threshold && (
          <div className="max-w-7xl mx-auto mb-6 px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-gradient-to-r from-red-950/40 via-red-900/30 to-slate-950 border border-red-500/30 rounded-3xl p-5 shadow-2xl flex items-center gap-4 animate-pulse"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/20 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-red-400 font-bold text-sm">Low Attendance Flagged</h4>
                <p className="text-xs text-slate-300 mt-1">
                  {selectedChild.name}'s attendance has dropped to{" "}
                  <span className="font-extrabold text-red-400">{childAttendancePercentage}%</span>
                  , falling below the Warning Threshold of {threshold}%.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Engagement Score Section ── */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
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
            {engagementError && (
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-200 text-sm">
                {engagementError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab Switcher Menu ── */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all border ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-pink-500 to-rose-600 border-transparent text-white shadow-lg shadow-pink-600/10"
                  : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "notices" && notices.length > 0 && (
                <span className="ml-1 bg-red-500 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {notices.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content Sections ── */}
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {detailLoading ? (
          <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
            <span className="font-semibold text-sm">Synchronizing child profile...</span>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && selectedChild && (
              <div className="space-y-6">
                
                {/* Analytics Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card: Attendance % */}
                  <motion.div
                    variants={cardVariants}
                    className="relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl flex items-center justify-between hover:border-pink-500/20 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                        <Calendar className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Attendance Rate</p>
                        <h3 className="text-2xl font-extrabold mt-1 text-white">
                          {childAttendancePercentage}%
                        </h3>
                      </div>
                    </div>
                    <ProgressRing
                      percentage={childAttendancePercentage}
                      color={getAttendanceRingColor(childAttendancePercentage)}
                      size={52}
                    />
                  </motion.div>

                  {/* Card: Academic GPA */}
                  <motion.div
                    variants={cardVariants}
                    className="relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl flex items-center justify-between hover:border-pink-500/20 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                        <Award className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Academic Score</p>
                        <h3 className="text-2xl font-extrabold mt-1 text-purple-400">
                          {selectedChild.gpa === "N/A" ? "N/A" : `${selectedChild.gpa}%`}
                        </h3>
                      </div>
                    </div>
                    <ProgressRing
                      percentage={selectedChild.gpa === "N/A" ? 0 : parseFloat(selectedChild.gpa)}
                      color="text-purple-500"
                      size={52}
                    />
                  </motion.div>

                  {/* Card: Verified Achievements */}
                  <motion.div
                    variants={cardVariants}
                    className="relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl flex items-center gap-4 hover:border-pink-500/20 transition-all group"
                  >
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Achievements</p>
                      <h3 className="text-2xl font-extrabold mt-1 text-white">
                        {mockAchievementsCount} Unlocked
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Badges & Certificates</p>
                    </div>
                  </motion.div>

                  {/* Card: Notifications */}
                  <motion.div
                    variants={cardVariants}
                    className="relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl flex items-center gap-4 hover:border-pink-500/20 transition-all group"
                  >
                    <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                      <Bell className="w-5.5 h-5.5 animate-bounce" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Unread Alerts</p>
                      <h3 className="text-2xl font-extrabold mt-1 text-rose-400">
                        {notices.length} Active
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Campus announcements</p>
                    </div>
                  </motion.div>
                </div>

                {/* Attendance Insights & Early Warning Card */}
                {attendance?.prediction && (
                  <motion.div
                    variants={cardVariants}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden"
                  >
                    {/* Background glow decoration */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-pink-500/10 to-rose-600/5 rounded-full filter blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-pink-400" />
                          <h3 className="text-lg font-bold text-white">Attendance Insights & Early Warnings</h3>
                        </div>
                        <p className="text-xs text-slate-400">
                          AI-powered analysis and projected attendance trends based on recent records.
                        </p>
                      </div>

                      {/* Risk Level Badge */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-semibold font-mono">Risk Level:</span>
                        {attendance.prediction.riskLevel === "high" && (
                          <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25 animate-pulse">
                            <XCircle className="w-4.5 h-4.5" />
                            🔴 High Risk
                          </span>
                        )}
                        {attendance.prediction.riskLevel === "moderate" && (
                          <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                            <AlertTriangle className="w-4.5 h-4.5" />
                            🟡 Moderate Risk
                          </span>
                        )}
                        {attendance.prediction.riskLevel === "low" && (
                          <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle className="w-4.5 h-4.5" />
                            🟢 Low Risk
                          </span>
                        )}
                      </div>
                    </div>

                    <hr className="border-white/10 my-5" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Projected Percentage Display */}
                      <div className="bg-black/30 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Projected Attendance</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold text-white">{attendance.prediction.projectedPercentage}%</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Estimated rate if current {attendance.prediction.trend} trend continues.
                        </p>
                      </div>

                      {/* Trend Details */}
                      <div className="bg-black/30 border border-white/5 rounded-2xl p-5 flex flex-col justify-center space-y-3">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Trend Analysis</span>
                        <div className="flex items-center gap-3">
                          {attendance.prediction.trend === "declining" ? (
                            <>
                              <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
                                <TrendingDown className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white capitalize">{attendance.prediction.trend}</h4>
                                <p className="text-[10px] text-slate-400">Attendance frequency is slowing down.</p>
                              </div>
                            </>
                          ) : attendance.prediction.trend === "improving" ? (
                            <>
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                                <TrendingUp className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white capitalize">{attendance.prediction.trend}</h4>
                                <p className="text-[10px] text-slate-400">Recent records show improved frequency!</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                                <Clock className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white capitalize">{attendance.prediction.trend}</h4>
                                <p className="text-[10px] text-slate-400">Stable patterns of class attendance.</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Proactive Recommendations */}
                      <div className="bg-black/30 border border-white/5 rounded-2xl p-5 flex flex-col justify-center space-y-3">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Recommendations</span>
                        <div className="space-y-2">
                          {attendance.prediction.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-pink-400 text-sm mt-0.5">•</span>
                              <p className="text-xs text-slate-300 leading-relaxed font-medium">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Analytical Charts Block */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Attendance Trend Area Chart */}
                  <motion.div
                    variants={cardVariants}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Weekly Attendance Trends
                      </h3>
                      <span className="text-xs text-slate-400">Last 15 Records</span>
                    </div>
                    <div className="w-full h-[250px]">
                      {attendanceChartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                          No attendance history found.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                          <AreaChart data={attendanceChartData}>
                            <defs>
                              <linearGradient id="colorAttTrend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
                            <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: "12px",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="Attendance Rate (%)"
                              stroke="#3b82f6"
                              fillOpacity={1}
                              fill="url(#colorAttTrend)"
                              strokeWidth={2.5}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </motion.div>

                  {/* Academic Performance Bar Chart */}
                  <motion.div
                    variants={cardVariants}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-400" />
                        Subject-wise Performance
                      </h3>
                      <span className="text-xs text-slate-400">Term Breakdown</span>
                    </div>
                    <div className="w-full h-[250px]">
                      {gradesChartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                          No academic records available.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                          <BarChart data={gradesChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                            <XAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                            <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: "12px",
                              }}
                            />
                            <Bar
                              dataKey="Score (%)"
                              fill="#a855f7"
                              radius={[6, 6, 0, 0]}
                              barSize={24}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Dashboard Notice board preview */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-pink-400" />
                      Recent School Announcements
                    </h3>
                    <button
                      onClick={() => setActiveTab("notices")}
                      className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-0.5"
                    >
                      View All Announcements <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {notices.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                      No active announcements.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {notices.slice(0, 2).map((notice) => (
                        <div
                          key={notice.id}
                          onClick={() => setSelectedNotice(notice)}
                          className="bg-white/[0.02] border border-white/5 hover:border-pink-500/20 p-4 rounded-xl cursor-pointer transition-all duration-200"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-pink-400">{notice.category}</span>
                            <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                              notice.priority === "high"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}>
                              {notice.priority}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-sm mt-2">{notice.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-1">{notice.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            {/* CHILD PROGRESS VISUALIZER */}
            {activeTab === "child_progress" && selectedChild && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Overall Academic Summary */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6 lg:col-span-1"
                >
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <User className="w-5 h-5 text-pink-400" />
                    Student Profile
                  </h3>

                  <div className="flex flex-col items-center text-center p-4 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-md">
                      {selectedChild.name ? selectedChild.name[0] : "S"}
                    </div>
                    <h4 className="text-lg font-extrabold mt-3 text-white">{selectedChild.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">Roll No: {selectedChild.rollNo}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Attendance Score</span>
                      <span className="font-mono text-sm font-bold text-cyan-400">{childAttendancePercentage}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Academic Grade</span>
                      <span className="font-mono text-sm font-bold text-purple-400">
                        {selectedChild.gpa === "N/A" ? "N/A" : `${selectedChild.gpa}%`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Status Badge</span>
                      <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Active Learner
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Right: Academic Radar Map & Metric Trends */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-6"
                >
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    Subject Balance Matrix
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Radar chart map */}
                    <div className="w-full h-[240px] flex items-center justify-center">
                      {radarChartData.length === 0 ? (
                        <div className="text-slate-500 text-xs">No radar data.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                            <PolarGrid stroke="#ffffff08" />
                            <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={8} />
                            <Radar
                              name={selectedChild.name}
                              dataKey="score"
                              stroke="#a855f7"
                              fill="#a855f7"
                              fillOpacity={0.2}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Quick Metric progress bars */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Progress indicators</h4>
                      {grades.slice(0, 4).map((g) => {
                        const pct = Math.round((g.score / g.maxScore) * 100);
                        return (
                          <div key={g.id} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-300">{g.subject}</span>
                              <span className="font-bold text-slate-100">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === "attendance" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Stats */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-1 space-y-6"
                >
                  <h3 className="text-lg font-bold">Attendance Statistics</h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-sm text-slate-300 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        Present Days
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {attendance?.stats?.present ?? 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-sm text-slate-300 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        Late Days
                      </span>
                      <span className="font-mono font-bold text-yellow-400">
                        {attendance?.stats?.late ?? 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-sm text-slate-300 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        Absent Days
                      </span>
                      <span className="font-mono font-bold text-red-400">
                        {attendance?.stats?.absent ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 text-center">
                    <span className="text-xs text-slate-400 uppercase tracking-widest block mb-2">
                      Overall Attendance Rate
                    </span>
                    <span className="text-4xl font-black text-white">
                      {childAttendancePercentage}%
                    </span>
                  </div>
                </motion.div>

                {/* Day-by-day Logs */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Attendance Logs</h3>
                    <ExportDropdown onExport={handleExportAttendance} />
                  </div>

                  {!attendance?.records || attendance.records.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      No attendance checks recorded yet.
                    </div>
                  ) : (
                    <div className="max-h-[380px] overflow-y-auto pr-2 divide-y divide-white/5 space-y-3">
                      {attendance.records.map((record) => (
                        <div
                          key={record.id}
                          className="pt-3 first:pt-0 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-sm text-white">
                              {record.date}
                            </p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              Check:{" "}
                              {record.timestamp
                                ? new Date(record.timestamp).toLocaleTimeString()
                                : "--"}{" "}
                              (confidence: {Math.round(record.confidenceScore * 100)}%)
                            </p>
                          </div>

                          <span
                            className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full border ${
                              record.status === "present"
                                ? "text-green-400 bg-green-500/10 border-green-500/20"
                                : record.status === "late"
                                  ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                                  : "text-red-400 bg-red-500/10 border-red-500/20"
                            }`}
                          >
                            {record.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            {/* ACADEMICS TAB */}
            {activeTab === "academics" && (
              <motion.div
                variants={cardVariants}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Subject Grade Reports</h3>
                  <ExportDropdown onExport={handleExportGrades} />
                </div>

                {grades.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No academic records exist yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/5">
                    <table className="w-full text-sm">
                      <thead className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <tr className="border-b border-white/5">
                          <th className="px-6 py-4 text-left">Subject</th>
                          <th className="px-6 py-4 text-left">Score</th>
                          <th className="px-6 py-4 text-left">Grade</th>
                          <th className="px-6 py-4 text-left">Term</th>
                          <th className="px-6 py-4 text-left">Published</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {grades.map((g) => (
                          <tr key={g.id} className="hover:bg-white/[0.01]">
                            <td className="px-6 py-4 font-bold text-white">
                              {g.subject}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold">
                              {g.score} / {g.maxScore} ({Math.round((g.score / g.maxScore) * 100)}%)
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-block px-2.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-black">
                                {g.grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400">
                              {g.term}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400">
                              {g.date ? new Date(g.date).toLocaleDateString() : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === "achievements" && (
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 shadow-xl">
                <ParentAchievementsPanel
                  studentId={selectedChild?.uid}
                  studentName={selectedChild?.name || "Child"}
                />
              </div>
            )}

            {/* NOTICES TAB */}
            {activeTab === "notices" && (
              <motion.div
                variants={cardVariants}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-pink-400" />
                    Campus Announcement Board
                  </h3>
                  
                  {/* Category filters & Search */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative">
                      <select
                        value={noticeCategoryFilter}
                        onChange={(e) => setNoticeCategoryFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
                      >
                        {noticeCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative w-full sm:w-60">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-500" />
                      </span>
                      <input
                        type="text"
                        value={noticeSearch}
                        onChange={(e) => setNoticeSearch(e.target.value)}
                        placeholder="Search announcements..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {filteredNotices.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No active announcements matches selected criteria.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredNotices.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => setSelectedNotice(n)}
                        className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-pink-500/35 hover:bg-white/[0.04] transition-all duration-300 space-y-3 flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] uppercase font-bold text-pink-400">
                              {n.category}
                            </span>
                            <span
                              className={`text-[9px] uppercase px-2.5 py-0.5 rounded-full font-bold border ${
                                n.priority === "high"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : "bg-slate-800 text-slate-400 border-slate-700"
                              }`}
                            >
                              {n.priority}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-base mt-2 group-hover:text-pink-300 transition-colors">
                            {n.title}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {n.content}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 mt-2">
                          <span>By {n.author} ({n.authorRole})</span>
                          <span className="font-mono">
                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Notice Detail View Modal ── */}
      <AnimatePresence>
        {selectedNotice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">
                    {selectedNotice.category} Announcement
                  </span>
                  <h3 className="font-bold text-white text-lg mt-0.5">
                    {selectedNotice.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                  aria-label="Close Notice Modal"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto leading-relaxed text-sm text-slate-300">
                {selectedNotice.content.split("\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <div className="px-6 py-4 bg-black/40 border-t border-white/10 flex justify-between items-center text-xs text-slate-500">
                <div className="flex gap-4">
                  <span>
                    Sender: <strong className="text-slate-300">{selectedNotice.author}</strong>
                  </span>
                  <span>
                    Role: <strong className="text-slate-300">{selectedNotice.authorRole}</strong>
                  </span>
                </div>
                <span>
                  Date: {selectedNotice.createdAt ? new Date(selectedNotice.createdAt).toLocaleString() : ""}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ParentDashboard;