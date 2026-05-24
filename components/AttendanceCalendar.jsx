"use client";

import React, { useState, useMemo } from "react";
import Calendar from "react-calendar";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, BookOpen, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import "react-calendar/dist/Calendar.css"; // Base styles
import "./AttendanceCalendar.css"; // Custom overrides

const STATUS_CONFIG = {
  present: {
    label: "Present",
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    tileClass: "calendar-tile-present"
  },
  late: {
    label: "Late",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    tileClass: "calendar-tile-late"
  },
  absent: {
    label: "Absent",
    icon: XCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    tileClass: "calendar-tile-absent"
  }
};

const AttendanceCalendar = ({ recentActivity = [] }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalData, setModalData] = useState(null);

  // Map activities by YYYY-MM-DD local date string
  const activityMap = useMemo(() => {
    const map = new Map();
    recentActivity.forEach((activity) => {
      if (activity?.date) {
        map.set(activity.date, activity);
      }
    });
    return map;
  }, [recentActivity]);

  const getLocalDateString = (date) => {
    // Ensures we don't hit timezone shift bugs when getting YYYY-MM-DD
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 10);
    return localISOTime;
  };

  const getTileData = (date) => {
    const dateStr = getLocalDateString(date);
    return activityMap.get(dateStr);
  };

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const data = getTileData(date);
      if (data && STATUS_CONFIG[data.status]) {
        return STATUS_CONFIG[data.status].tileClass;
      }
    }
    return null;
  };

  const handleDayClick = (value) => {
    const data = getTileData(value);
    setSelectedDate(value);
    setModalData(data || null); // null means no record for that day
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 shadow-2xl transition-all duration-500">
      <div className="mb-6 space-y-2">
        <h3 className="text-2xl font-semibold text-white">Monthly Calendar</h3>
        <p className="text-sm text-slate-400">
          Click on any highlighted date to view detailed attendance records.
        </p>
      </div>

      {/* Calendar Wrapper */}
      <div className="calendar-glass-wrapper p-4 rounded-3xl bg-slate-950/50 border border-white/5">
        <Calendar 
          onChange={() => {}} // Disabled generic onChange, we use onClickDay
          onClickDay={handleDayClick}
          tileClassName={tileClassName}
          prev2Label={null} // Hide year jumps for cleaner UI
          next2Label={null}
          formatShortWeekday={(locale, date) => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][date.getDay()]}
        />
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <div key={key} className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 ${config.bg} ${config.border}`}>
            <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
            <span className="font-semibold text-white">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDate(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                  <h4 className="text-lg font-bold text-white">
                    {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h4>
                </div>

                {modalData ? (
                  <div className="space-y-4">
                    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${STATUS_CONFIG[modalData.status].bg} ${STATUS_CONFIG[modalData.status].border}`}>
                      {React.createElement(STATUS_CONFIG[modalData.status].icon, { className: `w-6 h-6 ${STATUS_CONFIG[modalData.status].color}` })}
                      <div>
                        <div className={`font-bold ${STATUS_CONFIG[modalData.status].color} uppercase tracking-wider text-sm`}>
                          {STATUS_CONFIG[modalData.status].label}
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-2xl p-4 space-y-3 border border-white/5">
                      <div className="flex items-center gap-3 text-slate-300">
                        <BookOpen className="w-4 h-4 text-accent" />
                        <span className="font-medium text-white">{modalData.subject || "General Attendance"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-sm">{modalData.time ? `Checked in at ${modalData.time}` : "Time not recorded"}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                      <Clock className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-slate-300 font-medium">No Attendance Data</p>
                    <p className="text-sm text-slate-500">There are no attendance records logged for this specific day.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceCalendar;
