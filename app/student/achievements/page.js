"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Award, ShieldAlert, CheckCircle, Zap, Sparkles, Flame, Users, BookOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function StudentAchievementsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [badges, setBadges] = useState([
    { id: 1, title: "Focus Maestro", desc: "Clock in 10 focus hours in Pomodoro Study Rooms.", icon: Zap, color: "text-amber-400 bg-amber-500/10 border-amber-500/20", progress: 8, target: 10, unlocked: false },
    { id: 2, title: "Streak Champion", desc: "Keep a daily study streak for 7 consecutive days.", icon: Flame, color: "text-orange-500 bg-orange-500/10 border-orange-500/20", progress: 7, target: 7, unlocked: true },
    { id: 3, title: "Academic Ace", desc: "Maintain a grade point above 90% in 5 assignments.", icon: Award, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", progress: 3, target: 5, unlocked: false },
    { id: 4, title: "Helpful Peer", desc: "Complete 5 peer reviews on assignments.", icon: Users, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", progress: 5, target: 5, unlocked: true },
    { id: 5, title: "STEM Pioneer", desc: "Launch 5 interactive simulations in the STEM Lab.", icon: BookOpen, color: "text-pink-400 bg-pink-500/10 border-pink-500/20", progress: 1, target: 5, unlocked: false }
  ]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-8">
        
        {/* Achievements header panel */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Award className="w-9 h-9" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 justify-center md:justify-start">
                Badges & Milestones <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
              </h1>
              <p className="text-xs text-zinc-400 mt-1">Unlock badges by participating in classes, Pomodoro sessions, and lab simulations.</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center bg-zinc-950/60 px-5 py-3.5 border border-zinc-850 rounded-2xl">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Total Unlocked</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">{unlockedCount} / {badges.length}</p>
            </div>
            <div className="text-center bg-zinc-950/60 px-5 py-3.5 border border-zinc-850 rounded-2xl">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Level Progress</span>
              <p className="text-2xl font-extrabold text-indigo-400 mt-0.5">82%</p>
            </div>
          </div>
        </div>

        {/* Badges Grid View */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Your Badge Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.map(badge => (
              <div 
                key={badge.id} 
                className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${
                  badge.unlocked 
                    ? "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700" 
                    : "bg-zinc-900/10 border-zinc-900 opacity-60"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl border ${badge.color}`}>
                      <badge.icon className="w-6 h-6" />
                    </div>
                    {badge.unlocked ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-500 bg-zinc-950 border border-zinc-850 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> Locked
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-zinc-100 mb-1 leading-snug">{badge.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">{badge.desc}</p>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mb-1.5">
                    <span>Task Progress</span>
                    <span>{badge.progress} / {badge.target}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 border border-zinc-850 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${badge.unlocked ? "bg-emerald-500" : "bg-indigo-500"}`}
                      style={{ width: `${(badge.progress / badge.target) * 100}%` }}
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
