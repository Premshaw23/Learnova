"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import AttendanceBadge from "./AttendanceBadge";

const AchievementSection = ({ attendancePercentage = 92, streakDays = 8 }) => {
  const badgeDefinitions = useMemo(
    () => [
      {
        id: "regular-attendee",
        icon: "✨",
        title: "Regular Attendee",
        description: "Maintain a strong presence across classes.",
        condition: "Attend 75% of sessions",
        threshold: 75,
        type: "percentage",
      },
      {
        id: "consistent-learner",
        icon: "📚",
        title: "Consistent Learner",
        description: "Stay engaged with steady attendance.",
        condition: "Attend 85% of sessions",
        threshold: 85,
        type: "percentage",
      },
      {
        id: "attendance-champion",
        icon: "🏆",
        title: "Attendance Champion",
        description: "Attendance is almost perfect this term.",
        condition: "Attend 95% of sessions",
        threshold: 95,
        type: "percentage",
      },
      {
        id: "perfect-presence",
        icon: "🌟",
        title: "Perfect Presence",
        description: "Every class attended with full dedication.",
        condition: "Attend 100% of sessions",
        threshold: 100,
        type: "percentage",
      },
      {
        id: "weekly-streak",
        icon: "🔥",
        title: "Weekly Streak",
        description: "Keep your attendance sharp all week.",
        condition: "7 consecutive days present",
        threshold: 7,
        type: "streak",
      },
    ],
    []
  );

  const badges = useMemo(
    () =>
      badgeDefinitions.map((badge) => {
        const value =
          badge.type === "streak" ? streakDays : attendancePercentage;
        const progress =
          badge.type === "streak"
            ? Math.min(100, (value / badge.threshold) * 100)
            : Math.min(100, (attendancePercentage / badge.threshold) * 100);

        return {
          ...badge,
          unlocked:
            badge.type === "streak"
              ? streakDays >= badge.threshold
              : attendancePercentage >= badge.threshold,
          progress,
        };
      }),
    [attendancePercentage, badgeDefinitions, streakDays]
  );

  const toastShown = useRef(false);

  useEffect(() => {
    if (toastShown.current) {
      return;
    }

    const unlockedBadges = badges.filter((badge) => badge.unlocked);
    const timers = unlockedBadges.map((badge, index) =>
      window.setTimeout(() => {
        toast.success(`Unlocked ${badge.title}!`, {
          icon: badge.icon,
        });
      }, index * 300)
    );

    toastShown.current = true;

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [badges]);

  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-black/40 backdrop-blur-2xl rounded-[28px] border border-white/10 p-6 shadow-2xl"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
            Achievements
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            Attendance Rewards & Progress
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Unlock badges as you improve your attendance. Each badge tracks the
            student’s current progress and rewards consistent learning habits.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-center shadow-xl shadow-cyan-500/10">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Achievements Unlocked
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {unlockedCount}/{badges.length}
          </p>
          <p className="text-sm text-slate-400">
            {attendancePercentage}% attendance · {streakDays} day streak
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {badges.map((badge) => (
          <AttendanceBadge key={badge.id} {...badge} />
        ))}
      </div>
    </motion.section>
  );
};

export default AchievementSection;
