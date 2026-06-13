"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Download,
  Sparkles,
  Copy,
  CalendarPlus,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMounted } from "@/hooks/useIsMounted";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const mockTimetable = {
  Monday: [
    {
      time: "09:00-10:30",
      subject: "Data Structures",
      teacher: "Dr. Smith",
      room: "Lab-1",
      color: "blue",
    },
    {
      time: "10:45-12:15",
      subject: "Mathematics",
      teacher: "Prof. Johnson",
      room: "Room-205",
      color: "purple",
    },
    {
      time: "14:00-15:30",
      subject: "Database Systems",
      teacher: "Dr. Brown",
      room: "Lab-2",
      color: "green",
    },
  ],
  Tuesday: [
    {
      time: "09:00-10:30",
      subject: "Web Development",
      teacher: "Ms. Wilson",
      room: "Lab-3",
      color: "pink",
    },
    {
      time: "10:45-12:15",
      subject: "Computer Networks",
      teacher: "Dr. Davis",
      room: "Room-301",
      color: "orange",
    },
  ],
  Wednesday: [
    {
      time: "09:00-10:30",
      subject: "Machine Learning",
      teacher: "Prof. Lee",
      room: "Lab-1",
      color: "teal",
    },
    {
      time: "10:45-12:15",
      subject: "Software Engineering",
      teacher: "Dr. Miller",
      room: "Room-204",
      color: "blue",
    },
    {
      time: "14:00-15:30",
      subject: "AI Ethics",
      teacher: "Prof. Chen",
      room: "Room-101",
      color: "purple",
    },
  ],
  Thursday: [
    {
      time: "09:00-10:30",
      subject: "Data Structures",
      teacher: "Dr. Smith",
      room: "Lab-1",
      color: "blue",
    },
    {
      time: "10:45-12:15",
      subject: "Mobile Development",
      teacher: "Ms. Garcia",
      room: "Lab-4",
      color: "green",
    },
  ],
  Friday: [
    {
      time: "09:00-10:30",
      subject: "AI Ethics",
      teacher: "Prof. Chen",
      room: "Room-101",
      color: "purple",
    },
    {
      time: "10:45-12:15",
      subject: "Project Work",
      teacher: "Dr. Kumar",
      room: "Lab-2",
      color: "orange",
    },
  ],
  Saturday: [],
};

const colorMap = {
  blue: "border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]",
  purple:
    "border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.05)]",
  green:
    "border-green-500/50 bg-green-500/10 hover:bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.05)]",
  pink: "border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.05)]",
  orange:
    "border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.05)]",
  teal: "border-teal-500/50 bg-teal-500/10 hover:bg-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.05)]",
};

const textColorMap = {
  blue: "text-blue-400 font-semibold",
  purple: "text-purple-400 font-semibold",
  green: "text-green-400 font-semibold",
  pink: "text-pink-400 font-semibold",
  orange: "text-orange-400 font-semibold",
  teal: "text-teal-400 font-semibold",
};

const byDayMap = {
  Sunday: "SU",
  Monday: "MO",
  Tuesday: "TU",
  Wednesday: "WE",
  Thursday: "TH",
  Friday: "FR",
  Saturday: "SA",
};

export default function Timetable({ role = "student" }) {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const [selectedDay, setSelectedDay] = useState(
    days.includes(today) ? today : "Monday"
  );
  const [isPending, setIsPending] = useState(false);
  const [pushStatus, setPushStatus] = useState("default");

  // Dynamic State & CRUD Modals State
  const [mounted, setMounted] = useState(false);
  const isMounted = useIsMounted();
  const [timetableData, setTimetableData] = useState(mockTimetable);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [calendarToken, setCalendarToken] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [editingIndex, setEditingIndex] = useState(null);
  const [originalDay, setOriginalDay] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    day: "",
    index: null,
    subject: "",
  });

  const [formData, setFormData] = useState({
    subject: "",
    teacher: "",
    room: "",
    day: "Monday",
    color: "blue",
    startTime: "09:00",
    endTime: "10:30",
  });

  // Fetch timetable from backend if authenticated
  useEffect(() => {
    const fetchBackendTimetable = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/timetable/sync", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!isMounted()) return;
          if (data.data?.timetableData) {
            setTimetableData(data.data.timetableData);
            localStorage.setItem(
              "learnova_custom_timetable",
              JSON.stringify(data.data.timetableData)
            );
          }
          if (data.data?.calendarToken) {
            setCalendarToken(data.data.calendarToken);
          }
        }
      } catch (err) {
        console.error("Failed to fetch timetable from backend:", err);
      }
    };

    if (user && mounted) {
      fetchBackendTimetable();
    }
  }, [user, mounted, isMounted]);

  // Client-side Hydration Safe loading of timetableData
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("learnova_custom_timetable");
      if (saved) {
        try {
          setTimetableData(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved timetable:", e);
        }
      }

      if (!("Notification" in window)) {
        setPushStatus("unsupported");
      } else {
        setPushStatus(Notification.permission);
      }
    }
  }, []);

  const saveTimetable = async (newData) => {
    setTimetableData(newData);
    localStorage.setItem("learnova_custom_timetable", JSON.stringify(newData));

    // Sync to backend if authenticated
    if (user) {
      setIsSyncing(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/timetable/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ timetableData: newData }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data?.calendarToken && isMounted()) {
            setCalendarToken(data.data.calendarToken);
          }
        }
      } catch (err) {
        console.error("Failed to sync timetable:", err);
      } finally {
        if (isMounted()) setIsSyncing(false);
      }
    }
    window.dispatchEvent(new Event("timetable-updated"));
  };

  // Timetable push reminder scheduler is now handled globally by useTimetableReminders hook

  const handleTogglePush = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (pushStatus === "granted") {
      setPushStatus("default");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
      if (permission === "granted") {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => {
              console.log(
                "Service Worker registered successfully with scope:",
                reg.scope
              );
            })
            .catch((err) => console.error("SW Registration failed:", err));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDayClick = (day) => {
    if (day === selectedDay || isPending) return;
    setIsPending(true);
    setSelectedDay(day);
    setTimeout(() => {
      setIsPending(false);
    }, 300);
  };

  // CRUD Event Handlers
  const handleOpenAddModal = (day = "Monday") => {
    setModalMode("add");
    setOriginalDay(day);
    setFormData({
      subject: "",
      teacher: "",
      room: "",
      day: day,
      color: "blue",
      startTime: "09:00",
      endTime: "10:30",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cls, index, day) => {
    setModalMode("edit");
    setEditingIndex(index);
    setOriginalDay(day);
    const [start, end] = cls.time.split("-");
    setFormData({
      subject: cls.subject,
      teacher: cls.teacher,
      room: cls.room,
      day: day,
      color: cls.color || "blue",
      startTime: start || "09:00",
      endTime: end || "10:30",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const getMinutesOfTime = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const handleSaveClass = (e) => {
    e.preventDefault();
    if (
      !formData.subject.trim() ||
      !formData.teacher.trim() ||
      !formData.room.trim()
    ) {
      toast.error("Please fill out all fields!");
      return;
    }

    const startMinutes = getMinutesOfTime(formData.startTime);
    const endMinutes = getMinutesOfTime(formData.endTime);

    if (startMinutes >= endMinutes) {
      toast.error("Class start time must be before end time!");
      return;
    }

    const time = `${formData.startTime}-${formData.endTime}`;
    const newClass = {
      subject: formData.subject.trim(),
      teacher: formData.teacher.trim(),
      room: formData.room.trim(),
      time,
      color: formData.color,
    };

    const updatedData = { ...timetableData };

    if (modalMode === "edit" && originalDay && originalDay !== formData.day) {
      // Remove from previous day
      updatedData[originalDay] = (updatedData[originalDay] || []).filter(
        (_, idx) => idx !== editingIndex
      );
      // Add to new day
      updatedData[formData.day] = [
        ...(updatedData[formData.day] || []),
        newClass,
      ];
      toast.success(`Class rescheduled to ${formData.day}!`);
    } else if (modalMode === "edit") {
      // Edit in same day
      updatedData[formData.day] = (updatedData[formData.day] || []).map(
        (cls, idx) => (idx === editingIndex ? newClass : cls)
      );
      toast.success("Class updated successfully!");
    } else {
      // Add class
      updatedData[formData.day] = [
        ...(updatedData[formData.day] || []),
        newClass,
      ];
      toast.success("New class added!");
    }

    // Chronologically sort target day's classes
    const targetDay = formData.day;
    updatedData[targetDay] = (updatedData[targetDay] || []).sort((a, b) => {
      const aStart = a.time.split("-")[0] || "00:00";
      const bStart = b.time.split("-")[0] || "00:00";
      return getMinutesOfTime(aStart) - getMinutesOfTime(bStart);
    });

    saveTimetable(updatedData);
    handleCloseModal();
  };

  const handleDeleteClass = (day, index) => {
    const classToDelete = timetableData[day]?.[index];
    if (!classToDelete) return;

    setDeleteConfirm({
      isOpen: true,
      day,
      index,
      subject: classToDelete.subject,
    });
  };

  const confirmDeleteClass = () => {
    const { day, index, subject } = deleteConfirm;
    if (day && index !== null) {
      const updatedData = { ...timetableData };
      updatedData[day] = updatedData[day].filter((_, idx) => idx !== index);
      saveTimetable(updatedData);
      toast.success(`Successfully deleted ${subject}!`);
    }
    setDeleteConfirm({ isOpen: false, day: "", index: null, subject: "" });
  };

  // iCalendar Exporter
  const getNextWeekdayDate = (dayName, timeStr) => {
    const weekdays = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    const targetDay = weekdays[dayName];
    const now = new Date();
    const currentDay = now.getDay();

    let daysToAdd = targetDay - currentDay;
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }

    const targetDate = new Date();
    targetDate.setDate(now.getDate() + daysToAdd);

    const [hours, minutes] = timeStr.split(":").map(Number);
    targetDate.setHours(hours || 9, minutes || 0, 0, 0);

    return targetDate;
  };

  const formatDateToICS = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const ss = "00";
    return `${yyyy}${mm}${dd}T${hh}${min}${ss}`;
  };

  const handleExportCalendar = () => {
    let icsString =
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Learnova//Student Timetable Scheduler//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
      ].join("\r\n") + "\r\n";

    let eventCount = 0;
    Object.keys(timetableData).forEach((day) => {
      const dayClasses = timetableData[day] || [];
      dayClasses.forEach((cls, idx) => {
        const [startStr, endStr] = cls.time.split("-");
        if (!startStr || !endStr) return;

        const startDate = getNextWeekdayDate(day, startStr.trim());
        const endDate = getNextWeekdayDate(day, endStr.trim());

        const startICS = formatDateToICS(startDate);
        const endICS = formatDateToICS(endDate);
        const byDay = byDayMap[day];

        icsString +=
          [
            "BEGIN:VEVENT",
            `UID:class-${day}-${idx}-${Date.now()}@learnova`,
            `DTSTAMP:${formatDateToICS(new Date())}`,
            `SUMMARY:${cls.subject}`,
            `DESCRIPTION:Instructor: ${cls.teacher}\\nRoom: ${cls.room}`,
            `LOCATION:${cls.room}`,
            `DTSTART:${startICS}`,
            `DTEND:${endICS}`,
            `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
            "END:VEVENT",
          ].join("\r\n") + "\r\n";
        eventCount++;
      });
    });

    icsString += "END:VCALENDAR";

    if (eventCount === 0) {
      toast.error("No classes scheduled to export!");
      return;
    }

    const blob = new Blob([icsString], {
      type: "text/calendar;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `learnova_weekly_timetable.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Successfully exported ${eventCount} classes to .ics!`);
  };

  const classes = timetableData[selectedDay] || [];

  return (
    <>
      <div className="bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 relative overflow-hidden">
        {/* Background visual detail */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white tracking-wide">
                Weekly Timetable
              </h3>
              <p className="text-white/50 text-xs">
                {role === "teacher"
                  ? "Manage teaching schedule"
                  : "Your personalized class schedule"}
              </p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {user && (
              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 hover:text-white hover:border-purple-500/40 transition-all duration-200 cursor-pointer shadow-sm"
                title="Sync with Google Calendar / Apple Calendar"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Sync Calendar</span>
              </button>
            )}

            {/* Export to ICS button */}
            <button
              onClick={handleExportCalendar}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer shadow-sm"
              title="Export Weekly Schedule to External Calendar (.ics)"
              aria-label="Export Weekly Schedule to External Calendar (.ics)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export (.ics)</span>
            </button>

            {/* Add class button */}
            <button
              onClick={() => handleOpenAddModal(selectedDay)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-xs font-semibold text-white hover:brightness-110 shadow-md shadow-blue-500/10 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Class</span>
            </button>

            {pushStatus !== "unsupported" && (
              <button
                onClick={handleTogglePush}
                className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                  pushStatus === "granted"
                    ? "bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                }`}
                title={
                  pushStatus === "granted"
                    ? "Push reminders active"
                    : "Enable push class reminders"
                }
                aria-label={
                  pushStatus === "granted"
                    ? "Mute push reminders"
                    : "Enable push reminders"
                }
              >
                {pushStatus === "granted" ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
              </button>
            )}

            {mounted && classes.length > 0 && (
              <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full font-medium">
                {classes.length} classes
              </span>
            )}
          </div>
        </div>

        {/* Day Selector */}
        <div
          className="flex space-x-1 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
          role="tablist"
          aria-label="Timetable days"
        >
          {days.map((day) => {
            const isToday = day === today;
            const isSelected = day === selectedDay;
            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                role="tab"
                aria-selected={isSelected}
                aria-controls="timetable-panel"
                id={`tab-${day}`}
                aria-label={day}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/15 scale-102"
                    : isToday
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {day.slice(0, 3)}
                {isToday && (
                  <span className="block w-1.5 h-1.5 bg-green-400 rounded-full mx-auto mt-1 shadow-sm shadow-green-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Classes List */}
        <div
          id="timetable-panel"
          role="tabpanel"
          aria-labelledby={`tab-${selectedDay}`}
        >
          {mounted && classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls, index) => (
                <div
                  key={index}
                  className={`rounded-2xl border p-5 transition-all duration-300 relative group border-white/10 bg-white/2 backdrop-blur-md ${colorMap[cls.color || "blue"]}`}
                >
                  <div className="flex items-start justify-between mb-3.5">
                    <h4
                      className={`font-semibold text-sm tracking-wide ${textColorMap[cls.color || "blue"]}`}
                    >
                      {cls.subject}
                    </h4>

                    {/* Visual action controls on the card */}
                    <div className="flex items-center space-x-1.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(cls, index, selectedDay);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:text-cyan-400 hover:bg-white/10 hover:border-cyan-500/20 border border-transparent transition-all"
                        title="Edit Class Slot"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(selectedDay, index);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:text-rose-400 hover:bg-white/10 hover:border-rose-500/20 border border-transparent transition-all"
                        title="Delete Class Slot"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <div className="flex items-center space-x-2.5 text-white/60 text-xs">
                      <div className="p-1 rounded bg-white/5 text-white/70">
                        <Clock className="w-3 h-3" />
                      </div>
                      <span className="font-mono">{cls.time}</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-white/60 text-xs">
                      <div className="p-1 rounded bg-white/5 text-white/70">
                        <User className="w-3 h-3" />
                      </div>
                      <span>{cls.teacher}</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-white/60 text-xs">
                      <div className="p-1 rounded bg-white/5 text-white/70">
                        <MapPin className="w-3 h-3" />
                      </div>
                      <span className="font-semibold text-white/80">
                        {cls.room}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/2 rounded-2xl border border-white/5">
              <Calendar className="w-12 h-12 text-white/10 mx-auto mb-3.5 animate-pulse" />
              <p className="text-white/40 text-sm font-semibold">
                No classes on {selectedDay}
              </p>
              <p className="text-white/20 text-xs mt-1 mb-4">
                Enjoy your day off! 🎉
              </p>
              <button
                onClick={() => handleOpenAddModal(selectedDay)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs text-white/80 hover:text-white transition duration-200 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule Class
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CRUD Add/Edit Glassmorphic Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop filter overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                  {modalMode === "add"
                    ? "Create Class Schedule"
                    : "Edit Class Schedule"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="rounded-lg p-1.5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                  aria-label="Action button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveClass} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Algorithms"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                      Instructor Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Davis"
                      value={formData.teacher}
                      onChange={(e) =>
                        setFormData({ ...formData, teacher: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                      Classroom / Lab
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Room-305"
                      value={formData.room}
                      onChange={(e) =>
                        setFormData({ ...formData, room: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                      Day of Week
                    </label>
                    <select
                      value={formData.day}
                      onChange={(e) =>
                        setFormData({ ...formData, day: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                    >
                      {days.map((d) => (
                        <option
                          key={d}
                          value={d}
                          className="bg-slate-900 text-white"
                        >
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                      Color Theme Category
                    </label>
                    <select
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                    >
                      <option value="blue">Blue (Core Lecture)</option>
                      <option value="purple">Purple (Theory)</option>
                      <option value="green">Green (Practical Lab)</option>
                      <option value="pink">Pink (Creative / Elective)</option>
                      <option value="orange">Orange (Project / Viva)</option>
                      <option value="teal">Teal (Seminar / Guest)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition cursor-pointer"
                    aria-label="Action button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 text-sm font-semibold text-white shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                    aria-label="Action button"
                  >
                    <Check className="w-4 h-4" />
                    {modalMode === "add" ? "Add to Schedule" : "Save Settings"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setDeleteConfirm({
                  isOpen: false,
                  day: "",
                  index: null,
                  subject: "",
                })
              }
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl backdrop-blur-2xl text-center z-10"
            >
              <div className="flex flex-col items-center mb-4">
                <div className="rounded-full bg-red-500/10 p-3 mb-3 border border-red-500/20">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Delete Class Schedule
                </h3>
                <p className="text-white/60 text-sm mt-2">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-white">
                    {deleteConfirm.subject}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirm({
                      isOpen: false,
                      day: "",
                      index: null,
                      subject: "",
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteClass}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:brightness-110 text-sm font-semibold text-white shadow-lg transition cursor-pointer"
                  aria-label="Action button"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Calendar Sync Modal */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSyncModalOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5 text-purple-400" />
                  Sync with External Calendar
                </h3>
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-white/70">
                  Subscribe to your Learnova timetable in your favorite calendar
                  app (Google Calendar, Apple Calendar, Outlook). Your calendar
                  will automatically update when you make changes here.
                </p>

                {calendarToken ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                        Calendar Feed URL
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={`${window.location.origin}/api/timetable/ical/${calendarToken}/feed.ics`}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/api/timetable/ical/${calendarToken}/feed.ics`
                            );
                            toast.success("Feed URL copied to clipboard!");
                          }}
                          className="px-4 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 hover:text-white transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <a
                        href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(`${window.location.origin}/api/timetable/ical/${calendarToken}/feed.ics`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-white transition-colors cursor-pointer"
                      >
                        <CalendarPlus className="w-4 h-4" />
                        Google Calendar
                        <ExternalLink size={14} className="ml-1 inline" />
                      </a>
                      <a
                        href={`webcal://${window.location.host}/api/timetable/ical/${calendarToken}/feed.ics`}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-white transition-colors cursor-pointer"
                      >
                        <CalendarPlus className="w-4 h-4" />
                        Apple Calendar
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-white/50 mb-4">
                      Please add a class to your timetable first to generate a
                      sync link.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
