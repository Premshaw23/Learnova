"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { BarChart, CheckCircle2, Trophy, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import Confetti from "react-confetti";

export default function StudentPollsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    
    if (!loading && (!user || user.role !== 'student')) {
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

  const handleAnswer = async (pollId, answerIndex) => {
    const loadingToast = toast.loading("Submitting answer...");
    try {
      const res = await fetch("/api/polls/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, answerIndex })
      });
      const data = await res.json();

      if (data.success) {
        toast.dismiss(loadingToast);
        if (data.isCorrect) {
          toast.success(`Correct! You earned ${data.xpEarned} XP!`, { icon: '🎉' });
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        } else {
          toast.error("Incorrect answer. Better luck next time!");
        }
        fetchPolls(); // Refresh state
      } else {
        toast.error(data.error || "Failed to submit answer", { id: loadingToast });
      }
    } catch (error) {
      toast.error("An error occurred.", { id: loadingToast });
    }
  };

  if (loading || isLoading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={200} />}
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mb-6">
            <BarChart className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Live Polls</h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Answer active classroom polls in real-time to test your knowledge and earn XP!
          </p>
        </header>

        <div className="space-y-8">
          {polls.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
              <Clock className="w-12 h-12 text-zinc-600 mb-4" />
              <h3 className="text-xl font-bold text-zinc-400">No active polls</h3>
              <p className="text-zinc-600 mt-2">Waiting for the teacher to launch a poll...</p>
            </div>
          ) : (
            polls.map(poll => (
              <div key={poll.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <h2 className="text-2xl font-bold leading-tight flex-1 pr-6">{poll.question}</h2>
                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-xl text-sm font-bold border border-yellow-500/20">
                    <Trophy className="w-4 h-4" />
                    +{poll.xpReward} XP
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  {poll.options.map((opt, idx) => {
                    const isSelected = poll.submittedAnswer === idx;
                    let buttonClass = "w-full text-left px-6 py-4 rounded-xl border transition-all duration-200 ";
                    
                    if (poll.hasAnswered) {
                      if (isSelected) {
                        buttonClass += "bg-indigo-600/20 border-indigo-500 text-indigo-100 cursor-default";
                      } else {
                        buttonClass += "bg-zinc-800/30 border-zinc-800 text-zinc-500 cursor-default opacity-50";
                      }
                    } else {
                      buttonClass += "bg-zinc-800/50 border-zinc-700 hover:border-indigo-500 hover:bg-zinc-800 cursor-pointer";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => !poll.hasAnswered && handleAnswer(poll.id, idx)}
                        disabled={poll.hasAnswered}
                        className={buttonClass}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{opt}</span>
                          {poll.hasAnswered && isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {poll.hasAnswered && (
                  <div className="mt-6 text-center text-sm font-medium text-zinc-400">
                    Answer submitted. Waiting for teacher to close the poll.
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
