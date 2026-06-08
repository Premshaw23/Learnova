"use client";

import React, { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StreakTracker Component
 * Tracks and displays the user's consecutive days of engagement using localStorage.
 * Ensures robust calendar-day calculation preventing timezone/hour anomalies.
 */
export default function StreakTracker({ className }) {
  const [streak, setStreak] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const today = new Date();
      // Zero out time to get accurate calendar day comparisons
      const todayMidnight = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      const storedStreak = localStorage.getItem("currentStreak");
      const storedLastActive = localStorage.getItem("lastActiveDate");

      let currentStreak = storedStreak ? parseInt(storedStreak, 10) : 0;

      if (storedLastActive) {
        const lastActiveDate = new Date(storedLastActive);
        const lastActiveMidnight = new Date(
          lastActiveDate.getFullYear(),
          lastActiveDate.getMonth(),
          lastActiveDate.getDate()
        );

        const diffTime = todayMidnight.getTime() - lastActiveMidnight.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Exactly 1 day difference (consecutive day active)
          currentStreak += 1;
          localStorage.setItem("currentStreak", currentStreak.toString());
          localStorage.setItem("lastActiveDate", todayMidnight.toISOString());
        } else if (diffDays > 1) {
          // Missed one or more days - reset streak to 1 for today's activity
          currentStreak = 1;
          localStorage.setItem("currentStreak", "1");
          localStorage.setItem("lastActiveDate", todayMidnight.toISOString());
        } else if (diffDays < 0) {
          // Safety fallback for system clock changes
          localStorage.setItem("lastActiveDate", todayMidnight.toISOString());
        }
        // If diffDays === 0, it's the same day. Do nothing to the streak.
      } else {
        // No stored activity - initialize first day streak
        currentStreak = 1;
        localStorage.setItem("currentStreak", "1");
        localStorage.setItem("lastActiveDate", todayMidnight.toISOString());
      }

      setStreak(currentStreak);
      setIsActive(currentStreak > 0);
    } catch (error) {
      console.error("Failed to update daily streak:", error);
    }
  }, []);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold select-none border transition-all duration-300",
        isActive
          ? "text-orange-500 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-500/30 shadow-md shadow-orange-500/5 animate-pulse"
          : "text-zinc-400 bg-zinc-100 border-zinc-200 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-500",
        className
      )}
      title={
        isActive
          ? `Active learning streak: ${streak} days!`
          : "Start your daily learning streak today!"
      }
    >
      <Flame
        className={cn(
          "w-4 h-4 transition-transform duration-300",
          isActive
            ? "text-orange-500 fill-orange-500 scale-110 drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]"
            : "text-zinc-400 dark:text-zinc-600"
        )}
      />
      <span>
        {streak} Day{streak !== 1 ? "s" : ""} Streak
      </span>
    </div>
  );
}
