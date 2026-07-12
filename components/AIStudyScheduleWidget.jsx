"use client";

import React, { useState } from "react";
import { Brain, Calendar, Clock, BookOpen, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function AIStudyScheduleWidget({ user }) {
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);

  const generateSchedule = async () => {
    if (!user) {
      toast.error("Please login to generate a schedule.");
      return;
    }
    
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/study-schedule/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setScheduleData(data.data);
        toast.success("Study schedule generated!");
      } else {
        toast.error(data.error || "Failed to generate schedule.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while generating the schedule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground dark:text-white">AI Study Schedule</h3>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Personalized weekly timetable</p>
          </div>
        </div>

        <button
          onClick={generateSchedule}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {scheduleData ? "Regenerate" : "Generate"}
        </button>
      </div>

      <div className="relative z-10 min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Brain className="w-10 h-10 animate-pulse text-indigo-400 mb-4" />
            <p className="text-sm">Analyzing deadlines and learning gaps...</p>
          </div>
        ) : scheduleData ? (
          <div className="space-y-4">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-sm text-indigo-200">
              <span className="font-semibold">Weekly Goal:</span> {scheduleData.weeklyGoal}
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {scheduleData.schedule?.map((dayPlan, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 font-semibold mb-3 text-indigo-300">
                    <Calendar className="w-4 h-4" />
                    {dayPlan.day}
                  </div>
                  <div className="space-y-2">
                    {dayPlan.blocks?.length > 0 ? (
                      dayPlan.blocks.map((block, j) => (
                        <div key={j} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-black/20 rounded-lg gap-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200">{block.subject}</span>
                            <span className="text-xs text-gray-400">{block.topic}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                              <BookOpen className="w-3 h-3" />
                              {block.type}
                            </div>
                            <div className="flex items-center gap-1 font-mono bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded-md">
                              <Clock className="w-3 h-3" />
                              {block.time}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic px-2">Rest Day</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <Calendar className="w-8 h-8 mb-3 opacity-50" />
            <p className="text-sm text-center px-6">
              Let AI analyze your upcoming deadlines and past performance to create an optimal study plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
