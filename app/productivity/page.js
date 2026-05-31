"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import DarkVeil from "@/components/ui-block/DarkVeil";
import TimerSkeleton from "@/components/ui/TimerSkeleton";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";
import {
  Clock,
  Flame,
  Plus,
  Sparkles,
  Timer,
  GraduationCap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { TimerSection } from "@/components/productivity/TimerSection";
import ProductivityTrendsSection from "@/components/productivity/ProductivityTrendsSection";
import { apiFetch } from "@/lib/apiClient";
import { TaskSection } from "@/components/productivity/TaskSection";
import { CalendarSection } from "@/components/productivity/CalendarSection";
import { AgendaListSection } from "@/components/productivity/AgendaListSection";
import { AmbientSoundPanel } from "@/components/productivity/AmbientSoundPanel";
import { AmbientAudioProvider } from "@/contexts/AmbientAudioContext";

const MODES = {
  focus: { label: "Focus", seconds: 25 * 60, accent: "text-cyan-300" },
  short: { label: "Short Break", seconds: 5 * 60, accent: "text-emerald-300" },
  long: { label: "Long Break", seconds: 15 * 60, accent: "text-purple-300" },
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TASKS_KEY = "learnova_productivity_tasks";
const AGENDA_KEY = "learnova_productivity_agenda";
const TIME_BLOCKS = [
  { label: "Focus", color: "bg-cyan-700" },
  { label: "Meetings", color: "bg-purple-700" },
  { label: "Grading", color: "bg-emerald-700" },
];
const PRIORITIES = [
  {
    value: "low",
    label: "Low",
    color: "border-emerald-300 text-emerald-700 bg-emerald-50",
    active: "bg-emerald-600 text-white border-emerald-700 shadow-md",
  },
  {
    value: "medium",
    label: "Medium",
    color: "border-amber-300 text-amber-700 bg-amber-50",
    active: "bg-amber-500 text-white border-amber-600 shadow-md",
  },
  {
    value: "high",
    label: "High",
    color: "border-rose-300 text-rose-700 bg-rose-50",
    active: "bg-rose-600 text-white border-rose-700 shadow-md",
  },
];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function buildCalendar(monthOffset) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = target.getFullYear();
  const month = target.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = Array.from({ length: firstDay }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  return { year, month, cells };
}

function parseTimeToMinutes(timeLabel) {
  if (!timeLabel) return null;
  const match = timeLabel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

const AcademicEligibilityCard = ({ isDark }) => {
  const defaultCgpa = 7.2;
  const requiredCgpa = 6.0;
  const defaultAttendance = 82;

  const [enteredCgpa, setEnteredCgpa] = useState("");
  const [cgpa, setCgpa] = useState(defaultCgpa);
  const [attendance] = useState(defaultAttendance);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCheck = () => {
    setErrorMsg("");

    if (enteredCgpa === "") {
      setCgpa(defaultCgpa);
      return;
    }

    const value = parseFloat(enteredCgpa);

    if (Number.isNaN(value) || value < 0 || value > 10) {
      setErrorMsg("Enter a valid CGPA between 0 and 10");
      return;
    }

    setCgpa(value);
  };

  const isEligible = cgpa >= requiredCgpa && attendance >= 75;

  const cgpaPercent = Math.round((cgpa / 10) * 100);
  const attendancePercent = Math.round(attendance);

  return (
    <motion.div
      className={`${isDark
          ? "bg-black/40 border border-white/10 backdrop-blur-xl"
          : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
        } rounded-3xl p-6`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-300" />
              Academic Eligibility
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Snapshot of placement eligibility
          </p>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${
            isEligible
              ? "bg-green-500/10 text-green-300 border-green-500/20"
              : "bg-amber-500/10 text-amber-300 border-amber-500/20"
          }`}
        >
          {isEligible ? "Placement Ready" : "Needs Work"}
        </span>
      </div>

      {/* CGPA Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-slate-400">Current CGPA</p>

          <div className="text-lg font-semibold text-white">
            {cgpa}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400">Required CGPA</p>

          <div className="text-lg font-semibold text-white">
            {requiredCgpa}
          </div>
        </div>
      </div>

      {/* CGPA Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-slate-400">
            CGPA Progress
          </p>

          <span className="text-xs text-slate-400">
            {cgpaPercent}%
          </span>
        </div>

        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
            style={{ width: `${cgpaPercent}%` }}
          />
        </div>
      </div>

      {/* Attendance */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-slate-400">
            Attendance
          </p>

          <span className="text-xs font-medium">
            {attendancePercent}%
          </span>
        </div>

        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            style={{ width: `${attendancePercent}%` }}
          />
        </div>
      </div>

      {/* CGPA Input */}
      <div className="space-y-2 mb-4">
        <input
          type="number"
          step="0.1"
          min="0"
          max="10"
          placeholder="Enter your CGPA"
          value={enteredCgpa}
          onChange={(e) => setEnteredCgpa(e.target.value)}
          className="w-full rounded-xl bg-transparent border border-white/10 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        />

        <button
          onClick={handleCheck}
          className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 transition-colors px-3 py-1.5 text-sm font-semibold text-slate-900"
        >
          Check Eligibility
        </button>

        {errorMsg && (
          <p className="text-xs text-rose-300">
            {errorMsg}
          </p>
        )}
      </div>
    </motion.div>
  );
};
export default function ProductivityPage() {
  const { user } = useAuth();
  const [dataLoaded, setDataLoaded] = useState(false);

  const [mode, setMode] = useState("focus");
  const [sessionSeconds, setSessionSeconds] = useState(MODES.focus.seconds);
  const [timeLeft, setTimeLeft] = useState(MODES.focus.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [manualMinutes, setManualMinutes] = useState(
    String(Math.round(MODES.focus.seconds / 60))
  );
  const [focusSessions, setFocusSessions] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [calendarFilter, setCalendarFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [tasks, setTasks] = useState([]);
  const [agendaInput, setAgendaInput] = useState("");
  const [agendaLabel, setAgendaLabel] = useState("Focus");
  const [agendaItems, setAgendaItems] = useState({});
  const [recentCompleted, setRecentCompleted] = useState(false);
  const syncTimerRef = useRef(null);
  const isSyncingRef = useRef(false);

  const calendar = useMemo(() => buildCalendar(monthOffset), [monthOffset]);
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const selectedDateLabel = useMemo(() => {
    const [year, month, day] = selectedDateKey.split("-").map(Number);
    return new Date(year, month, day).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [selectedDateKey]);

  /** Syncs current tasks and agenda to the API. Writes to localStorage first for instant persistence. */
  const syncToApi = useCallback(
    async (currentTasks, currentAgenda) => {
      try {
        localStorage.setItem(TASKS_KEY, JSON.stringify(currentTasks));
        localStorage.setItem(AGENDA_KEY, JSON.stringify(currentAgenda));
      } catch (_) {
        // localStorage may be full or unavailable
      }

      if (!user || isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        const token = await user.getIdToken();
        await apiFetch("/api/productivity", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: { tasks: currentTasks, agendaItems: currentAgenda },
        });
      } catch (_) {
        // Offline or API error — localStorage already has the data
      } finally {
        isSyncingRef.current = false;
      }
    },
    [user]
  );

  /** Schedules a debounced API sync. Cancels any pending sync to avoid spamming. */
  const debouncedSync = useCallback(
    (currentTasks, currentAgenda) => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        syncToApi(currentTasks, currentAgenda);
      }, 2000);
    },
    [syncToApi]
  );

  useEffect(() => {
    async function loadData() {
      if (!user) {
        try {
          const savedTasks = localStorage.getItem(TASKS_KEY);
          const savedAgenda = localStorage.getItem(AGENDA_KEY);
          if (savedTasks) setTasks(JSON.parse(savedTasks));
          if (savedAgenda) setAgendaItems(JSON.parse(savedAgenda));
        } catch (_) {
          // Corrupted localStorage — use empty defaults
        }
        setDataLoaded(true);
        return;
      }

      try {
        const token = await user.getIdToken();
        const data = await apiFetch("/api/productivity", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.tasks?.length > 0) setTasks(data.tasks);
        if (data.agendaItems && Object.keys(data.agendaItems).length > 0) {
          setAgendaItems(data.agendaItems);
        }
      } catch (_) {
        try {
          const savedTasks = localStorage.getItem(TASKS_KEY);
          const savedAgenda = localStorage.getItem(AGENDA_KEY);
          if (savedTasks) setTasks(JSON.parse(savedTasks));
          if (savedAgenda) setAgendaItems(JSON.parse(savedAgenda));
        } catch (__) {
          // Corrupted localStorage — use empty defaults
        }
      } finally {
        setDataLoaded(true);
      }
    }
    
    // Set loading to false after component mounts
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;
    debouncedSync(tasks, agendaItems);
  }, [tasks, agendaItems, dataLoaded, debouncedSync]);

  useEffect(() => {
    /** Re-sync pending localStorage data when the browser comes back online. */
    function handleOnline() {
      if (dataLoaded) {
        syncToApi(tasks, agendaItems);
      }
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [tasks, agendaItems, dataLoaded, syncToApi]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [isRunning]);

  /** Records a completed Pomodoro session to the API. */
  const recordSession = useCallback(
    async (duration, type) => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const data = await apiFetch("/api/productivity/session", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: {
            duration,
            completedAt: new Date().toISOString(),
            type,
          },
        });

        if (data.xpAwarded > 0) {
          toast.success(`+${data.xpAwarded} XP earned!`);
        }
      } catch (_) {
        // Offline — session not recorded, but timer continues
      }
    },
    [user]
  );

  useEffect(() => {
    if (timeLeft !== 0) {
      return;
    }

    setIsRunning(false);
    const sessionDuration = Math.round(sessionSeconds / 60);

    if (mode === "focus") {
      const nextFocusCount = focusSessions + 1;
      setFocusSessions(nextFocusCount);
      setRecentCompleted(true);
      setTimeout(() => setRecentCompleted(false), 1400);
      recordSession(sessionDuration, "focus");
      const nextMode = nextFocusCount % 4 === 0 ? "long" : "short";
      const nextSeconds = MODES[nextMode].seconds;
      setMode(nextMode);
      setSessionSeconds(nextSeconds);
      setManualMinutes(String(Math.round(nextSeconds / 60)));
      setTimeLeft(nextSeconds);
    } else {
      recordSession(sessionDuration, "break");
      const focusSeconds = MODES.focus.seconds;
      setMode("focus");
      setSessionSeconds(focusSeconds);
      setManualMinutes(String(Math.round(focusSeconds / 60)));
      setTimeLeft(focusSeconds);
    }
  }, [timeLeft, mode, focusSessions, sessionSeconds, recordSession]);


  const toggleTimer = () => setIsRunning((prev) => !prev);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(sessionSeconds);
  };

  const switchMode = (nextMode) => {
    const nextSeconds = MODES[nextMode].seconds;
    setIsRunning(false);
    setMode(nextMode);
    setSessionSeconds(nextSeconds);
    setManualMinutes(String(Math.round(nextSeconds / 60)));
    setTimeLeft(nextSeconds);
  };

  const applyManualTime = (event) => {
    event.preventDefault();
    const parsedMinutes = Number.parseInt(manualMinutes, 10);
    if (Number.isNaN(parsedMinutes)) return;
    const clampedMinutes = Math.min(Math.max(parsedMinutes, 1), 180);
    const nextSeconds = clampedMinutes * 60;
    setIsRunning(false);
    setManualMinutes(String(clampedMinutes));
    setSessionSeconds(nextSeconds);
    setTimeLeft(nextSeconds);
  };

  const addTask = (event) => {
    event.preventDefault();
    if (!taskInput.trim()) return;
    const newTask = {
      id: Date.now(),
      text: taskInput.trim(),
      done: false,
      priority: taskPriority,
    };
    setTasks((prev) => [newTask, ...prev]);
    setTaskInput("");
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const moveTask = (id, direction) => {
    setTasks((prev) => {
      const index = prev.findIndex((task) => task.id === id);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const updated = [...prev];
      const [item] = updated.splice(index, 1);
      updated.splice(nextIndex, 0, item);
      return updated;
    });
  };

  const agendaForSelectedDate = agendaItems[selectedDateKey] || [];

  const addAgendaItem = (event) => {
    event.preventDefault();
    if (!agendaInput.trim()) return;
    const nowTime = new Date();
    const newItem = {
      id: Date.now(),
      text: agendaInput.trim(),
      label: agendaLabel,
      time: nowTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timeMinutes: nowTime.getHours() * 60 + nowTime.getMinutes(),
    };
    setAgendaItems((prev) => ({
      ...prev,
      [selectedDateKey]: [newItem, ...(prev[selectedDateKey] || [])],
    }));
    setAgendaInput("");
  };

  const removeAgendaItem = (id) => {
    setAgendaItems((prev) => ({
      ...prev,
      [selectedDateKey]: (prev[selectedDateKey] || []).filter(
        (item) => item.id !== id
      ),
    }));
  };

  const moveAgendaItem = (id, direction) => {
    setAgendaItems((prev) => {
      const list = prev[selectedDateKey] || [];
      const index = list.findIndex((item) => item.id === id);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= list.length) return prev;
      const updated = [...list];
      const [item] = updated.splice(index, 1);
      updated.splice(nextIndex, 0, item);
      return { ...prev, [selectedDateKey]: updated };
    });
  };

  const monthLabel = new Date(calendar.year, calendar.month).toLocaleString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const focusMinutes = Math.floor(
    (focusSessions * MODES.focus.seconds) / 60
  );

  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter((task) => task.done).length;
  const taskCompletion = Math.round((completedTasks / totalTasks) * 100);
  const agendaCount = agendaForSelectedDate.length;
  const agendaSummaryForSelectedDate = useMemo(() => {
    return agendaForSelectedDate.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.label] = (acc[item.label] || 0) + 1;
        return acc;
      },
      { total: 0 }
    );
  }, [agendaForSelectedDate]);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const darkAmbientStyles = {
    focus: {
      gradient: "from-[#020617] via-[#0F172A] to-[#164E63]",
      glowPrimary: "bg-cyan-400/20",
      glowSecondary: "bg-blue-500/15",
      veilHue: 0,
    },
    short: {
      gradient: "from-[#022C22] via-[#064E3B] to-[#0F766E]",
      glowPrimary: "bg-emerald-400/25",
      glowSecondary: "bg-teal-400/20",
      veilHue: 95,
    },
    long: {
      gradient: "from-[#2E1065] via-[#581C87] to-[#831843]",
      glowPrimary: "bg-purple-400/25",
      glowSecondary: "bg-fuchsia-400/20",
      veilHue: 210,
    },
  };

  const lightAmbientStyles = {
    focus: {
      gradient: "from-[#F8FAFC] via-[#EEF2FF] to-[#E0E7FF]",
      glowPrimary: "bg-cyan-300/30",
      glowSecondary: "bg-blue-300/25",
    },
    short: {
      gradient: "from-[#ECFDF5] via-[#F0FDFA] to-[#CCFBF1]",
      glowPrimary: "bg-emerald-300/35",
      glowSecondary: "bg-teal-300/30",
    },
    long: {
      gradient: "from-[#FAF5FF] via-[#F3E8FF] to-[#EDE9FE]",
      glowPrimary: "bg-purple-300/35",
      glowSecondary: "bg-fuchsia-300/25",
    },
  };

  const ambientStyles = isDark
    ? darkAmbientStyles[mode] || darkAmbientStyles.focus
    : lightAmbientStyles[mode] || lightAmbientStyles.focus;

  const ambientGradient = ambientStyles.gradient;

  const isSelectedToday = selectedDateKey === todayKey;
  const nextFocusBlock = useMemo(() => {
    const focusItems = agendaForSelectedDate.filter(
      (item) => item.label === "Focus"
    );
    if (focusItems.length === 0) return null;

    const nowMinutes = isSelectedToday
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : -1;

    const sorted = focusItems
      .map((item) => ({
        ...item,
        minutes:
          typeof item.timeMinutes === "number"
            ? item.timeMinutes
            : parseTimeToMinutes(item.time),
      }))
      .filter((item) => typeof item.minutes === "number")
      .sort((a, b) => a.minutes - b.minutes);

    if (sorted.length === 0) return focusItems[0];

    if (isSelectedToday) {
      const upcoming = sorted.find((item) => item.minutes >= nowMinutes);
      return upcoming || sorted[0];
    }

    return sorted[0];
  }, [agendaForSelectedDate, isSelectedToday]);

  return (
    <AmbientAudioProvider>
      <div
        className={`min-h-screen bg-gradient-to-br ${ambientGradient} ${
          isDark ? "text-white" : "text-slate-900"
        } relative overflow-hidden transition-all duration-500`}
      >
        <Navbar />

        {loading ? (
          <TimerSkeleton />
        ) : (
          <>
            <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
              {isDark && <DarkVeil hueShift={ambientStyles.veilHue} />}
            </div>

            <div className="absolute inset-0 pointer-events-none z-0">
              <div
                className={`absolute -top-32 -right-32 w-72 h-72 rounded-full ${ambientStyles.glowPrimary} blur-3xl transition-colors duration-500`}
              />
              <div
                className={`absolute bottom-0 left-0 w-72 h-72 rounded-full ${ambientStyles.glowSecondary} blur-3xl transition-colors duration-500`}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_55%)]" />
            </div>

            <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-6xl mx-auto">
                {/* ── Hero Section ── */}
                <section className="text-center space-y-6 mb-16">
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span
                      className={`text-xs font-semibold uppercase tracking-[0.3em] ${
                        isDark ? "text-purple-200" : "text-purple-700"
                      }`}
                    >
                      Productivity Suite
                    </span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
                  >
                    Stay in Flow.{" "}
                    <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                      Track What Matters.
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={`text-lg max-w-2xl mx-auto leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    A productivity workspace designed for educators and learners.
                    Plan your day, protect focus blocks, and keep tasks moving.
                  </motion.p>
                </section>

                {/* ── Main Grid: Left (Pomodoro + Ambient) | Right (Tasks) ── */}
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <TimerSection
                      mode={mode}
                      timeLeft={timeLeft}
                      sessionSeconds={sessionSeconds}
                      focusSessions={focusSessions}
                      focusMinutes={focusMinutes}
                      isRunning={isRunning}
                      recentCompleted={recentCompleted}
                      MODES={MODES}
                      switchMode={switchMode}
                      toggleTimer={toggleTimer}
                      resetTimer={resetTimer}
                      applyManualTime={applyManualTime}
                      manualMinutes={manualMinutes}
                      setManualMinutes={setManualMinutes}
                      isDark={isDark}
                    />

                    <AmbientSoundPanel isDark={isDark} />
                  </div>

                  <div className="space-y-8">
                    <TaskSection
                      tasks={tasks}
                      taskInput={taskInput}
                      taskPriority={taskPriority}
                      setTaskInput={setTaskInput}
                      setTaskPriority={setTaskPriority}
                      addTask={addTask}
                      toggleTask={toggleTask}
                      moveTask={moveTask}
                      removeTask={removeTask}
                      taskCompletion={taskCompletion}
                      PRIORITIES={PRIORITIES}
                      isDark={isDark}
                    />
                  </div>
                </div>

                {/* ── Secondary Grid: Calendar + Agenda ── */}
                <div className="mt-12 grid lg:grid-cols-2 gap-8">
                  <CalendarSection
                    calendar={calendar}
                    monthLabel={monthLabel}
                    selectedDateLabel={selectedDateLabel}
                    selectedDateKey={selectedDateKey}
                    setSelectedDateKey={setSelectedDateKey}
                    agendaItems={agendaItems}
                    agendaSummaryForSelectedDate={agendaSummaryForSelectedDate}
                    monthOffset={monthOffset}
                    setMonthOffset={setMonthOffset}
                    calendarFilter={calendarFilter}
                    setCalendarFilter={setCalendarFilter}
                    TIME_BLOCKS={TIME_BLOCKS}
                    WEEK_DAYS={WEEK_DAYS}
                    todayKey={todayKey}
                    isDark={isDark}
                  />

                  <AgendaListSection
                    selectedDateLabel={selectedDateLabel}
                    agendaForSelectedDate={agendaForSelectedDate}
                    TIME_BLOCKS={TIME_BLOCKS}
                    agendaInput={agendaInput}
                    setAgendaInput={setAgendaInput}
                    agendaLabel={agendaLabel}
                    setAgendaLabel={setAgendaLabel}
                    addAgendaItem={addAgendaItem}
                    moveAgendaItem={moveAgendaItem}
                    removeAgendaItem={removeAgendaItem}
                    isDark={isDark}
                  />
                </div>

                {/* ── Tertiary Grid: Focus Insights + Daily Summary ── */}
                <div className="mt-8 grid lg:grid-cols-3 gap-8">
                  <motion.div
                    className={`${
                      isDark
                        ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                        : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                    } rounded-3xl p-6 space-y-4 lg:col-span-2`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-400" />
                      <h3 className="text-xl font-semibold">Focus Insights</h3>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div
                        className={`rounded-2xl p-4 ${
                          isDark
                            ? "bg-white/5 border border-white/10"
                            : "bg-white/60 border border-slate-200"
                        }`}
                      >
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Energy level
                        </p>
                        <div className="h-2 mt-3 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full w-3/4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
                        </div>
                      </div>
                      <div
                        className={`rounded-2xl p-4 ${
                          isDark
                            ? "bg-white/5 border border-white/10"
                            : "bg-white/60 border border-slate-200"
                        }`}
                      >
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Deep work streak
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-lg font-semibold">
                          <Flame className="w-5 h-5 text-orange-400" />
                          6 days strong
                        </div>
                      </div>
                      <div
                        className={`rounded-2xl p-4 ${
                          isDark
                            ? "bg-white/5 border border-white/10"
                            : "bg-white/60 border border-slate-200"
                        }`}
                      >
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Next focus
                        </p>
                        {nextFocusBlock ? (
                          <div className="mt-3 flex items-center gap-2 text-lg font-semibold">
                            <Timer className="w-5 h-5 text-purple-400" />
                            <span className="truncate">{nextFocusBlock.text}</span>
                          </div>
                        ) : (
                          <p className={`mt-3 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                            No focus blocks yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className={`${
                      isDark
                        ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                        : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                    } rounded-3xl p-6`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
                    whileHover={{ y: -4 }}
                  >
                    <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      Creative Boosts
                    </h3>
                    <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Try a 2-minute stretch, write one win, and reset your focus
                      before the next block.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["Breathing", "Stretch", "Hydrate"].map((item) => (
                        <button
                          key={item}
                          onClick={() => {
                            setMode("short");
                            setSessionSeconds(120);
                            setTimeLeft(120);
                            setManualMinutes("2");
                            setIsRunning(true);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                            isDark
                              ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                              : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* ── Bottom Grid: Academic Eligibility + Focus Snapshot + Daily Summary ── */}
                <div className="mt-8 grid lg:grid-cols-3 gap-8">
                  <AcademicEligibilityCard />

                  <motion.div
                    className={`lg:col-span-2 ${
                      isDark
                        ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                        : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                    } rounded-3xl p-6 md:p-8`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div>
                        <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                          Daily Summary
                        </p>
                        <h3 className="text-2xl font-semibold flex items-center gap-2">
                          <Flame className="w-5 h-5 text-purple-400" />
                          Today at a glance
                        </h3>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs border ${
                          isDark ? "border-white/10 text-slate-300" : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {selectedDateLabel}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-4 gap-4">
                      <div
                        className={`rounded-2xl p-4 ${
                          isDark
                            ? "bg-white/5 border border-white/10"
                            : "bg-white/60 border border-slate-200"
                        }`}
                      >
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Agenda items
                        </p>
                        <div className="mt-2 text-2xl font-semibold text-purple-400">
                          {agendaCount}
                        </div>
                        <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"} mt-1`}>
                          Scheduled today
                        </p>
                      </div>
                      <div
                        className={`rounded-2xl p-4 ${
                          isDark
                            ? "bg-white/5 border border-white/10"
                            : "bg-white/60 border border-slate-200"
                        }`}
                      >
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Task completion
                        </p>
                        <div className="mt-2 text-2xl font-semibold text-emerald-400">
                          {taskCompletion}%
                        </div>
                        <div className="h-1.5 mt-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${taskCompletion}%` }}
                          />
                        </div>
                      </div>
                      <div
                        className={`rounded-2xl p-4 ${
                          isDark
                            ? "bg-white/5 border border-white/10"
                            : "bg-white/60 border border-slate-200"
                        }`}
                      >
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Tasks
                        </p>
                        <div className="mt-2 text-2xl font-semibold text-cyan-400">
                          {completedTasks}/{tasks.length}
                        </div>
                        <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"} mt-1`}>
                          Completed
                        </p>
                      </div>
                      <div
                        className={`rounded-2xl p-4 ${
                          isDark
                            ? "bg-white/5 border border-white/10"
                            : "bg-white/60 border border-slate-200"
                        }`}
                      >
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Focus minutes
                        </p>
                        <div className="mt-2 text-2xl font-semibold text-amber-400">
                          {focusMinutes}
                        </div>
                        <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"} mt-1`}>
                          Minutes today
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* ── Quick Add FAB ── */}
            <div className="fixed bottom-8 right-6 z-40">
              <div className="relative">
                {showQuickAdd && (
                  <motion.div
                    className="absolute bottom-16 right-0 flex flex-col gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <button
                      onClick={() => {
                        setShowQuickAdd(false);
                        setTaskInput("");
                        setAgendaInput("");
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        isDark
                          ? "bg-black/60 border-white/10 text-white hover:bg-white/10"
                          : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      Quick Add Task
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickAdd(false);
                        setAgendaInput("");
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        isDark
                          ? "bg-black/60 border-white/10 text-white hover:bg-white/10"
                          : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      Quick Add Agenda
                    </button>
                    <button
                      onClick={() => {
                        setShowQuickAdd(false);
                        setIsRunning(true);
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        isDark
                          ? "bg-black/60 border-white/10 text-white hover:bg-white/10"
                          : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      Start Focus
                    </button>
                  </motion.div>
                )}
                <button
                  onClick={() => setShowQuickAdd((prev) => !prev)}
                  className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
                  aria-label="Quick add"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AmbientAudioProvider>
  );
}
