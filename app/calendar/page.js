"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Navbar } from "@/components/Navbar";
import DarkVeil from "@/components/ui-block/DarkVeil";
import { useAuth } from "@/hooks/useAuth";
import { useNotices } from "@/contexts/FirestoreContext";
import { getUserActivities } from "@/services/activityService";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Bell,
  Activity,
  AlertCircle,
  Clock,
} from "lucide-react";

export default function CalendarPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? theme === "dark" : true;

  const { user } = useAuth();
  const { notices, loading: noticesLoading } = useNotices();

  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (user?.uid) {
      getUserActivities(user.uid).then((data) => {
        setActivities(data || []);
        setActivitiesLoading(false);
      });
    } else {
      setActivitiesLoading(false);
    }
  }, [user]);

  // Aggregate Events
  const eventsByDate = useMemo(() => {
    const map = new Map();

    const addEvent = (dateStr, event) => {
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr).push(event);
    };

    // Process Notices
    notices.forEach((notice) => {
      const dateObj =
        notice.createdAt instanceof Date
          ? notice.createdAt
          : notice.createdAt?.toDate
            ? notice.createdAt.toDate()
            : new Date(notice.createdAt || Date.now());
      const dateStr = dateObj.toISOString().slice(0, 10);
      addEvent(dateStr, { ...notice, eventType: "notice" });
    });

    // Process Activities
    activities.forEach((activity) => {
      const dateObj =
        activity.timestamp instanceof Date
          ? activity.timestamp
          : new Date(activity.timestamp);
      const dateStr = dateObj.toISOString().slice(0, 10);
      addEvent(dateStr, { ...activity, eventType: "activity" });
    });

    // Sort events inside each date by time
    map.forEach((dayEvents) => {
      dayEvents.sort((a, b) => {
        const timeA =
          (a.createdAt || a.timestamp || new Date()).getTime?.() || 0;
        const timeB =
          (b.createdAt || b.timestamp || new Date()).getTime?.() || 0;
        return timeB - timeA;
      });
    });

    return map;
  }, [notices, activities]);

  // Calendar Generation Logic
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const days = [];

  // Padding from previous month
  for (let i = 0; i < firstDay; i++) {
    const day = prevMonthDays - firstDay + i + 1;
    days.push({
      date: new Date(currentYear, currentMonth - 1, day),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(currentYear, currentMonth, i),
      isCurrentMonth: true,
    });
  }

  // Padding for next month
  const totalSlots = Math.ceil(days.length / 7) * 7;
  const nextMonthDaysCount = totalSlots - days.length;
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    days.push({
      date: new Date(currentYear, currentMonth + 1, i),
      isCurrentMonth: false,
    });
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const formatDateStr = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };

  const selectedDateStr = formatDateStr(selectedDate);
  const selectedDateEvents = eventsByDate.get(selectedDateStr) || [];

  const loading = noticesLoading || activitiesLoading;

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-background">
        {isDark && <DarkVeil />}
      </div>

      <div className="min-h-screen relative z-50 flex flex-col">
        <Navbar />

        <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Unified Calendar
              </h1>
              <p className="text-muted-foreground">
                Keep track of your notices and activities
              </p>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calendar Grid Section */}
            <div className="lg:col-span-2">
              <div className="bg-card backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl shadow-black/5">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold text-foreground">
                    {currentDate.toLocaleString("default", { month: "long" })}{" "}
                    {currentYear}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevMonth}
                      className="p-2 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl transition-colors border border-border text-foreground"
                    >
                      Today
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-2 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-4 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-2 sm:gap-4">
                  {days.map((day, idx) => {
                    const dateStr = formatDateStr(day.date);
                    const dayEvents = eventsByDate.get(dateStr) || [];
                    const noticesCount = dayEvents.filter(
                      (e) => e.eventType === "notice"
                    ).length;
                    const activitiesCount = dayEvents.filter(
                      (e) => e.eventType === "activity"
                    ).length;

                    const isSelectedDay = isSelected(day.date);
                    const isTodayDay = isToday(day.date);

                    return (
                      <motion.button
                        whileHover={{ scale: 0.95 }}
                        whileTap={{ scale: 0.9 }}
                        key={idx}
                        onClick={() => setSelectedDate(day.date)}
                        className={`
                          relative flex flex-col items-center justify-start p-2 sm:p-3 aspect-square rounded-2xl transition-all
                          ${day.isCurrentMonth ? "bg-muted/30 hover:bg-muted/60" : "bg-transparent opacity-40"}
                          ${isSelectedDay ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/20 bg-blue-500/10 dark:bg-blue-500/20" : "border border-transparent hover:border-border"}
                          ${isTodayDay && !isSelectedDay ? "border-blue-500/50 bg-blue-500/5" : ""}
                        `}
                      >
                        <span
                          className={`text-sm sm:text-base font-semibold ${isTodayDay ? "text-blue-600 dark:text-blue-400" : "text-foreground"}`}
                        >
                          {day.date.getDate()}
                        </span>

                        {dayEvents.length > 0 && (
                          <div className="flex items-center gap-1 mt-auto">
                            {noticesCount > 0 && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                            )}
                            {activitiesCount > 0 && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                            )}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar Details Section */}
            <div className="lg:col-span-1">
              <div className="bg-card backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl shadow-black/5 h-full min-h-[500px] flex flex-col">
                <h3 className="text-xl font-bold text-foreground mb-6 pb-4 border-b border-border">
                  {selectedDate.toLocaleDateString("default", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </h3>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                      Loading events...
                    </div>
                  ) : selectedDateEvents.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                      {selectedDateEvents.map((event, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={event.id || i}
                          className="p-4 rounded-2xl bg-muted/50 border border-border hover:border-blue-500/30 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-xl mt-0.5 ${event.eventType === "notice" ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}
                            >
                              {event.eventType === "notice" ? (
                                <Bell className="w-4 h-4" />
                              ) : (
                                <Activity className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                                {event.title}
                              </h4>
                              {event.eventType === "notice" && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {event.content}
                                </p>
                              )}
                              {event.eventType === "activity" && (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-md">
                                    {event.type}
                                  </span>
                                  {event.progress > 0 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {event.progress}% Complete
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(
                                  event.createdAt || event.timestamp
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-foreground font-medium">
                        No events for this day
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                        Take a break, you're all clear for today!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
