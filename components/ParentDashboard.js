"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
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
} from "recharts";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import { Navbar } from "./Navbar";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";
import ExportDropdown from "@/components/ui/ExportDropdown";

const ParentDashboard = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Linked children
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  // Child detailed data
  const [attendance, setAttendance] = useState(null);
  const [grades, setGrades] = useState([]);
  const [notices, setNotices] = useState([]);

  // Configurable attendance threshold
  const [threshold, setThreshold] = useState(75);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [tempThreshold, setTempThreshold] = useState(75);

  // Selected Notice Modal
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [noticeSearch, setNoticeSearch] = useState("");

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

        const [attRes, gradesRes, noticesRes] = await Promise.all([
          apiFetch(`/api/parent/student/${childId}/attendance`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiFetch(`/api/parent/student/${childId}/grades`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiFetch(`/api/parent/student/${childId}/notices`, {
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

  const gradesChartData = useMemo(() => {
    return grades.map((g) => ({
      subject: g.subject.slice(0, 10),
      "Score (%)": g.score,
    }));
  }, [grades]);

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const query = noticeSearch.toLowerCase().trim();
      return (
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.category.toLowerCase().includes(query)
      );
    });
  }, [notices, noticeSearch]);

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
      <div className="min-h-screen bg-slate-950 text-white">
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
             aria-label="Action button">
              <RefreshCw className="w-4 h-4" />
              Refresh Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getAttendanceRateColor = (rate) => {
    if (rate >= 85)
      return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (rate >= threshold)
      return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
    return "text-red-400 border-red-500/30 bg-red-500/10";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-12">
      <Navbar />

      {/* Main Header / Child Selector */}
      <div className="max-w-7xl mx-auto pt-24 pb-6 px-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Parent Center: {parentName}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoring linked child profiles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedChild?.uid || ""}
                onChange={(e) => handleChildSelect(e.target.value)}
                className="appearance-none bg-slate-800/80 border border-white/15 text-white font-medium rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-pink-500 transition-colors shadow-md cursor-pointer"
              >
                {children.map((c) => (
                  <option key={c.uid} value={c.uid}>
                    {c.name} ({c.rollNo})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            <button
              onClick={() => {
                setTempThreshold(threshold);
                setShowThresholdModal(true);
              }}
              className="p-2.5 bg-slate-800/60 hover:bg-slate-700/60 rounded-xl border border-white/15 hover:border-pink-500/30 transition-all text-slate-300 hover:text-white"
              title="Set Attendance Threshold"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Threshold Modal */}
      {showThresholdModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-pink-400" />
              Configure Warning Threshold
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Set the minimum required attendance percentage for your child. A
              warning alert will be shown whenever attendance falls below this
              level.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-sm">
                <span>Threshold Rate:</span>
                <span className="font-bold text-pink-400">
                  {tempThreshold}%
                </span>
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
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowThresholdModal(false)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl transition text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveThreshold}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 rounded-xl transition text-sm font-semibold shadow-lg shadow-pink-500/10 text-white"
               aria-label="Action button">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Low Attendance Alert */}
      {selectedChild && childAttendancePercentage < threshold && (
        <div className="max-w-7xl mx-auto mb-6 px-6">
          <div className="bg-gradient-to-r from-red-950/40 via-red-900/35 to-slate-950 border border-red-500/30 rounded-3xl p-5 shadow-2xl flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/20 flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-red-400 font-bold text-sm">
                Low Attendance Warning
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {selectedChild.name}'s attendance has dropped to{" "}
                <span className="font-bold text-red-300">
                  {childAttendancePercentage}%
                </span>
                , which is below the configured threshold of {threshold}%.
                Please review check-ins.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 flex-wrap">
          {["overview", "attendance", "academics", "notices"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
                activeTab === tab
                  ? "bg-gradient-to-r from-pink-500 to-rose-600 border-transparent text-white shadow-lg font-semibold"
                  : "border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              {tab === "notices" ? "Notice Board" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Details Container */}
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {detailLoading ? (
          <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
            <span>Loading child's records...</span>
          </div>
        ) : (
          <div>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && selectedChild && (
              <div className="space-y-6">
                {/* Quick stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 shadow-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Attendance Rate</p>
                      <h3
                        className={`text-xl font-bold mt-1 inline-block px-2 py-0.5 rounded-lg border ${getAttendanceRateColor(childAttendancePercentage)}`}
                      >
                        {selectedChild.attendanceRate}
                      </h3>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 shadow-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">
                        Academic Standing
                      </p>
                      <h3 className="text-xl font-bold mt-1 text-purple-400">
                        {selectedChild.gpa === "N/A"
                          ? "N/A"
                          : `${selectedChild.gpa}%`}
                      </h3>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 shadow-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Checked-in Days</p>
                      <h3 className="text-xl font-bold text-amber-400 mt-1">
                        {attendance?.stats?.present ?? 0} days
                      </h3>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 shadow-xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Notifications</p>
                      <h3 className="text-xl font-bold text-rose-400 mt-1">
                        {notices.length} active
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Attendance Trends */}
                  <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      Attendance Trajectory
                    </h3>
                    <div className="w-full h-[250px] mt-2">
                      {attendanceChartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                          No attendance history to chart.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={attendanceChartData}>
                            <defs>
                              <linearGradient
                                id="colorAtt"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#ffffff08"
                            />
                            <XAxis
                              dataKey="date"
                              stroke="#94a3b8"
                              fontSize={10}
                            />
                            <YAxis
                              stroke="#94a3b8"
                              fontSize={10}
                              domain={[0, 100]}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                border: "1px solid rgba(255,255,255,0.15)",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="Attendance Rate (%)"
                              stroke="#3b82f6"
                              fillOpacity={1}
                              fill="url(#colorAtt)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Academic Performance Chart */}
                  <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-400" />
                      Subject Performance Breakdown
                    </h3>
                    <div className="w-full h-[250px] mt-2">
                      {gradesChartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                          No grades available to chart.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={gradesChartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#ffffff08"
                            />
                            <XAxis
                              dataKey="subject"
                              stroke="#94a3b8"
                              fontSize={10}
                            />
                            <YAxis
                              stroke="#94a3b8"
                              fontSize={10}
                              domain={[0, 100]}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                border: "1px solid rgba(255,255,255,0.15)",
                              }}
                            />
                            <Bar
                              dataKey="Score (%)"
                              fill="#a855f7"
                              radius={[6, 6, 0, 0]}
                              barSize={25}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dashboard Notice board */}
                <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-pink-400" />
                      Recent School Announcements
                    </h3>
                    <button
                      onClick={() => setActiveTab("notices")}
                      className="text-xs font-semibold text-pink-400 hover:text-pink-300 hover:underline"
                    >
                      View All Board
                    </button>
                  </div>

                  {selectedChild.recentNotices?.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                      No recent announcements posted.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5 space-y-3">
                      {selectedChild.recentNotices?.map((notice) => (
                        <div
                          key={notice.id}
                          onClick={() => setSelectedNotice(notice)}
                          className="pt-3 first:pt-0 flex justify-between items-start cursor-pointer hover:bg-white/[0.02] p-2 rounded-lg transition"
                        >
                          <div>
                            <h4 className="font-semibold text-white text-sm">
                              {notice.title}
                            </h4>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                              {notice.content}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                              notice.priority === "high"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {notice.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === "attendance" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-1 space-y-6">
                  <h3 className="text-lg font-bold">Attendance Statistics</h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl border border-white/5">
                      <span className="text-sm text-slate-300 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        Present Days
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {attendance?.stats?.present ?? 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl border border-white/5">
                      <span className="text-sm text-slate-300 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        Late Days
                      </span>
                      <span className="font-mono font-bold text-yellow-400">
                        {attendance?.stats?.late ?? 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl border border-white/5">
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
                      Overall Rate
                    </span>
                    <span className="text-3xl font-black text-white">
                      {childAttendancePercentage}%
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Day-by-Day Logs</h3>
                    <ExportDropdown onExport={handleExportAttendance} />
                  </div>

                  {!attendance?.records || attendance.records.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      No attendance checks recorded yet.
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto pr-2 divide-y divide-white/5 space-y-3">
                      {attendance.records.map((record) => (
                        <div
                          key={record.id}
                          className="pt-3 first:pt-0 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold text-sm">
                              {record.date}
                            </p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              Check:{" "}
                              {record.timestamp
                                ? new Date(
                                    record.timestamp
                                  ).toLocaleTimeString()
                                : "--"}{" "}
                              (confidence:{" "}
                              {Math.round(record.confidenceScore * 100)}%)
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
                </div>
              </div>
            )}

            {/* ACADEMICS TAB */}
            {activeTab === "academics" && (
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
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
                      <thead className="bg-slate-800/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <tr className="border-b border-white/5">
                          <th className="px-6 py-3 text-left">Subject</th>
                          <th className="px-6 py-3 text-left">Score</th>
                          <th className="px-6 py-3 text-left">Grade</th>
                          <th className="px-6 py-3 text-left">Term</th>
                          <th className="px-6 py-3 text-left">Published</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {grades.map((g) => (
                          <tr key={g.id} className="hover:bg-white/[0.01]">
                            <td className="px-6 py-4 font-semibold text-white">
                              {g.subject}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold">
                              {g.score} / {g.maxScore} (
                              {Math.round((g.score / g.maxScore) * 100)}%)
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
                              {g.date
                                ? new Date(g.date).toLocaleDateString()
                                : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* NOTICES TAB */}
            {activeTab === "notices" && (
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-lg font-bold">
                    Campus Announcement Board
                  </h3>
                  <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-500" />
                    </span>
                    <input
                      type="text"
                      value={noticeSearch}
                      onChange={(e) => setNoticeSearch(e.target.value)}
                      placeholder="Search announcements..."
                      className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>
                </div>

                {filteredNotices.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No announcements matching filter guidelines.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredNotices.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => setSelectedNotice(n)}
                        className="bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-pink-500/25 transition space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] uppercase font-bold text-pink-400">
                              {n.category}
                            </span>
                            <span
                              className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                                n.priority === "high"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : "bg-slate-800 text-slate-400 border-slate-700"
                              }`}
                            >
                              {n.priority}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-base mt-2">
                            {n.title}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {n.content}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 mt-2">
                          <span>By {n.author}</span>
                          <span>
                            {n.createdAt
                              ? new Date(n.createdAt).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-800/50 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-pink-400 tracking-wider">
                  {selectedNotice.category} Notice
                </span>
                <h3 className="font-bold text-white text-lg mt-0.5">
                  {selectedNotice.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close Notice Modal"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto leading-relaxed text-sm text-slate-300">
              {selectedNotice.content.split("\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <div className="px-6 py-4 bg-slate-800/30 border-t border-white/10 flex justify-between items-center text-xs text-slate-500">
              <div className="flex gap-4">
                <span>
                  Author:{" "}
                  <strong className="text-slate-300">
                    {selectedNotice.author}
                  </strong>
                </span>
                <span>
                  Role:{" "}
                  <strong className="text-slate-300">
                    {selectedNotice.authorRole}
                  </strong>
                </span>
              </div>
              <span>
                Published:{" "}
                {selectedNotice.createdAt
                  ? new Date(selectedNotice.createdAt).toLocaleString()
                  : ""}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
