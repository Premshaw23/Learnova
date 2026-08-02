"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { Users, Sparkles, MapPin, Award } from "lucide-react";

export default function StudyMatchPage() {
  const { token, userProfile } = useAuth();
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/study-match", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches || []);
      } else {
        toast.error(data.error || "Failed to fetch study matches");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && userProfile) {
      fetchMatches();
    }
  }, [token, userProfile]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Sparkles className="animate-pulse text-primary mb-4" size={48} />
        <h2 className="text-xl font-bold">AI is finding your perfect study partners...</h2>
        <p className="text-muted-foreground mt-2">Analyzing courses, learning speed, and timezone...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <Users size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Smart Study Matchmaking</h1>
          <p className="text-muted-foreground">AI-recommended peers based on your learning profile.</p>
        </div>
      </div>
      
      <div className="my-8">
        <button 
          onClick={fetchMatches}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          <Sparkles size={16} />
          Refresh Matches
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="p-8 border border-dashed rounded-xl text-center bg-card">
          <p className="text-muted-foreground">No matches found at the moment. Try updating your profile bio!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map(match => (
            <div key={match.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                  {match.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-sm font-semibold text-orange-500">
                    <Award size={14} />
                    {match.meritPoints || 0} XP
                  </div>
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin size={12} />
                    {match.location || 'Remote'}
                  </div>
                </div>
              </div>
              
              <h3 className="font-bold text-lg truncate" title={match.name}>{match.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2" title={match.bio}>{match.bio}</p>
              
              <div className="mt-auto pt-4 border-t border-border">
                <div className="bg-primary/5 text-primary text-sm p-3 rounded-lg flex items-start gap-2">
                  <Sparkles size={16} className="shrink-0 mt-0.5" />
                  <p className="italic">"{match.matchReason}"</p>
                </div>
              </div>
              
              <button 
                onClick={() => toast.success(`Invite sent to ${match.name}!`)}
                className="mt-4 w-full py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                Send Study Invite
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
