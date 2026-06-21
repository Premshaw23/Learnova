"use client";

import React from "react";
import { Flame, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";

const cardToneStyles = {
  positive: "border-green-500/30 bg-green-500/10 text-green-200",
  warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
  alert: "border-red-500/30 bg-red-500/10 text-red-200",
  neutral: "border-slate-500/20 bg-slate-900/70 text-slate-200",
};

const iconMap = {
  positive: Flame,
  warning: Sparkles,
  alert: AlertTriangle,
  neutral: ShieldCheck,
};

/**
 * MotivationalReminders Component
 *
 * Displays dynamic reminder cards based on real user dashboard data
 * Cards are generated from user activity, attendance, engagement metrics
 * NOT from mock data or hardcoded values
 *
 * @param {Array} cards - Array of reminder card objects with: id, tone, title, description
 * @param {String} title - Optional custom section title (default: "Motivational Reminders")
 * @param {String} subtitle - Optional custom section subtitle
 */
const MotivationalReminders = ({
  cards = [],
  title = "Stay consistent with your progress.",
  subtitle = "Personalized goals from your dashboard data",
}) => {
  if (!cards || cards.length === 0) {
    return null;
  }

  const descriptionTextClass = "text-gray-300";

  return (
    <section className="bg-black/30 border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gray-400">
            Motivational Reminders
          </p>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
          <Sparkles className="w-5 h-5 text-accent" />
          {subtitle}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = iconMap[card.tone] || ShieldCheck;
          return (
            <div
              key={card.id}
              className={`rounded-3xl border p-5 shadow-xl transition hover:-translate-y-1 motion-reduce:transform-none ${cardToneStyles[card.tone]}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-base font-semibold text-white">
                    {card.title}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-2 text-white">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className={`text-sm leading-6 ${descriptionTextClass}`}>
                {card.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MotivationalReminders;
