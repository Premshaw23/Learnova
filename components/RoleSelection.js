"use client";

import { Shield, Zap, Sparkles } from "lucide-react";
import { useRef } from "react";
import { ROLE_CONFIG } from "@/constants/userRoles";

const ROLE_GLOW = {
  student: "hover:border-blue-500/40 hover:shadow-blue-500/8",
  teacher: "hover:border-emerald-500/40 hover:shadow-emerald-500/8",
  institute: "hover:border-violet-500/40 hover:shadow-violet-500/8",
  admin: "hover:border-orange-500/40 hover:shadow-orange-500/8",
  parent: "hover:border-pink-500/40 hover:shadow-pink-500/8",
};

const FEATURES = [
  {
    icon: Shield,
    iconClass: "text-indigo-500 dark:text-indigo-400",
    title: "Secure Access",
    desc: "Role-based permissions with enterprise-grade security compliance.",
  },
  {
    icon: Zap,
    iconClass: "text-violet-500 dark:text-violet-400",
    title: "Real-time Sync",
    desc: "Instant updates synced seamlessly across all your devices.",
  },
  {
    icon: Sparkles,
    iconClass: "text-pink-500 dark:text-pink-400",
    title: "Custom Dashboard",
    desc: "Tailored layouts built for your role and platform activities.",
  },
];

export default function RoleSelection({ onRoleSelect }) {
  const containerRef = useRef(null);
  const handleKeyDown = (e) => {
    const cards = Array.from(containerRef.current.querySelectorAll("button[type='button']"));
    const index = cards.indexOf(document.activeElement);
    if (index === -1) return;
    if (e.key === "ArrowRight") {
      const nextIndex = (index + 1) % cards.length;
      cards[nextIndex].focus();
    } else if (e.key === "ArrowLeft") {
      const prevIndex = (index - 1 + cards.length) % cards.length;
      cards[prevIndex].focus();
    }
  };
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-10 text-center">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/8 blur-[100px] dark:bg-indigo-500/12" />
      <div className="pointer-events-none absolute left-1/4 top-3/4 h-64 w-64 -translate-y-1/2 rounded-full bg-violet-500/8 blur-[90px] dark:bg-violet-500/12" />

      {/* Heading */}
      <div className="relative z-10 mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/8 px-4 py-1.5 dark:border-indigo-400/20 dark:bg-indigo-400/10">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Get started
          </span>
          <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
            Required
          </span>
        </div>
        <h1 className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-pink-400 sm:text-5xl">
          Choose Your Role
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground">
          Select your portal to unlock your personalised Learnova dashboard and
          features.
        </p>
        <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-muted-foreground">
          Role selection is required before you can sign in or create an account.
        </p>
      </div>

      {/* Role cards */}
      <div ref={containerRef} onKeyDown={handleKeyDown} className="relative z-10 mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(ROLE_CONFIG).map(([role, config]) => {
          const glow =
            ROLE_GLOW[role] ??
            "hover:border-indigo-500/40 hover:shadow-indigo-500/8";
          return (
            <button
              key={role}
              type="button"
              onClick={() => onRoleSelect(role)}
              aria-label={`Select ${config.title} role`}
              className={`group relative flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${glow}`}
            >
              {/* Icon */}
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${config.color} shadow-md transition-transform duration-300 group-hover:scale-110`}
              >
                <config.icon className="h-7 w-7 text-white" />
              </div>

              {/* Text */}
              <h3 className="mb-2 text-base font-bold text-card-foreground transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {config.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {config.description}
              </p>

              {/* CTA pill — appears on hover */}
              <div
                aria-hidden="true"
                className={`mt-5 w-full rounded-xl bg-gradient-to-r ${config.color} py-2 text-sm font-semibold text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100`}
              >
                Select Role
              </div>
            </button>
          );
        })}
      </div>

      {/* Feature strip */}
      <div className="relative z-10 grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, iconClass, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-card p-5 text-left transition-all duration-200 hover:border-border/80 hover:shadow-sm"
          >
            <Icon className={`mb-3 h-8 w-8 ${iconClass}`} />
            <h4 className="mb-1 text-sm font-bold text-card-foreground">
              {title}
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
