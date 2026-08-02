"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Compass, Sparkles, TrendingUp, CheckCircle2, Briefcase } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";

export default function CareerPathsPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  
  const [careers, setCareers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== 'student')) {
      router.push("/auth");
    } else if (user) {
      fetchCareers();
    }
  }, [user, userProfile, loading, router]);

  const fetchCareers = async () => {
    try {
      const res = await fetch("/api/career-recommend");
      const data = await res.json();
      if (data.success) {
        setCareers(data.careers);
      } else {
        toast.error(data.error || "Failed to fetch career recommendations");
      }
    } catch (error) {
      console.error("Failed to fetch careers", error);
      toast.error("An error occurred while finding career paths.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 mb-6">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 flex justify-center items-center gap-3">
            Career Pathfinder
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Discover dynamic career paths tailored just for you. Our AI analyzes your learning progress, XP, and merits to suggest the perfect future roles.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 h-72 animate-pulse flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 mb-4" />
                <div className="w-48 h-6 bg-zinc-800 rounded mb-4" />
                <div className="w-full h-4 bg-zinc-800 rounded mb-2" />
                <div className="w-3/4 h-4 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {careers.map((career, index) => (
              <div 
                key={index}
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 hover:border-cyan-500/30 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
                
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400 shadow-inner">
                  <Briefcase className="w-6 h-6" />
                </div>
                
                <h3 className="text-2xl font-bold text-zinc-100 mb-3">{career.title}</h3>
                
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed flex-1">
                  {career.description}
                </p>

                <div className="bg-zinc-950/50 rounded-2xl p-4 mb-6 border border-zinc-800/50">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Why it's a match
                  </div>
                  <p className="text-sm text-zinc-300 italic">
                    {career.matchReason}
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Key Skills to Learn</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {career.skillsRequired?.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-800/50 border border-zinc-700 rounded-lg text-xs text-zinc-300">
                        <CheckCircle2 className="w-3 h-3 text-cyan-500" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => toast.success("Course roadmap coming soon!")}
                  className="w-full bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white font-semibold py-3 rounded-xl transition-all border border-cyan-600/30 hover:border-cyan-600 mt-auto"
                >
                  View Learning Path
                </button>
              </div>
            ))}

            {careers.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-zinc-900/30 rounded-3xl border border-zinc-800/50 border-dashed">
                <Briefcase className="w-16 h-16 text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold text-zinc-300 mb-2">No Paths Generated</h3>
                <p className="text-zinc-500 max-w-md">
                  We couldn't generate career paths. Try refreshing the page.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
