"use client";
import { useEffect, useState } from "react";
import { useIsMounted } from "@/hooks/useIsMounted";

export function useTimetableReminders() {
  const isMounted = useIsMounted();
  const [pushStatus, setPushStatus] = useState("default");
  const [timetableData, setTimetableData] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("Notification" in window)) {
        setPushStatus("unsupported");
      } else {
        setPushStatus(Notification.permission);
      }

      const loadTimetable = () => {
        const saved = localStorage.getItem("learnova_custom_timetable");
        if (saved) {
          try {
            setTimetableData(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse saved timetable in hook:", e);
          }
        }
      };

      loadTimetable();

      // Listen for updates from the Timetable component
      const handleUpdate = () => {
        loadTimetable();
      };
      window.addEventListener("timetable-updated", handleUpdate);
      return () => window.removeEventListener("timetable-updated", handleUpdate);
    }
  }, []);

  const triggerNotification = (cls, immediate = false) => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;

    const [startStr] = cls.time.split("-");
    if (!startStr) return;
    const [hours, minutes] = startStr.split(":").map(Number);
    const classTime = new Date();
    classTime.setHours(hours, minutes, 0, 0);

    const minsLeft = immediate
      ? Math.max(1, Math.round((classTime.getTime() - Date.now()) / 60000))
      : 10;

    const title = `Class starting in ${minsLeft}m: ${cls.subject}`;
    const options = {
      body: `📍 Location: ${cls.room}\n👨‍🏫 Instructor: ${cls.teacher}\n⏰ Schedule: ${cls.time}`,
      icon: "/logo-icon.png",
      badge: "/logo-icon.png",
      vibrate: [100, 50, 100],
      tag: `class-reminder-${cls.subject}-${cls.time}`,
      data: {
        url: "/timetable"
      },
      actions: [
        { action: "open", title: "View Timetable" },
        { action: "close", title: "Dismiss" }
      ]
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      }).catch(() => {
        new Notification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  };

  useEffect(() => {
    if (pushStatus !== "granted" || !isMounted()) return;

    const timerIds = [];
    const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const todayClasses = timetableData[todayName] || [];

    todayClasses.forEach((cls) => {
      const [startStr] = cls.time.split("-");
      if (!startStr) return;
      const [hours, minutes] = startStr.split(":").map(Number);

      const now = new Date();
      const classTime = new Date();
      classTime.setHours(hours, minutes, 0, 0);

      // Reminder is 10 minutes before class
      const reminderTime = new Date(classTime.getTime() - 10 * 60 * 1000);

      if (classTime > now) {
        if (reminderTime > now) {
          const delay = reminderTime.getTime() - now.getTime();
          const timerId = setTimeout(() => {
            triggerNotification(cls);
          }, delay);
          timerIds.push(timerId);
        } else {
          // Class starts in less than 10m but hasn't started yet - trigger alert immediately
          triggerNotification(cls, true);
        }
      }
    });

    return () => {
      timerIds.forEach((id) => clearTimeout(id));
    };
  }, [pushStatus, timetableData, isMounted]);

  return null;
}
