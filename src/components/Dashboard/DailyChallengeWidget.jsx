"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { Zap, CheckCircle2, Clock, Play } from "lucide-react";

export default function DailyChallengeWidget() {
  const { token, refreshProfile } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/daily-challenge", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setChallenge(data.challenge);
          setIsCompleted(data.isCompleted);
        }
      } catch (err) {
        console.error("Failed to load daily challenge", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChallenge();
  }, [token]);

  const handleCompleteChallenge = async () => {
    if (isCompleted || isSubmitting) return;
    
    // In a real app, this would open a modal to actually DO the challenge.
    // For this implementation, we will simulate completing it instantly.
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/daily-challenge", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setIsCompleted(true);
        toast.success(`Challenge Completed! +${data.xpEarned} XP`);
        if (refreshProfile) await refreshProfile();
      } else {
        toast.error(data.error || "Failed to complete challenge.");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !challenge) return null;

  return (
    <div className={`p-5 rounded-xl border relative overflow-hidden transition-all ${
      isCompleted 
        ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900/50" 
        : "bg-gradient-to-br from-card to-muted border-border hover:shadow-md"
    }`}>
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isCompleted ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-orange-100 text-orange-500 dark:bg-orange-900/30"}`}>
            <Zap size={18} fill="currentColor" />
          </div>
          <h3 className="font-bold text-lg">Daily Micro-Challenge</h3>
        </div>
        
        {isCompleted ? (
          <span className="flex items-center gap-1 text-sm font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
            <CheckCircle2 size={14} /> Done
          </span>
        ) : (
          <span className="text-sm font-bold text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
            +{challenge.xpReward} XP
          </span>
        )}
      </div>

      <div className="mb-4">
        <h4 className={`font-semibold ${isCompleted ? "text-muted-foreground line-through" : ""}`}>
          {challenge.title}
        </h4>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {challenge.description}
        </p>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <Clock size={12} />
          Est. {challenge.duration}
        </div>
        
        {!isCompleted && (
          <button 
            onClick={handleCompleteChallenge}
            disabled={isSubmitting}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            <Play size={14} fill="currentColor" />
            {isSubmitting ? "Starting..." : "Start"}
          </button>
        )}
      </div>
      
      {/* Background decoration */}
      {!isCompleted && (
        <div className="absolute -bottom-6 -right-6 text-orange-500/5 rotate-12 pointer-events-none">
          <Zap size={120} fill="currentColor" />
        </div>
      )}
    </div>
  );
}
