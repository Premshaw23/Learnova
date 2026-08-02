"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Users, Sparkles, MapPin, MessageSquare, Plus, User } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";

export default function StudyGroupsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    } else if (user) {
      fetchMatches();
    }
  }, [user, loading, router]);

  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/study-match");
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches);
      } else {
        toast.error(data.error || "Failed to fetch AI study matches");
      }
    } catch (error) {
      console.error("Failed to fetch matches", error);
      toast.error("An error occurred while finding study partners.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = (name) => {
    toast.success(`Connection request sent to ${name}!`);
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Matchmaking
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Study Groups</h1>
          <p className="text-zinc-400 max-w-2xl text-lg">
            Find the perfect study partners. Our AI analyzes your learning style, merits, and bio to suggest peers with complementary skills.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-64 animate-pulse flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-zinc-800 mb-4" />
                <div className="w-32 h-4 bg-zinc-800 rounded mb-2" />
                <div className="w-48 h-3 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => (
              <div 
                key={match.id}
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
                
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700 shadow-xl">
                      {match.photoURL ? (
                        <img src={match.photoURL} alt={match.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-zinc-100">{match.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        {match.location || "Remote"}
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-lg">
                    {match.meritPoints} Merits
                  </div>
                </div>

                <div className="bg-zinc-950/50 rounded-2xl p-4 mb-6 border border-zinc-800/50 relative">
                  <Sparkles className="w-4 h-4 text-indigo-400 absolute top-4 left-4" />
                  <p className="text-sm text-indigo-200/80 italic pl-6 leading-relaxed">
                    "{match.matchReason}"
                  </p>
                </div>

                <p className="text-zinc-400 text-sm flex-1 mb-6 line-clamp-3">
                  {match.bio}
                </p>

                <div className="flex items-center gap-3 mt-auto">
                  <button 
                    onClick={() => handleConnect(match.name)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Connect
                  </button>
                  <button 
                    onClick={() => toast("Chat interface coming soon!")}
                    className="w-12 h-12 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {matches.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-zinc-900/30 rounded-3xl border border-zinc-800/50 border-dashed">
                <Users className="w-16 h-16 text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold text-zinc-300 mb-2">No Matches Found</h3>
                <p className="text-zinc-500 max-w-md">
                  We couldn't find any study partners at the moment. Try updating your profile bio to help the AI find better matches!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
