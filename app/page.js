"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, Award, MessageSquare, ShieldCheck, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";

// --- Mock Data & Constants ---
const STATS_ITEMS = [
  {
    id: "ring-3",
    number: 99.9,
    suffix: "%",
    label: "Platform Operational Uptime",
    href: "/metrics/uptime"
  },
  {
    id: "ring-2",
    number: 140,
    suffix: "ms",
    label: "Global API Response Latency",
    href: "/metrics/latency"
  },
  {
    id: "ring-1",
    number: 15,
    suffix: "M+",
    label: "Validated Data Transitions",
    href: null
  }
];

// --- High-Fidelity Child Components ---

// Wrapper component to handle reveals cleanly using Framer Motion
function Reveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Reusable Section Pill/Badge
function SectionBadge({ icon: Icon, text, gradient, borderClass, iconClass, textClass }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-gradient-to-r ${gradient} ${borderClass}`}>
      <Icon className={`w-4 h-4 ${iconClass}`} />
      <span className={`text-xs font-semibold tracking-wide uppercase ${textClass}`}>{text}</span>
    </div>
  );
}

// Reusable Premium Button
function ActionButton({ children, href }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center justify-center px-6 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black font-medium transition-all duration-300 hover:opacity-90 shadow-md hover:shadow-lg"
    >
      {children}
    </Link>
  );
}

// Smooth Number Counter
function AnimatedCounter({ to, suffix }) {
  // Simplistic presentation version. Can be powered by useMotionValue / useTransform if needed
  return (
    <span>
      {to}
      {suffix}
    </span>
  );
}

// Standalone Placeholder Comment System for the bottom section
function CommentSection() {
  const [comments, setComments] = useState([
    { id: 1, user: "Alex Rivers", role: "DevOps Architect", body: "The edge orbital rendering optimizations lowered our monitoring memory profiles significantly.", time: "2 hours ago" }
  ]);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      {
        id: Date.now(),
        user: "Anonymous Contributor",
        role: "System Engineer",
        body: newComment,
        time: "Just now"
      }
    ]);
    setNewComment("");
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 md:p-8 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-purple-500" />
        <h3 className="text-xl font-bold text-black dark:text-white">Engineering Logs & Discussion</h3>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Log architectural feedback or system observations..."
          rows={3}
          className="w-full p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/30 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all text-black dark:text-white resize-none"
        />
        <div className="mt-3 flex justify-end">
          <button type="submit" className="px-5 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors">
            Post Entry
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="p-4 rounded-xl bg-gray-50/50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/[0.02]">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-sm font-semibold text-black dark:text-white">{c.user}</span>
                <span className="text-xs text-muted-foreground ml-2">({c.role})</span>
              </div>
              <span className="text-[11px] text-zinc-400">{c.time}</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page Component ---
export default function Page() {
  const [hoveredRing, setHoveredRing] = useState(null);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground selection:bg-purple-500/30">
        <Navbar />
        
        {/* Premium Infographic Concentric Rings Stats Section */}
        <section
          id="stats"
          className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto relative">
            <div className="grid lg:grid-cols-12 gap-16 items-center">
              
              {/* Left Column: Contextual Messaging */}
              <Reveal className="lg:col-span-5 space-y-6">
                <SectionBadge
                  icon={TrendingUp}
                  text="System Metrics"
                  gradient="from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20"
                  borderClass="border-blue-200/50 dark:border-blue-500/30"
                  iconClass="text-blue-500"
                  textClass="text-blue-700 dark:text-blue-300"
                />
                <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white tracking-tight">
                  Measurable Operational Footprint
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Hover over the tracking orbits to review our architectural benchmarks. We maintain precise validation layers across institutional hubs to maximize productivity outcomes.
                </p>
                <div className="pt-4 flex flex-wrap gap-4">
                  <ActionButton href="/case-studies/impact">
                    View Impact Reports
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </ActionButton>
                </div>
              </Reveal>

              {/* Right Column: High-Fidelity Orbital Interactive Diagrams */}
              <Reveal className="lg:col-span-7 flex flex-col md:flex-row items-center justify-center gap-12" delay={0.1}>
                
                {/* Concentric Interactive Rings Diagram Container */}
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center bg-black/5 dark:bg-white/[0.02] rounded-full border border-gray-200/50 dark:border-white/5 backdrop-blur-sm shadow-inner">
                  
                  {/* Outer Orbital Layer - Ring 3 */}
                  <div 
                    onMouseEnter={() => setHoveredRing(0)}
                    onMouseLeave={() => setHoveredRing(null)}
                    className={`absolute rounded-full border-2 border-dashed transition-all duration-700 cursor-pointer flex items-center justify-center
                      ${hoveredRing === 0 
                        ? "w-[95%] h-[95%] border-purple-500 bg-purple-500/[0.02] scale-105 rotate-45" 
                        : "w-[90%] h-[90%] border-purple-500/20 dark:border-purple-500/10"
                      }`}
                  />

                  {/* Middle Orbital Layer - Ring 2 */}
                  <div 
                    onMouseEnter={() => setHoveredRing(1)}
                    onMouseLeave={() => setHoveredRing(null)}
                    className={`absolute rounded-full border border-double transition-all duration-700 cursor-pointer flex items-center justify-center
                      ${hoveredRing === 1 
                        ? "w-[75%] h-[75%] border-blue-400 bg-blue-500/[0.02] -rotate-45" 
                        : "w-[70%] h-[70%] border-blue-500/20 dark:border-blue-500/10"
                      }`}
                  />

                  {/* Inner Orbital Layer - Ring 1 */}
                  <div 
                    onMouseEnter={() => setHoveredRing(2)}
                    onMouseLeave={() => setHoveredRing(null)}
                    className={`absolute rounded-full border transition-all duration-700 cursor-pointer flex items-center justify-center
                      ${hoveredRing === 2 
                        ? "w-[55%] h-[55%] border-emerald-400 bg-emerald-500/[0.02] scale-95" 
                        : "w-[50%] h-[50%] border-emerald-500/20 dark:border-emerald-500/10"
                      }`}
                  />

                  {/* Core Dynamic Focal Node */}
                  <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-xl transition-transform duration-500 hover:scale-110 flex items-center justify-center">
                    <div className="w-full h-full bg-background rounded-full flex flex-col items-center justify-center text-center p-2">
                      <Award className="w-6 h-6 text-purple-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Live</span>
                    </div>
                  </div>
                </div>

                {/* Grid-List Metrics - Fixed via "group" utility for item highlights */}
                <div className="flex-1 w-full space-y-4">
                  {STATS_ITEMS.map((stat, idx) => {
                    const isSelected = hoveredRing === idx;
                    return (
                      <div
                        key={stat.id}
                        onMouseEnter={() => setHoveredRing(idx)}
                        onMouseLeave={() => setHoveredRing(null)}
                        className={`group block p-4 rounded-2xl border transition-all duration-500 cursor-pointer
                          ${isSelected 
                            ? "bg-purple-50/60 dark:bg-purple-900/10 border-purple-500/40 translate-x-2 shadow-sm" 
                            : "bg-white/50 dark:bg-black/20 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10"
                          }`}
                      >
                        {stat.href ? (
                          <Link href={stat.href} className="focus:outline-none">
                            <div className="text-2xl font-black text-black dark:text-white transition-colors duration-300 group-hover:text-purple-500 dark:group-hover:text-purple-400">
                              <AnimatedCounter to={stat.number} suffix={stat.suffix} />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1">
                              {stat.label}
                              <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-purple-500 dark:text-purple-400" />
                            </p>
                          </Link>
                        ) : (
                          <div>
                            <div className="text-2xl font-black text-black dark:text-white transition-colors duration-300 group-hover:text-purple-500 dark:group-hover:text-purple-400">
                              <AnimatedCounter to={stat.number} suffix={stat.suffix} />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground mt-1">
                              {stat.label}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </Reveal>
            </div>
          </div>
        </section>

        {/* Comment Section Block */}
        <section id="comments" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <CommentSection />
          </Reveal>
        </section>
      </div>
    </>
  );
}