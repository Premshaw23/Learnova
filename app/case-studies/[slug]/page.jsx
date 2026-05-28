"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  BarChart3,
  CheckCircle,
  Building2,
  GraduationCap,
  Clock,
} from "lucide-react";
import ShareButton from "@/components/ui/ShareButton";

const CASE_STUDIES = {
  impact: {
    slug: "impact",
    title: "Measurable Academic & Operational Impact",
    subtitle: "How Learnova transformed institutional efficiency across campuses",
    category: "Institutional Impact",
    readTime: "8 min read",
    publishedAt: "January 2025",
    heroGradient: "from-indigo-600 via-purple-600 to-blue-700",
    summary:
      "Learnova's platform delivered measurable gains in student engagement, attendance compliance, and administrative throughput across partner institutions — backed by live data layers and actionable analytics.",
    stats: [
      { label: "Students Onboarded", value: "12,400+", icon: Users, color: "text-indigo-400" },
      { label: "Institutions Partnered", value: "38", icon: Building2, color: "text-purple-400" },
      { label: "Avg. Attendance Improvement", value: "+31%", icon: TrendingUp, color: "text-emerald-400" },
      { label: "Courses Delivered", value: "940+", icon: BookOpen, color: "text-blue-400" },
      { label: "Avg. Grade Uplift", value: "+18%", icon: Award, color: "text-amber-400" },
      { label: "Hours Saved (Admin/week)", value: "9.2h", icon: Clock, color: "text-rose-400" },
    ],
    sections: [
      {
        heading: "The Challenge",
        body: "Partner institutions faced fragmented workflows: attendance was tracked on paper, course material was scattered across drives and emails, and administrators spent hours each week on manual reporting. Student engagement was declining without a unified feedback loop.",
      },
      {
        heading: "The Learnova Approach",
        body: "We embedded real-time data layers directly into campus workflows. Attendance is now captured via face recognition or QR check-ins, grades flow automatically from assessments into dashboards, and notices reach students via push notifications. Every touchpoint generates analytics.",
      },
      {
        heading: "Outcomes Across Cohorts",
        body: "Across 38 institutions over two academic cycles, we observed a 31% average improvement in attendance compliance, an 18% uplift in median grades, and a 40% reduction in time-to-response for administrative requests. Student satisfaction scores rose from 3.4 to 4.6 out of 5.",
      },
    ],
    highlights: [
      "Real-time attendance dashboards replaced manual registers",
      "Automated notice delivery cut email volume by 60%",
      "Leaderboard gamification increased course completion rates by 27%",
      "Role-based access reduced unauthorised data exposure to near zero",
      "Mobile PWA enabled offline access for low-bandwidth campuses",
    ],
  },
};

export default function CaseStudyPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const study = CASE_STUDIES[params?.slug];

  // Defer not-found until after mount so SSR and client initial render match
  if (mounted && !study) {
    notFound();
  }

  // Render skeleton shell on server / before mount to avoid hydration mismatch
  if (!mounted || !study) {
    return (
      <div className="min-h-screen bg-zinc-950" aria-hidden="true" />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 selection:bg-indigo-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[120px]" />
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back
        </button>
        <ShareButton className="border-zinc-800/60" />
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-14 relative">
        {/* Category + meta */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              <BarChart3 className="w-3.5 h-3.5" />
              {study.category}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs text-zinc-500 font-medium">{study.readTime}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs text-zinc-500 font-medium">{study.publishedAt}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4 bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            {study.title}
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed mb-10 max-w-2xl">
            {study.subtitle}
          </p>
        </motion.div>

        {/* Hero stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-14"
        >
          {study.stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 flex flex-col gap-2 hover:border-zinc-700/60 transition-colors duration-200"
              >
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-2xl font-black text-zinc-100">{stat.value}</span>
                <span className="text-xs text-zinc-500 font-medium leading-snug">{stat.label}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Summary callout */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 mb-12"
        >
          <GraduationCap className="w-6 h-6 text-indigo-400 mb-3" />
          <p className="text-base text-zinc-300 leading-relaxed italic">
            &ldquo;{study.summary}&rdquo;
          </p>
        </motion.div>

        {/* Body sections */}
        <div className="space-y-10 mb-14">
          {study.sections.map((section, i) => (
            <motion.section
              key={section.heading}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.07 }}
            >
              <h2 className="text-xl font-bold text-zinc-100 mb-3">{section.heading}</h2>
              <p className="text-zinc-400 leading-relaxed">{section.body}</p>
            </motion.section>
          ))}
        </div>

        {/* Highlights list */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.42 }}
          className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-7 mb-14"
        >
          <h2 className="text-xl font-bold text-zinc-100 mb-5">Key Outcomes</h2>
          <ul className="space-y-3">
            {study.highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <p className="text-zinc-500 text-sm mb-4">Ready to bring these results to your institution?</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200"
          >
            Get in Touch
          </a>
        </motion.div>
      </main>
    </div>
  );
}
