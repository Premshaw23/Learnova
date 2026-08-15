"use client";
import React, { useState, useEffect } from "react";
import { Trophy, Medal, Star, ArrowUp, Crown } from "lucide-react";

export default function LeagueLeaderboard() {
  const [leagues, setLeagues] = useState(null);
  const [activeLeague, setActiveLeague] = useState("gold");

  useEffect(() => {
    fetch("/api/leaderboard/leagues")
      .then(res => res.json())
      .then(data => {
        if (data.success) setLeagues(data.data);
      });
  }, []);

  if (!leagues) return <div className="p-4 bg-zinc-900 rounded-2xl animate-pulse h-64"></div>;

  const currentList = leagues[activeLeague] || [];

  return (
    <div className="bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl rounded-full bg-indigo-500 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="text-amber-400 w-6 h-6" />
            Weekly Leagues
          </h2>
          <p className="text-sm text-zinc-400">Compete globally and rank up your league!</p>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setActiveLeague("gold")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeLeague === 'gold' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Crown className="w-4 h-4" /> Gold
          </button>
          <button 
            onClick={() => setActiveLeague("silver")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeLeague === 'silver' ? 'bg-zinc-300/20 text-zinc-300 border border-zinc-400/30' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Medal className="w-4 h-4" /> Silver
          </button>
          <button 
            onClick={() => setActiveLeague("bronze")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeLeague === 'bronze' ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Star className="w-4 h-4" /> Bronze
          </button>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {currentList.map((student, index) => (
          <div key={student.id} className="flex items-center justify-between p-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 rounded-2xl transition-colors group">
            <div className="flex items-center gap-4">
              <span className={`font-bold w-6 text-center ${index === 0 ? 'text-amber-400 text-lg' : 'text-zinc-500'}`}>
                #{index + 1}
              </span>
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl border border-zinc-700">
                {student.avatar}
              </div>
              <span className="font-semibold">{student.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="font-mono font-bold text-indigo-400">{student.xp.toLocaleString()} XP</span>
              </div>
              {index < 2 && (
                <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold rounded flex items-center gap-1 border border-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUp className="w-3 h-3" /> Promotion Zone
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
