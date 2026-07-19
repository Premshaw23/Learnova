"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { GraduationCap, Sparkles, MessageSquare, Star, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";

export default function MentorshipPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    } else if (user) {
      fetchMentors();
    }
  }, [user, loading, router]);

  const fetchMentors = async () => {
    try {
      const res = await fetch("/api/mentors");
      const data = await res.json();
      if (data.success) {
        setMentors(data.mentors);
      } else {
        toast.error(data.error || "Failed to fetch mentors");
      }
    } catch (error) {
      console.error("Failed to fetch mentors", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestMentorship = (name) => {
    toast.success(`Mentorship request sent to ${name}!`, { icon: '🎓' });
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-6">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 flex justify-center items-center gap-3">
            Skill-based Mentorship
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Connect with top Learnova seniors and alumni. Find guidance, ask questions, and accelerate your learning journey.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 h-64 animate-pulse flex flex-col justify-center">
                <div className="w-16 h-16 rounded-full bg-zinc-800 mb-4" />
                <div className="w-32 h-6 bg-zinc-800 rounded mb-4" />
                <div className="w-full h-4 bg-zinc-800 rounded mb-2" />
                <div className="w-3/4 h-4 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mentors.map((mentor, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={mentor.id}
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 hover:border-emerald-500/30 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
                
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-xl font-bold shadow-inner uppercase">
                    {mentor.name.substring(0, 2)}
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/20">
                    <Star className="w-3 h-3 fill-current" />
                    Top Mentor
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-zinc-100 mb-1">{mentor.name}</h3>
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {mentor.xp} XP
                </p>
                
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed flex-1">
                  "{mentor.bio}"
                </p>

                <div className="space-y-2 mb-6">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Expertise</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {mentor.skills?.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 bg-zinc-800/50 border border-zinc-700 rounded-lg text-xs text-zinc-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => requestMentorship(mentor.name)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white font-semibold py-3 rounded-xl transition-all border border-emerald-600/30 hover:border-emerald-600 mt-auto"
                >
                  <MessageSquare className="w-4 h-4" /> Request Mentorship
                </button>
              </motion.div>
            ))}

            {mentors.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-zinc-900/30 rounded-3xl border border-zinc-800/50 border-dashed">
                <GraduationCap className="w-16 h-16 text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold text-zinc-300 mb-2">No Mentors Available</h3>
                <p className="text-zinc-500 max-w-md">
                  Check back later when more seniors opt into the mentorship program.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
