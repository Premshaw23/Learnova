"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_CONFIG = {
  present: { color: "bg-green-500", label: "Present", dot: "🟢" },
  absent: { color: "bg-red-500", label: "Absent", dot: "🔴" },
  late: { color: "bg-yellow-400", label: "Late", dot: "🟡" },
  holiday: { color: "bg-gray-300", label: "Holiday", dot: "⬜" },
  none: {
    color: "bg-gray-100 dark:bg-gray-800",
    label: "No class",
    dot: "",
  },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function AttendanceHeatmap() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceMap, setAttendanceMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  const monthKey = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}`;
  const fetchAttendance = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/attendance/heatmap?month=${monthKey}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      const map = {};
      (data.attendance || []).forEach((record) => {
        map[record.date] = record;
      });
      setAttendanceMap(map);
    } catch {
      setAttendanceMap({});
    } finally {
      setIsLoading(false);
    }
  }, [user, monthKey]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const prevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setTooltip(null);
  };

  const nextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setTooltip(null);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const stats = { present: 0, absent: 0, late: 0, holiday: 0 };
  Object.values(attendanceMap).forEach((r) => {
    if (stats[r.status] !== undefined) stats[r.status]++;
  });
  const total = stats.present + stats.absent + stats.late;
  const attendancePct =
    total > 0 ? ((stats.present / total) * 100).toFixed(1) : "0.0";

  const formatDateKey = (day) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  const handleDayClick = (day, e) => {
    if (!day) return;
    const dateKey = formatDateKey(day);
    const record = attendanceMap[dateKey];
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip(
      tooltip?.date === dateKey
        ? null
        : {
            date: dateKey,
            status: record?.status || "none",
            subject: record?.subject || "—",
            markedAt: record?.markedAt
              ? new Date(record.markedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—",
            x: rect.left,
            y: rect.top,
          }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Attendance Heatmap
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[130px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            disabled={
              year === new Date().getFullYear() &&
              month === new Date().getMonth()
            }
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                       transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div
            className="w-8 h-8 border-4 border-indigo-500 border-t-transparent 
                          rounded-full animate-spin"
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium 
                                      text-gray-400 dark:text-gray-500 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} />;
              }
              const dateKey = formatDateKey(day);
              const record = attendanceMap[dateKey];
              const status = record?.status || "none";
              const config = STATUS_CONFIG[status];
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();
              const isSelected = tooltip?.date === dateKey;

              return (
                <button
                  key={dateKey}
                  onClick={(e) => handleDayClick(day, e)}
                  aria-label={`${dateKey}: ${config.label}`}
                  className={`
                    aspect-square rounded-lg text-xs font-medium
                    flex items-center justify-center cursor-pointer
                    transition-all duration-150 select-none
                    ${config.color}
                    ${
                      status === "none"
                        ? "text-gray-500 dark:text-gray-400"
                        : "text-white"
                    }
                    ${isToday ? "ring-2 ring-indigo-500 ring-offset-1" : ""}
                    ${isSelected ? "scale-110 shadow-lg" : "hover:scale-105"}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {tooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 
                         border border-gray-200 dark:border-gray-700 text-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {tooltip.date}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium text-white
                  ${STATUS_CONFIG[tooltip.status]?.color}`}
                >
                  {STATUS_CONFIG[tooltip.status]?.label}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Subject: <span className="font-medium">{tooltip.subject}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Marked at:{" "}
                <span className="font-medium">{tooltip.markedAt}</span>
              </p>
            </motion.div>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(STATUS_CONFIG)
              .filter(([k]) => k !== "none")
              .map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${cfg.color}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {cfg.label}
                  </span>
                </div>
              ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Present",
                  value: stats.present,
                  color: "text-green-600",
                },
                { label: "Absent", value: stats.absent, color: "text-red-500" },
                { label: "Late", value: stats.late, color: "text-yellow-500" },
                {
                  label: "Attendance",
                  value: `${attendancePct}%`,
                  color: "text-indigo-600",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center"
                >
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
