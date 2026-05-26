"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import DarkVeil from "@/components/ui-block/DarkVeil";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  ListTodo,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  X,
  ChevronUp,
  ChevronDown,
  Mic,
  Volume2,
  Wind,
  Flame as FlameIcon,
  Sun,
  Moon,
  Timer,
} from "lucide-react";

const MODES = {
  focus: { label: "Focus", seconds: 25 * 60, accent: "text-cyan-300" },
  short: { label: "Short Break", seconds: 5 * 60, accent: "text-emerald-300" },
  long: { label: "Long Break", seconds: 15 * 60, accent: "text-purple-300" },
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TASKS_KEY = "learnova_productivity_tasks";
const AGENDA_KEY = "learnova_productivity_agenda";
const TIME_BLOCKS = [
  { label: "Focus", color: "bg-cyan-400" },
  { label: "Meetings", color: "bg-purple-400" },
  { label: "Grading", color: "bg-emerald-400" },
];
const PRIORITIES = [
  { value: "low", label: "Low", color: "border-emerald-400/40 text-emerald-200" },
  { value: "medium", label: "Medium", color: "border-amber-400/40 text-amber-200" },
  { value: "high", label: "High", color: "border-rose-400/40 text-rose-200" },
];
const SOUNDSCAPES = [
  { value: "rain", label: "Rain", icon: Volume2 },
  { value: "wind", label: "Wind", icon: Wind },
  { value: "focus", label: "Focus", icon: Mic },
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

export default function ProductivityPage() {
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
  const [taskInput, setTaskInput] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [tasks, setTasks] = useState([
    { id: 1, text: "Prep lesson plan", done: false, priority: "medium" },
    { id: 2, text: "Review student analytics", done: true, priority: "low" },
    { id: 3, text: "Create quick quiz", done: false, priority: "high" },
  ]);
  const [agendaInput, setAgendaInput] = useState("");
  const [agendaLabel, setAgendaLabel] = useState("Focus");
  const [agendaItems, setAgendaItems] = useState({});
  const [ambientMode, setAmbientMode] = useState("focus");
  const [soundscape, setSoundscape] = useState("rain");
  const [soundscapeOn, setSoundscapeOn] = useState(false);
  const [recentCompleted, setRecentCompleted] = useState(false);
  const audioContextRef = useRef(null);
  const soundscapeRef = useRef(null);

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

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem(TASKS_KEY);
      const storedAgenda = localStorage.getItem(AGENDA_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
      if (storedAgenda) {
        setAgendaItems(JSON.parse(storedAgenda));
      }
    } catch (error) {
      console.error("Failed to load productivity storage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(AGENDA_KEY, JSON.stringify(agendaItems));
  }, [agendaItems]);

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

    return () => clearInterval(timerId);
  }, [isRunning]);

  useEffect(() => {
    if (timeLeft !== 0) {
      return;
    }

    setIsRunning(false);
    if (mode === "focus") {
      const nextFocusCount = focusSessions + 1;
      setFocusSessions(nextFocusCount);
      setRecentCompleted(true);
      setTimeout(() => setRecentCompleted(false), 1400);
      const nextMode = nextFocusCount % 4 === 0 ? "long" : "short";
      const nextSeconds = MODES[nextMode].seconds;
      setMode(nextMode);
      setSessionSeconds(nextSeconds);
      setManualMinutes(String(Math.round(nextSeconds / 60)));
      setTimeLeft(nextSeconds);
    } else {
      const focusSeconds = MODES.focus.seconds;
      setMode("focus");
      setSessionSeconds(focusSeconds);
      setManualMinutes(String(Math.round(focusSeconds / 60)));
      setTimeLeft(focusSeconds);
    }
  }, [timeLeft, mode, focusSessions]);

  useEffect(() => {
    setAmbientMode(mode);
  }, [mode]);

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

  const ambientGradient =
    ambientMode === "focus"
      ? "from-slate-950 via-slate-900 to-indigo-950"
      : ambientMode === "short"
      ? "from-emerald-950 via-slate-900 to-teal-950"
      : "from-purple-950 via-slate-900 to-indigo-950";

  const SoundscapeIcon =
    SOUNDSCAPES.find((item) => item.value === soundscape)?.icon || Volume2;

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

  useEffect(() => {
    const cleanupSoundscape = () => {
      if (soundscapeRef.current) {
        soundscapeRef.current.stop();
        soundscapeRef.current = null;
      }
    };

    const ensureAudioContext = () => {
      if (audioContextRef.current) return audioContextRef.current;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      return audioContextRef.current;
    };

    const startNoise = (ctx, type, gainNode) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      if (type === "rain") {
        filter.type = "lowpass";
        filter.frequency.value = 1200;
      } else {
        filter.type = "bandpass";
        filter.frequency.value = 500;
        filter.Q.value = 0.6;
      }

      source.connect(filter);
      filter.connect(gainNode);
      source.start();

      return {
        stop: () => {
          source.stop();
          source.disconnect();
          filter.disconnect();
        },
      };
    };

    const startTone = (ctx, gainNode) => {
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      oscA.type = "sine";
      oscB.type = "sine";
      oscA.frequency.value = 220;
      oscB.frequency.value = 277;
      const mix = ctx.createGain();
      mix.gain.value = 0.3;
      oscA.connect(mix);
      oscB.connect(mix);
      mix.connect(gainNode);
      oscA.start();
      oscB.start();

      return {
        stop: () => {
          oscA.stop();
          oscB.stop();
          oscA.disconnect();
          oscB.disconnect();
          mix.disconnect();
        },
      };
    };

    if (!soundscapeOn) {
      cleanupSoundscape();
      return undefined;
    }

    const ctx = ensureAudioContext();
    ctx.resume();
    cleanupSoundscape();

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.12;
    gainNode.connect(ctx.destination);

    const soundscapeNode =
      soundscape === "focus"
        ? startTone(ctx, gainNode)
        : startNoise(ctx, soundscape, gainNode);

    soundscapeRef.current = {
      stop: () => {
        soundscapeNode.stop();
        gainNode.disconnect();
      },
    };

    return () => cleanupSoundscape();
  }, [soundscapeOn, soundscape]);

  return (
    <div
      className={`min-h-screen bg-linear-to-br ${ambientGradient} text-white relative overflow-hidden`}
    >
      <Navbar />
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <DarkVeil />
      </div>

      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_55%)]" />
      </div>

      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto space-y-12">
          <section className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10">
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span className="text-sm uppercase tracking-[0.3em] text-cyan-200">
                Productivity Suite
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold">
              Stay in Flow. Track What Matters.
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              A productivity workspace designed for educators and learners.
              Plan your day, protect focus blocks, and keep tasks moving.
            </p>
          </section>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Pomodoro Timer</p>
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <Timer className="w-5 h-5 text-cyan-300" />
                      {MODES[mode].label}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => switchMode("focus")}
                      className={`px-4 py-2 rounded-full border border-white/10 text-sm transition ${
                        mode === "focus"
                          ? "bg-cyan-500/20 text-cyan-200"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      Focus
                    </button>
                    <button
                      onClick={() => switchMode("short")}
                      className={`px-4 py-2 rounded-full border border-white/10 text-sm transition ${
                        mode === "short"
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      Short
                    </button>
                    <button
                      onClick={() => switchMode("long")}
                      className={`px-4 py-2 rounded-full border border-white/10 text-sm transition ${
                        mode === "long"
                          ? "bg-purple-500/20 text-purple-200"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      Long
                    </button>
                  </div>
                </div>

                <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="relative h-32 w-32">
                      <div
                        className="absolute inset-0 rounded-full border-4 border-white/10"
                        aria-hidden="true"
                      />
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(#38bdf8 ${
                            (1 - timeLeft / sessionSeconds) * 360
                          }deg, rgba(255,255,255,0.08) 0deg)`,
                        }}
                      />
                      <div className="absolute inset-2 rounded-full bg-slate-950/70 flex items-center justify-center">
                        <span className={`text-3xl font-bold ${MODES[mode].accent}`}>
                          {formatTime(timeLeft)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400">Focus sessions</p>
                      <motion.div
                        className="flex items-center gap-2 text-lg font-semibold"
                        animate={recentCompleted ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Flame className="w-5 h-5 text-orange-300" />
                        {focusSessions} completed
                      </motion.div>
                      <p className="text-sm text-slate-400">
                        Focus minutes today: {focusMinutes} min
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={toggleTimer}
                      className="px-5 py-3 rounded-2xl bg-linear-to-r from-cyan-400/80 to-blue-500/80 text-slate-900 font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isRunning ? "Pause" : "Start"}
                    </button>
                    <button
                      onClick={resetTimer}
                      className="px-5 py-3 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                    <form
                      onSubmit={applyManualTime}
                      className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2"
                    >
                      <label
                        htmlFor="pomodoro-minutes"
                        className="text-xs text-slate-300"
                      >
                        Minutes
                      </label>
                      <input
                        id="pomodoro-minutes"
                        type="number"
                        min="1"
                        max="180"
                        value={manualMinutes}
                        onChange={(event) => setManualMinutes(event.target.value)}
                        className="w-16 rounded-lg bg-transparent border border-white/10 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-xl bg-cyan-500/80 text-slate-900 text-xs font-semibold"
                      >
                        Set
                      </button>
                    </form>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
                    <FlameIcon className="w-4 h-4 text-orange-300" />
                    Streak: {Math.max(1, focusSessions)} days
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
                    <Clock className="w-4 h-4 text-cyan-300" />
                    Next break in {Math.ceil(timeLeft / 60)} min
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
                    {ambientMode === "focus" ? (
                      <Sun className="w-4 h-4 text-amber-300" />
                    ) : (
                      <Moon className="w-4 h-4 text-purple-300" />
                    )}
                    Ambient: {MODES[ambientMode]?.label || "Focus"}
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div>
                    <p className="text-sm text-slate-400">Calendar Pulse</p>
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-purple-300" />
                      {monthLabel}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedDateLabel} - {agendaSummaryForSelectedDate.total} items
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMonthOffset((prev) => prev - 1)}
                      className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setMonthOffset(0)}
                      className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setMonthOffset((prev) => prev + 1)}
                      className="px-3 py-2 rounded-xl bg-white/10 border border-white/10"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  <button
                    type="button"
                    onClick={() => setCalendarFilter("all")}
                    className={`px-3 py-1 rounded-full text-xs border transition ${
                      calendarFilter === "all"
                        ? "bg-white/10 border-white/20 text-white"
                        : "border-white/10 text-slate-300"
                    }`}
                  >
                    All
                  </button>
                  {TIME_BLOCKS.map((block) => (
                    <button
                      key={block.label}
                      type="button"
                      onClick={() => setCalendarFilter(block.label)}
                      className={`px-3 py-1 rounded-full text-xs border transition ${
                        calendarFilter === block.label
                          ? "bg-white/10 border-white/20 text-white"
                          : "border-white/10 text-slate-300"
                      }`}
                    >
                      <span className={`inline-block h-2 w-2 rounded-full mr-2 ${block.color}`} />
                      {block.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2 text-xs text-slate-400 mb-3">
                  {WEEK_DAYS.map((day) => (
                    <div key={day} className="text-center">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendar.cells.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} />;
                    }
                    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                    const isToday = key === todayKey;
                    const isSelected = key === selectedDateKey;
                    const agendaListForDay = agendaItems[key] || [];
                    const agendaCountForDay = agendaListForDay.length;
                    const agendaCountsByLabel = agendaListForDay.reduce(
                      (acc, item) => {
                        acc[item.label] = (acc[item.label] || 0) + 1;
                        return acc;
                      },
                      {}
                    );
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedDateKey(key)}
                        className={`h-16 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-sm transition hover:border-cyan-400/40 hover:bg-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${
                          isToday
                            ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-100"
                            : isSelected
                            ? "bg-purple-500/20 border-purple-400/40 text-purple-100"
                            : "bg-white/5 text-slate-200"
                        }`}
                      >
                        <span className="font-semibold">{date.getDate()}</span>
                        <div className="mt-1 flex items-center gap-1">
                          {agendaCountForDay ? (
                            <span className="text-[11px] text-slate-400">
                              {agendaCountForDay} items
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Focus</span>
                          )}
                          <div className="flex gap-1">
                            {TIME_BLOCKS.filter((block) => {
                              if (calendarFilter === "all") return true;
                              return calendarFilter === block.label;
                            })
                              .filter((block) => agendaCountsByLabel[block.label])
                              .map((block) => (
                                <span
                                  key={`${key}-${block.label}`}
                                  className={`h-1.5 w-1.5 rounded-full ${block.color} opacity-70`}
                                  aria-hidden="true"
                                />
                              ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm text-slate-400">Focus Snapshot</p>
                    <h3 className="text-2xl font-semibold flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-300" />
                      Today at a glance
                    </h3>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs border border-white/10 text-slate-300">
                    {selectedDateLabel}
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-slate-400">Agenda items</p>
                    <div className="mt-2 text-2xl font-semibold text-cyan-200">
                      {agendaCount}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Scheduled today</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-slate-400">Task completion</p>
                    <div className="mt-2 text-2xl font-semibold text-emerald-200">
                      {taskCompletion}%
                    </div>
                    <div className="h-2 mt-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-emerald-400 to-cyan-400"
                        style={{ width: `${taskCompletion}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-slate-400">Soundscape</p>
                    <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                      <SoundscapeIcon className="w-4 h-4 text-purple-200" />
                      {soundscapeOn ? "On" : "Off"}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {soundscapeOn ? soundscape : "Silent focus"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">Next focus block</p>
                  {nextFocusBlock ? (
                    <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                      <Timer className="w-5 h-5 text-cyan-300" />
                      {nextFocusBlock.text}
                      <span className="text-sm text-slate-400">
                        {nextFocusBlock.time}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">
                      Add a focus item to see it here.
                    </p>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="space-y-8">
              <motion.div
                className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <ListTodo className="w-5 h-5 text-emerald-300" />
                  <h3 className="text-xl font-semibold">Tasks</h3>
                </div>
                <form onSubmit={addTask} className="flex flex-col gap-3 mb-4">
                  <input
                    value={taskInput}
                    onChange={(event) => setTaskInput(event.target.value)}
                    placeholder="Add a new task"
                    className="flex-1 rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-2">
                      {PRIORITIES.map((priority) => (
                        <button
                          key={priority.value}
                          type="button"
                          onClick={() => setTaskPriority(priority.value)}
                          className={`px-3 py-1 rounded-full text-xs border transition ${priority.color} ${
                            taskPriority === priority.value
                              ? "bg-white/10"
                              : "bg-transparent"
                          }`}
                        >
                          {priority.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="ml-auto px-3 py-2 rounded-xl bg-cyan-500/80 text-slate-900"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Completion</span>
                    <span>{taskCompletion}%</span>
                  </div>
                  <div className="h-2 mt-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-emerald-400 to-cyan-400"
                      style={{ width: `${taskCompletion}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`flex items-center gap-2 ${
                            task.done ? "text-slate-500 line-through" : "text-slate-200"
                          }`}
                        >
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              task.done ? "text-emerald-400" : "text-slate-500"
                            }`}
                          />
                          {task.text}
                        </button>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full border text-[10px] uppercase ${
                            PRIORITIES.find((priority) => priority.value === task.priority)?.color ||
                            "border-white/20 text-slate-300"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <button
                          onClick={() => moveTask(task.id, -1)}
                          disabled={index === 0}
                          className="p-1 rounded-lg hover:text-white disabled:opacity-40"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveTask(task.id, 1)}
                          disabled={index === tasks.length - 1}
                          className="p-1 rounded-lg hover:text-white disabled:opacity-40"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeTask(task.id)}
                          className="p-1 rounded-lg hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-300" />
                  <h3 className="text-xl font-semibold">Focus Insights</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-sm text-slate-400">Energy level</p>
                    <div className="h-2 mt-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-3/4 bg-linear-to-r from-cyan-400 to-purple-400" />
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-sm text-slate-400">Deep work streak</p>
                    <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                      <Flame className="w-5 h-5 text-orange-300" />
                      6 days strong
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-sm text-slate-400">Next focus block</p>
                    {nextFocusBlock ? (
                      <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                        <Timer className="w-5 h-5 text-cyan-300" />
                        {nextFocusBlock.text}
                        <span className="text-sm text-slate-400">
                          {nextFocusBlock.time}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">
                        No focus blocks scheduled yet.
                      </p>
                    )}
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-sm text-slate-400">Soundscape</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SOUNDSCAPES.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setSoundscape(item.value)}
                            className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                              soundscape === item.value
                                ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
                                : "border-white/10 text-slate-300"
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            {item.label}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setSoundscapeOn((prev) => !prev)}
                        className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                          soundscapeOn
                            ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
                            : "border-white/10 text-slate-300"
                        }`}
                      >
                        {soundscapeOn ? "On" : "Off"}
                        <SoundscapeIcon className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full w-2/3 ${
                            soundscapeOn
                              ? "bg-linear-to-r from-cyan-400 to-purple-400"
                              : "bg-white/10"
                          }`}
                        />
                      </div>
                      <span className="text-xs text-slate-400">EQ</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                whileHover={{ y: -4 }}
              >
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-300" />
                  Creative Boosts
                </h3>
                <p className="text-sm text-slate-300">
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
                      className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="w-5 h-5 text-purple-300" />
                  <div>
                    <h3 className="text-xl font-semibold">Agenda</h3>
                    <p className="text-sm text-slate-400">{selectedDateLabel}</p>
                  </div>
                </div>
                <form onSubmit={addAgendaItem} className="flex flex-col gap-3 mb-4">
                  <input
                    value={agendaInput}
                    onChange={(event) => setAgendaInput(event.target.value)}
                    placeholder="Add agenda item"
                    className="flex-1 rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {TIME_BLOCKS.map((block) => (
                      <button
                        key={block.label}
                        type="button"
                        onClick={() => setAgendaLabel(block.label)}
                        className={`px-3 py-1 rounded-full text-xs border transition ${
                          agendaLabel === block.label
                            ? "bg-white/10 border-white/20 text-white"
                            : "border-white/10 text-slate-300"
                        }`}
                      >
                        <span className={`inline-block h-2 w-2 rounded-full mr-2 ${block.color}`} />
                        {block.label}
                      </button>
                    ))}
                    <button
                      type="submit"
                      className="ml-auto px-3 py-2 rounded-xl bg-purple-500/80 text-slate-900"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>
                <div className="space-y-3">
                  {agendaForSelectedDate.length === 0 ? (
                    <div className="text-sm text-slate-400">
                      No agenda yet. Add a focus item for this day.
                    </div>
                  ) : (
                    agendaForSelectedDate.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl px-3 py-2"
                      >
                        <div className="text-sm text-slate-200">
                          <p className="font-medium">{item.text}</p>
                          <p className="text-xs text-slate-400">{item.time}</p>
                          <p className="text-xs text-purple-200">{item.label}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <button
                            onClick={() => moveAgendaItem(item.id, -1)}
                            disabled={index === 0}
                            className="p-1 rounded-lg hover:text-white disabled:opacity-40"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveAgendaItem(item.id, 1)}
                            disabled={index === agendaForSelectedDate.length - 1}
                            className="p-1 rounded-lg hover:text-white disabled:opacity-40"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeAgendaItem(item.id)}
                            className="p-1 rounded-lg hover:text-red-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              <motion.div
                className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-cyan-300" />
                  <h3 className="text-xl font-semibold">Daily Summary</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Tasks completed</span>
                    <span className="text-slate-200">
                      {completedTasks} / {tasks.length}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-cyan-400 to-purple-400"
                      style={{ width: `${taskCompletion}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Agenda items</span>
                    <span className="text-slate-200">{agendaCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Focus minutes</span>
                    <span className="text-slate-200">{focusMinutes} min</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

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
                className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm"
              >
                Quick Add Task
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  setAgendaInput("");
                }}
                className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm"
              >
                Quick Add Agenda
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  setIsRunning(true);
                }}
                className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm"
              >
                Start Focus
              </button>
            </motion.div>
          )}
          <button
            onClick={() => setShowQuickAdd((prev) => !prev)}
            className="h-12 w-12 rounded-full bg-linear-to-r from-cyan-400 to-purple-500 text-slate-900 flex items-center justify-center shadow-lg"
            aria-label="Quick add"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
