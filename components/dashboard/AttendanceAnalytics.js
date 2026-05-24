"use client";

import React, { useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { getWeekdaysSince } from "@/services/statsService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const DEFAULT_SUBJECT_DATA = [
  { subject: "Math", rate: 90 },
  { subject: "Science", rate: 78 },
  { subject: "English", rate: 85 },
  { subject: "History", rate: 68 },
  { subject: "PE", rate: 95 },
];

const DEFAULT_WEEKLY = [
  { label: "Mon", attendance: 82 },
  { label: "Tue", attendance: 76 },
  { label: "Wed", attendance: 92 },
  { label: "Thu", attendance: 80 },
  { label: "Fri", attendance: 88 },
  { label: "Sat", attendance: 0 },
  { label: "Sun", attendance: 0 },
];

const DEFAULT_MONTHLY = [
  { month: "Jan", attendance: 88 },
  { month: "Feb", attendance: 82 },
  { month: "Mar", attendance: 91 },
  { month: "Apr", attendance: 86 },
  { month: "May", attendance: 79 },
  { month: "Jun", attendance: 84 },
];

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const getMonthLabel = (date) =>
  date.toLocaleDateString(undefined, { month: "short" });

const getShortWeekday = (date) =>
  date.toLocaleDateString(undefined, { weekday: "short" });

const countWeekdaysInMonth = (year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let weekdays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const current = new Date(year, month, day).getDay();
    if (current >= 1 && current <= 5) {
      weekdays += 1;
    }
  }

  return weekdays;
};

const AttendanceAnalytics = ({ userId, recentActivity = [] }) => {
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalClasses: 0,
    percentage: 0,
  });
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTrendTab, setActiveTrendTab] = useState("weekly");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError(null);

        const attendanceQuery = query(
          collection(db, "attendance_records"),
          where("userId", "==", userId),
        );

        const snapshot = await getDocs(attendanceQuery);
        const records = snapshot.docs.map((doc) => doc.data() || {});
        const totalPresent = records.length;
        const totalClasses = getWeekdaysSince();

        const safeTotalClasses = totalClasses > 0 ? totalClasses : 1;
        let totalAbsent = safeTotalClasses - totalPresent;
        if (totalAbsent < 0) totalAbsent = 0;

        const attendancePercentage = Math.round(
          (totalPresent / safeTotalClasses) * 100,
        );

        setAttendanceRecords(records);
        setStats({
          totalPresent,
          totalAbsent,
          totalClasses: safeTotalClasses,
          percentage: Math.min(100, attendancePercentage),
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load attendance analytics.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [userId]);

  const subjectPerformance = useMemo(() => {
    const subjectMap = new Map();

    const source = attendanceRecords.length > 0 ? attendanceRecords : recentActivity;

    source.forEach((entry) => {
      const subject = entry.subject || "General";
      const current = subjectMap.get(subject) || { present: 0, total: 0 };
      const status = entry.status || "present";

      subjectMap.set(subject, {
        present: current.present + (status === "present" ? 1 : 0),
        total: current.total + 1,
      });
    });

    if (!subjectMap.size) {
      return DEFAULT_SUBJECT_DATA;
    }

    return Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      rate: Math.round((data.present / Math.max(1, data.total)) * 100),
    }));
  }, [attendanceRecords, recentActivity]);

  const weeklyTrend = useMemo(() => {
    if (!attendanceRecords.length) {
      return DEFAULT_WEEKLY;
    }

    const recordsByDate = new Set(
      attendanceRecords
        .filter((record) => typeof record.date === "string")
        .map((record) => record.date),
    );

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = formatDateKey(date);

      return {
        label: getShortWeekday(date),
        attendance: recordsByDate.has(key) ? 100 : 0,
      };
    });
  }, [attendanceRecords]);

  const monthlyTrend = useMemo(() => {
    if (!attendanceRecords.length) {
      return DEFAULT_MONTHLY;
    }

    const now = new Date();
    return Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const availableRecords = attendanceRecords.filter(
        (record) =>
          typeof record.date === "string" &&
          record.date.startsWith(monthKey),
      );
      const weekdays = countWeekdaysInMonth(date.getFullYear(), date.getMonth());
      const attendance = Math.round(
        (availableRecords.length / Math.max(1, weekdays)) * 100,
      );

      return {
        month: getMonthLabel(date),
        attendance: Math.min(100, Math.max(0, attendance)),
      };
    });
  }, [attendanceRecords]);

  const donutData = useMemo(
    () => ({
      labels: ["Present", "Absent"],
      datasets: [
        {
          data: [stats.totalPresent, stats.totalAbsent],
          backgroundColor: ["rgba(79, 70, 229, 0.9)", "rgba(239, 68, 68, 0.85)"],
          borderColor: ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.1)"],
          borderWidth: 2,
          hoverOffset: 10,
        },
      ],
    }),
    [stats.totalPresent, stats.totalAbsent],
  );

  const trendData = useMemo(() => {
    const source = activeTrendTab === "weekly" ? weeklyTrend : monthlyTrend;

    return {
      labels: source.map((item) => item.label || item.month),
      datasets: [
        {
          label: "Attendance %",
          data: source.map((item) => item.attendance),
          backgroundColor: "rgba(79, 70, 229, 0.18)",
          borderColor: "rgba(79, 70, 229, 0.95)",
          fill: true,
          tension: 0.35,
          pointBorderColor: "rgba(79, 70, 229, 0.95)",
          pointBackgroundColor: "rgba(79, 70, 229, 0.95)",
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
      ],
    };
  }, [activeTrendTab, monthlyTrend, weeklyTrend]);

  const subjectChartData = useMemo(
    () => ({
      labels: subjectPerformance.map((item) => item.subject),
      datasets: [
        {
          label: "Attendance %",
          data: subjectPerformance.map((item) => item.rate),
          backgroundColor: subjectPerformance.map((item) => {
            if (item.rate >= 80) return "rgba(34, 197, 94, 0.8)";
            if (item.rate >= 60) return "rgba(234, 179, 8, 0.8)";
            return "rgba(239, 68, 68, 0.8)";
          }),
          borderRadius: 10,
          maxBarThickness: 28,
        },
      ],
    }),
    [subjectPerformance],
  );

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        titleColor: "#fff",
        bodyColor: "rgba(209, 213, 219, 1)",
        borderColor: "rgba(75, 85, 99, 0.3)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "rgba(148, 163, 184, 0.9)",
          font: { size: 12 },
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: "rgba(148, 163, 184, 0.9)",
          font: { size: 12 },
          stepSize: 20,
          callback: (value) => `${value}%`,
        },
        grid: {
          color: "rgba(148, 163, 184, 0.12)",
          drawBorder: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-44 bg-gray-200 dark:bg-slate-700 rounded"></div>
          <div className="h-44 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats.totalClasses && !stats.totalPresent) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No attendance data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Attendance Analytics
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Trends and attendance performance across recent weeks.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {['weekly', 'monthly'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTrendTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                activeTrendTab === tab
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Trend
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] mb-6">
        <div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-4 h-full border border-slate-200/70 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Overall attendance
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.percentage}%
                </p>
              </div>
              <div className="w-32 h-32">
                <Doughnut data={donutData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "70%",
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: "rgba(100, 116, 139, 0.9)",
                        boxWidth: 12,
                        padding: 20,
                      },
                    },
                    tooltip: {
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      titleColor: "#fff",
                      bodyColor: "#e2e8f0",
                    },
                  },
                }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/80 dark:bg-slate-950/80 p-4 border border-slate-200/70 dark:border-slate-700">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Classes attended
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                  {stats.totalPresent}
                </p>
              </div>
              <div className="rounded-2xl bg-white/80 dark:bg-slate-950/80 p-4 border border-slate-200/70 dark:border-slate-700">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Total classes
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                  {stats.totalClasses}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-4 h-full border border-slate-200/70 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {activeTrendTab === "weekly" ? "Last 7 days" : "Last 6 months"}
          </p>
          <div className="h-72">
            <Line data={trendData} options={commonOptions} />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/70 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Subject performance
            </p>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
              Subject-wise attendance
            </h4>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Highest rate {Math.max(...subjectPerformance.map((item) => item.rate), 0)}%
          </div>
        </div>
        <div className="h-80">
          <Bar data={subjectChartData} options={commonOptions} />
        </div>
      </div>
    </div>
  );
};

export default AttendanceAnalytics;
