"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import DarkVeil from "@/components/ui-block/DarkVeil";
import TimerSkeleton from "@/components/ui/TimerSkeleton";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";
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
import { useTheme } from "next-themes";
import { TimerSection } from "@/components/productivity/TimerSection";
import { apiFetch } from "@/lib/apiClient";
import { TaskSection } from "@/components/productivity/TaskSection";
import { CalendarSection } from "@/components/productivity/CalendarSection";
import { AgendaListSection } from "@/components/productivity/AgendaListSection";

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
  const [taskInput, setTaskInput] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [tasks, setTasks] = useState([]);
  const [agendaInput, setAgendaInput] = useState("");
  const [agendaLabel, setAgendaLabel] = useState("Focus");
  const [agendaItems, setAgendaItems] = useState({});
  const [ambientMode, setAmbientMode] = useState("focus");
  const [soundscape, setSoundscape] = useState("rain");
  const [soundscapeOn, setSoundscapeOn] = useState(false);
  const [recentCompleted, setRecentCompleted] = useState(false);
  const audioContextRef = useRef(null);
  const soundscapeRef = useRef(null);
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

    return () => clearInterval(timerId);
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
    setAmbientMode(nextMode);
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

  const { theme } = useTheme();
  const isDark = theme === "dark";

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
    ? darkAmbientStyles[ambientMode] || darkAmbientStyles.focus
    : lightAmbientStyles[ambientMode] || lightAmbientStyles.focus;

  const ambientGradient = ambientStyles.gradient;

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
      const stopCallbacks = [];

      const filter = ctx.createBiquadFilter();

      if (type === "rain") {
        // Synthesize Pink Noise (Voss-McCartney method) for rain
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < data.length; i += 1) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          b6 = white * 0.115926;
          data[i] = pink * 0.12; // Normalize peak amplitude
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        filter.type = "lowpass";
        filter.frequency.value = 1000;

        source.connect(filter);
        filter.connect(gainNode);
        source.start();

        stopCallbacks.push(() => {
          source.stop();
          source.disconnect();
        });
      } else {
        // Synthesize Brown Noise (Leaky Integrator walk) for wind
        let lastOut = 0.0;
        for (let i = 0; i < data.length; i += 1) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5; // Amplify back to audible range
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        filter.type = "bandpass";
        filter.frequency.value = 350;
        filter.Q.value = 1.5;

        // Dynamic wind gust simulator (LFO filter frequency sweeper)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        lfo.type = "sine";
        lfo.frequency.value = 0.08; // Swings once every 12.5 seconds
        lfoGain.gain.value = 150; // Sweeps frequency by +/- 150Hz

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        source.connect(filter);
        filter.connect(gainNode);
        
        source.start();
        lfo.start();

        stopCallbacks.push(() => {
          source.stop();
          lfo.stop();
          source.disconnect();
          lfo.disconnect();
          lfoGain.disconnect();
        });
      }

      stopCallbacks.push(() => {
        filter.disconnect();
      });

      return {
        stop: () => {
          stopCallbacks.forEach((cb) => {
            try {
              cb();
            } catch (err) {
              console.warn("Error cleaning up audio nodes:", err);
            }
          });
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
      className={`min-h-screen bg-gradient-to-br ${ambientGradient} ${isDark ? "text-white" : "text-slate-900"
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
        <div className={`absolute -top-32 -right-32 w-72 h-72 rounded-full ${ambientStyles.glowPrimary} blur-3xl transition-colors duration-500`} />
        <div className={`absolute bottom-0 left-0 w-72 h-72 rounded-full ${ambientStyles.glowSecondary} blur-3xl transition-colors duration-500`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_55%)]" />
      </div>

      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative z-10 ">
        <div className="max-w-6xl mx-auto space-y-12">
          <Navbar />
          <section className="text-center space-y-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isDark
                ? "bg-white/10 border border-white/10 text-white"
                : "bg-slate-100 border border-slate-300 text-slate-900"
              }`}>
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span className={`text-sm uppercase tracking-[0.3em] ${isDark ? "text-cyan-200" : "text-cyan-700"
                }`}>
                Productivity Suite
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold">
              Stay in Flow. Track What Matters.
            </h1>
            <p className={`text-lg ${isDark ? "text-slate-300" : "text-slate-600"} max-w-2xl mx-auto`}>
              A productivity workspace designed for educators and learners.
              Plan your day, protect focus blocks, and keep tasks moving.
            </p>
          </section>

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

              <motion.div
                className={`${isDark
                    ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                    : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                  } rounded-3xl p-6 md:p-8 `}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>Focus Snapshot</p>
                    <h3 className="text-2xl font-semibold flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-300" />
                      Today at a glance
                    </h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs border border-white/10 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {selectedDateLabel}
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className={`rounded-2xl ${isDark
                      ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                      : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                    } p-4`}>
                    <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>Agenda items</p>
                    <div className="mt-2 text-2xl font-semibold text-cyan-200">
                      {agendaCount}
                    </div>
                    <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"} mt-1`}>Scheduled today</p>
                  </div>
                  <div className={`rounded-2xl ${isDark
                      ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                      : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                    } p-4`}>
                    <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>Task completion</p>
                    <div className="mt-2 text-2xl font-semibold text-emerald-200">
                      {taskCompletion}%
                    </div>
                    <div className="h-2 mt-2 rounded-full bg-slate-100/80 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                        style={{ width: `${taskCompletion}%` }}
                      />
                    </div>
                  </div>
                  <div className={`rounded-2xl ${isDark
                      ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                      : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                    } p-4`}>
                    <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>Soundscape</p>
                    <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                      <SoundscapeIcon className="w-4 h-4 text-purple-500" />
                      {soundscapeOn ? "On" : "Off"}
                    </div>
                    <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"} mt-1`}>
                      {soundscapeOn ? soundscape : "Silent focus"}
                    </p>
                  </div>
                </div>

                <div className={`mt-6 rounded-2xl ${isDark
                    ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                    : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                  } p-4`}>
                  <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>Next focus block</p>
                  {nextFocusBlock ? (
                    <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                      <Timer className="w-5 h-5 text-cyan-300" />
                      {nextFocusBlock.text}
                      <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        {nextFocusBlock.time}
                      </span>
                    </div>
                  ) : (
                    <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      Add a focus item to see it here.
                    </p>
                  )}
                </div>
              </motion.div>
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

              <motion.div
                className={`${isDark
                    ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                    : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                  } rounded-3xl p-6 space-y-4`}
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
                  <div className={`rounded-2xl p-4 ${isDark
                      ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                      : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                    }`}>
                    <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>Energy level</p>
                    <div className="h-2 mt-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />
                    </div>
                  </div>
                  <div className={`rounded-2xl p-4 ${isDark
                      ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                      : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                    }`}>
                    <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>Deep work streak</p>
                    <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                      <Flame className="w-5 h-5 text-orange-300" />
                      6 days strong
                    </div>
                  </div>
                  <div className={`rounded-2xl p-4 ${isDark
                      ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                      : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                    }`}>
                    <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>Next focus block</p>
                    {nextFocusBlock ? (
                      <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                        <Timer className="w-5 h-5 text-cyan-300" />
                        {nextFocusBlock.text}
                        <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                          {nextFocusBlock.time}
                        </span>
                      </div>
                    ) : (
                      <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        No focus blocks scheduled yet.
                      </p>
                    )}
                  </div>
                  <div className={`rounded-2xl p-4 ${isDark
                      ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                      : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                    }`}>
                    <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>Soundscape</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SOUNDSCAPES.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setSoundscape(item.value)}
                            className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 transition-all duration-300 ${
  soundscape === item.value
    ? isDark
      ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
      : "border-cyan-300 bg-cyan-100 text-cyan-900"
    : isDark
      ? "border-white/10 text-slate-300 hover:text-white"
      : "border-slate-300 text-slate-700 hover:text-slate-900 bg-white/60"
}`}
                          >
                            <Icon className="w-3 h-3" />
                            {item.label}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setSoundscapeOn((prev) => !prev)}
                        className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 transition-all duration-300 ${
  soundscapeOn
    ? isDark
      ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
      : "border-emerald-300 bg-emerald-100 text-emerald-900"
    : isDark
      ? "border-white/10 text-slate-300 hover:text-white"
      : "border-slate-300 text-slate-700 hover:text-slate-900 bg-white/60"
}`}
                      >
                        {soundscapeOn ? "On" : "Off"}
                        <SoundscapeIcon className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-slate-100/80 dark:bg-white/10 overflow-hidden">
                        <div
                          className={`h-full w-2/3 ${soundscapeOn
                              ? "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                              : "bg-white/10"
                            }`}
                        />
                      </div>
                      <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>EQ</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className={`${isDark
                    ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                    : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                  } rounded-3xl p-6 space-y-3`}
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
                <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
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
                      className={`px-3 py-1 rounded-full text-xs ${isDark
                          ? "bg-white/10 border border-white/10 text-white"
                          : "bg-slate-100 border border-slate-300 text-slate-900"
                        } hover:bg-white/20 transition-colors cursor-pointer ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </motion.div>

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

              <motion.div
                className={`${isDark
                    ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                    : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                  } rounded-3xl p-6 `}
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
                    <span className={`${isDark ? "text-slate-300" : "text-slate-600"}`}>Tasks completed</span>
                    <span className={`${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      {completedTasks} / {tasks.length}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100/80 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                      style={{ width: `${taskCompletion}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`${isDark ? "text-slate-300" : "text-slate-600"}`}>Agenda items</span>
                    <span className={`${isDark ? "text-slate-200" : "text-slate-800"}`}>{agendaCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`${isDark ? "text-slate-300" : "text-slate-600"}`}>Focus minutes</span>
                    <span className={`${isDark ? "text-slate-200" : "text-slate-800"}`}>{focusMinutes} min</span>
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
                className={`px-4 py-2 rounded-full ${isDark
                    ? "bg-white/10 border border-white/10 text-white"
                    : "bg-slate-100 border border-slate-300 text-slate-900"
                  } text-sm`}
              >
                Quick Add Task
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  setAgendaInput("");
                }}
                className={`px-4 py-2 rounded-full ${isDark
                    ? "bg-white/10 border border-white/10 text-white"
                    : "bg-slate-100 border border-slate-300 text-slate-900"
                  } text-sm`}
              >
                Quick Add Agenda
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  setIsRunning(true);
                }}
                className={`px-4 py-2 rounded-full ${isDark
                    ? "bg-white/10 border border-white/10 text-white"
                    : "bg-slate-100 border border-slate-300 text-slate-900"
                  } text-sm`}
              >
                Start Focus
              </button>
            </motion.div>
          )}
          <button
            onClick={() => setShowQuickAdd((prev) => !prev)}
            className="h-12 w-12 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-slate-900 flex items-center justify-center shadow-lg"
            aria-label="Quick add"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
