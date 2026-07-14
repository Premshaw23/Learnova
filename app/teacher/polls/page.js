"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { BarChart, Plus, Trash2, CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";

export default function TeacherPollsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [xpReward, setXpReward] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'teacher' && user.role !== 'admin'))) {
      router.push("/auth");
    } else if (user) {
      fetchPolls();
    }
  }, [user, loading, router]);

  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/polls");
      const data = await res.json();
      if (data.success) {
        setPolls(data.polls);
      }
    } catch (error) {
      console.error("Failed to fetch polls", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOption = () => {
    if (options.length < 5) setOptions([...options, ""]);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
      if (correctAnswerIndex === index) setCorrectAnswerIndex(0);
      else if (correctAnswerIndex > index) setCorrectAnswerIndex(correctAnswerIndex - 1);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (options.some(opt => !opt.trim())) {
      toast.error("All options must be filled.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Launching poll...");

    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, options, correctAnswerIndex, xpReward }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Poll launched successfully!", { id: loadingToast });
        setIsCreating(false);
        setQuestion("");
        setOptions(["", ""]);
        setCorrectAnswerIndex(0);
        fetchPolls();
      } else {
        toast.error(data.error || "Failed to launch poll", { id: loadingToast });
      }
    } catch (error) {
      toast.error("An error occurred.", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart className="w-8 h-8 text-indigo-400" />
              Live Classroom Polls
            </h1>
            <p className="text-zinc-400 mt-2">Create gamified polls to engage your students in real-time.</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Launch New Poll
          </button>
        </header>

        {isCreating && (
          <div className="bg-zinc-900 border border-indigo-500/30 rounded-3xl p-8 relative shadow-2xl">
            <button 
              onClick={() => setIsCreating(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6">Create Gamified Poll</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Question</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500/50"
                  required
                  placeholder="e.g., What is the powerhouse of the cell?"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-zinc-300">Options (Select the correct one)</label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCorrectAnswerIndex(idx)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        correctAnswerIndex === idx ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500/50"
                      required
                      placeholder={`Option ${idx + 1}`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-indigo-400 font-medium text-sm hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Option
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">XP Reward for Correct Answer</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                  className="w-full md:w-1/3 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Launching..." : "Launch Poll Now"}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-xl font-bold">Active Polls</h2>
          {polls.length === 0 ? (
            <div className="py-12 text-center border border-zinc-800 rounded-3xl bg-zinc-900/30 text-zinc-500">
              No active polls. Create one above to engage your students!
            </div>
          ) : (
            polls.map(poll => {
              const compPercent = poll.totalResponses > 0 
                ? Math.round((poll.correctResponses / poll.totalResponses) * 100) 
                : 0;

              return (
                <div key={poll.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{poll.question}</h3>
                    <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-lg text-sm font-bold">
                      {compPercent}% Comprehension
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {poll.options.map((opt, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-xl border ${poll.correctAnswerIndex === idx ? 'bg-green-500/10 border-green-500/50 text-green-300' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400'}`}
                      >
                        {opt}
                        {poll.correctAnswerIndex === idx && <span className="float-right"><CheckCircle2 className="w-5 h-5" /></span>}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-800 text-sm text-zinc-500 flex justify-between">
                    <span>{poll.totalResponses} Total Responses</span>
                    <span>Reward: {poll.xpReward} XP</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
