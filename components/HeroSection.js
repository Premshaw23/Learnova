"use client";

import { useState } from "react";
import { Shield, Zap, Sparkles, CheckCircle } from "lucide-react";

const FEATURES = [
  {
    icon: Shield,
    iconClass: "text-indigo-500 dark:text-indigo-400",
    bgClass: "bg-indigo-500/8 dark:bg-indigo-400/10",
    title: "Enterprise Security",
    desc: "Bank-level encryption and security protocols to protect your data.",
  },
  {
    icon: Zap,
    iconClass: "text-violet-500 dark:text-violet-400",
    bgClass: "bg-violet-500/8 dark:bg-violet-400/10",
    title: "Lightning Fast",
    desc: "Instant sync across all your devices with real-time updates.",
  },
  {
    icon: Sparkles,
    iconClass: "text-pink-500 dark:text-pink-400",
    bgClass: "bg-pink-500/8 dark:bg-pink-400/10",
    title: "Role-Based Access",
    desc: "Customised dashboards and features based on your role.",
  },
];

const STATS = [
  { value: "10k+", label: "Active users" },
  { value: "99.9%", label: "Uptime" },
  { value: "50+", label: "Institutions" },
];

export default function HeroSection({ selectedRole }) {
  const [activeFeature, setActiveFeature] = useState(null);

  return (
    <div className="flex flex-col gap-8">
      {/* Heading block */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/8 px-4 py-1.5 dark:border-indigo-400/20 dark:bg-indigo-400/10">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Premium Access
          </span>
        </div>

        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
          Transforming{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-pink-400">
            Education
          </span>
        </h1>

        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
          Join thousands of{" "}
          {selectedRole === "student" ? "students" : "professionals"} who trust
          our platform for secure attendance management and seamless academic
          workflows.
        </p>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6">
        {STATS.map(({ value, label }, i) => (
          <div key={label} className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-extrabold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            {i < STATS.length - 1 && (
              <div className="h-8 w-px bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {FEATURES.map(({ icon: Icon, iconClass, bgClass, title, desc }, i) => (
          <div
            key={title}
            tabIndex={0}
            role="article"
            onFocus={() => setActiveFeature(i)}
            onBlur={() => setActiveFeature(null)}
            onMouseEnter={() => setActiveFeature(i)}
            onMouseLeave={() => setActiveFeature(null)}
            className={`group cursor-default rounded-2xl border p-5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeFeature === i
                ? "border-indigo-500/30 bg-card shadow-md shadow-indigo-500/5"
                : "border-border bg-card hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/5"
            }`}
          >
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${bgClass}`}>
              <Icon className={`h-5 w-5 ${iconClass}`} />
            </div>
            <h3 className="mb-1 text-sm font-bold text-card-foreground">{title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      {/* Trust line */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
        <span>Trusted by institutions across the country — no credit card required.</span>
      </div>
    </div>
  );
}
