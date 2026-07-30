"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Calendar, Plus, Trash2, Sparkles, Loader2, BookOpen, Clock, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function StudyPlannerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState(["Mathematics", "Physics"]);
  const [newSubject, setNewSubject] = useState("");
  const [examDates, setExamDates] = useState({});
  const [schedule, setSchedule] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const addSubject = () => {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const removeSubject = (sub) => {
    setSubjects(subjects.filter(s => s !== sub));
    const updatedDates = { ...examDates };
    delete updatedDates[sub];
    setExamDates(updatedDates);
  };

  const handleDateChange = (sub, date) => {
    setExamDates({ ...examDates, [sub]: date });
  };

  const generatePlan = async () => {
    if (subjects.length === 0) {
      setError("Please add at least one subject.");
      return;
    }
    setError("");
    setIsGenerating(true);
    setSchedule(null);

    try {
      const res = await fetch("/api/study-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects, examDates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");
      if (data.schedule) setSchedule(data.schedule);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Planner Inputs (Left Panel) */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-indigo-400" /> AI Study Scheduler
            </h2>
            <p className="text-xs text-zinc-400 mb-6">
              Enter your active subjects and upcoming exam dates. Our planner uses AI to balance study times.
            </p>

            <div className="space-y-4">
              {/* Add Subject input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. chemistry"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50 text-zinc-200"
                />
                <button
                  onClick={addSubject}
                  className="p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl transition-all"
                >
                  <Plus className="w-5 h-5 text-indigo-400" />
                </button>
              </div>

              {/* Subject Config List */}
              <div className="space-y-3 mt-4 max-h-60 overflow-y-auto pr-1">
                {subjects.map(sub => (
                  <div key={sub} className="bg-zinc-950 p-4 border border-zinc-850 rounded-2xl flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400" /> {sub}
                      </span>
                      <button onClick={() => removeSubject(sub)} className="text-zinc-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase">Exam Date</span>
                      <input
                        type="date"
                        value={examDates[sub] || ""}
                        onChange={(e) => handleDateChange(sub, e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs focus:outline-none text-zinc-300"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs mt-2 bg-red-500/5 p-3 border border-red-500/10 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={generatePlan}
                disabled={isGenerating || subjects.length === 0}
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/15"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Generate Smart Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Viewport (Right Panel) */}
        <div className="w-full lg:w-2/3 flex flex-col">
          {!schedule && !isGenerating ? (
            <div className="flex-1 bg-zinc-900/10 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-12 text-center backdrop-blur-xl">
              <Calendar className="w-16 h-16 text-zinc-700 mb-4" />
              <h3 className="text-xl font-bold text-zinc-500 mb-2">No Calendar Generated</h3>
              <p className="text-zinc-600 text-sm max-w-sm">Enter your topics on the left and tap generate to see your optimal daily timeline.</p>
            </div>
          ) : isGenerating ? (
            <div className="flex-1 bg-zinc-900/10 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-12 text-center backdrop-blur-xl">
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
              <h3 className="text-xl font-bold text-indigo-400 mb-2">Mapping your syllabus workload...</h3>
              <p className="text-zinc-500 text-sm">AI is building calendar study blocks to prevent cramming.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Your Optimal Study Schedule</h3>
                <span className="text-xs px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded-full">Active Plan</span>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {schedule.map((dayBlock, idx) => (
                  <div key={idx} className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
                    <h4 className="font-bold text-md text-zinc-200 mb-3 border-b border-zinc-800 pb-2">{dayBlock.day}</h4>
                    <div className="space-y-2">
                      {dayBlock.tasks.map((task, tIdx) => (
                        <div key={tIdx} className="flex justify-between items-center bg-zinc-950/40 p-3.5 border border-zinc-850 rounded-xl">
                          <span className="text-sm text-zinc-300 font-medium flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-zinc-500" /> {task}
                          </span>
                          <span className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
                            <Clock className="w-3.5 h-3.5" /> Allocated Block
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
