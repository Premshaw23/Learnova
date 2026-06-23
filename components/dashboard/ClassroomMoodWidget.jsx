"use client";

import { useState, useEffect } from "react";
import { Smile, Frown, Meh, Activity, UserCheck } from "lucide-react";

export default function ClassroomMoodWidget() {
  const [moodData, setMoodData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMoodData = async () => {
    try {
      const res = await fetch("/api/analytics/mood");
      if (res.ok) {
        const json = await res.json();
        setMoodData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoodData();
    const interval = setInterval(fetchMoodData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 flex flex-col items-center justify-center h-48 animate-pulse">
        <Activity className="w-8 h-8 text-blue-400 mb-2 opacity-50" />
        <span className="text-muted-foreground text-sm">Loading classroom focus metrics...</span>
      </div>
    );
  }

  if (!moodData || !moodData.recentActive) {
    return (
      <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-bold text-foreground dark:text-white">Live Classroom Focus</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-6">
          <UserCheck className="w-10 h-10 text-gray-500 mb-3 opacity-30" />
          <p className="text-sm text-gray-400 text-center px-4">
            No live data received yet. Students' devices will anonymously report aggregated mood and focus levels when using the face recognizer.
          </p>
        </div>
      </div>
    );
  }

  const { averageFocus, totalLogs, moodCounts } = moodData;
  const isGoodFocus = averageFocus >= 60;

  return (
    <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isGoodFocus ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
            <Activity className={`w-5 h-5 ${isGoodFocus ? 'text-green-400' : 'text-amber-400'}`} />
          </div>
          <div>
            <h3 className="font-bold text-foreground dark:text-white">Live Focus Index</h3>
            <p className="text-xs text-muted-foreground">Classroom Attention & Mood Analytics</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-mono text-gray-300">LIVE</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 relative z-10">
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-black/20 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="text-center">
            <span className={`text-4xl font-black ${isGoodFocus ? 'text-green-400' : 'text-amber-400'}`}>
              {averageFocus}%
            </span>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Focus Score</p>
          </div>
          
          <div className="w-full h-2 bg-gray-800 rounded-full mt-4 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isGoodFocus ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${averageFocus}%` }}
            />
          </div>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center p-3 bg-black/20 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
            <Smile className="w-5 h-5 text-green-400 mb-1" />
            <span className="text-sm font-bold text-white">{moodCounts['happy'] || moodCounts['surprised'] || 0}</span>
            <span className="text-[10px] text-gray-500 uppercase">Engaged</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-black/20 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
            <Meh className="w-5 h-5 text-blue-400 mb-1" />
            <span className="text-sm font-bold text-white">{moodCounts['neutral'] || 0}</span>
            <span className="text-[10px] text-gray-500 uppercase">Neutral</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-black/20 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
            <Frown className="w-5 h-5 text-red-400 mb-1" />
            <span className="text-sm font-bold text-white">
              {(moodCounts['sad'] || 0) + (moodCounts['angry'] || 0) + (moodCounts['fearful'] || 0) + (moodCounts['disgusted'] || 0)}
            </span>
            <span className="text-[10px] text-gray-500 uppercase">Distracted</span>
          </div>
        </div>
      </div>
      
      <p className="text-center text-[10px] text-gray-500 mt-4 relative z-10">
        *Based on {totalLogs} anonymous data points over the last 60 minutes
      </p>
    </div>
  );
}
