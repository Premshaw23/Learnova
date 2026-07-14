"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { FileText, ShieldAlert, CheckCircle, Search, User, Calendar, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherAssignmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'teacher' && user.role !== 'admin'))) {
      router.push("/auth");
    } else if (user) {
      fetchAssignments();
    }
  }, [user, loading, router]);

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/assignments");
      const data = await res.json();
      if (data.success) {
        setAssignments(data.assignments);
      }
    } catch (error) {
      console.error("Failed to fetch assignments", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Assignment Submissions</h1>
          <p className="text-zinc-400 mt-2">Review student submissions and their AI-generated originality reports.</p>
        </header>

        <section>
          {assignments.length === 0 ? (
            <p className="text-zinc-500 italic bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/50 text-center">No assignments have been submitted yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => {
                const score = assignment.originalityScore;
                const isHighRisk = score < 60;
                
                return (
                  <div 
                    key={assignment._id} 
                    onClick={() => setSelectedAssignment(assignment)}
                    className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-indigo-500/5"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${isHighRisk ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                        {isHighRisk ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {score}% Original
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg text-zinc-200 line-clamp-1 mb-1">{assignment.title}</h3>
                    
                    <div className="space-y-2 mt-4 text-sm text-zinc-400">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="truncate">{assignment.studentName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(assignment.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Modal for detailed review */}
        <AnimatePresence>
          {selectedAssignment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setSelectedAssignment(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full"
              >
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                  <div>
                    <h2 className="text-xl font-bold">{selectedAssignment.title}</h2>
                    <p className="text-sm text-zinc-400 mt-1">Submitted by {selectedAssignment.studentName}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedAssignment(null)}
                    className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
                  {/* Left: Originality Report */}
                  <div className="w-full md:w-1/3 space-y-6">
                    <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        AI Analysis
                      </h3>
                      
                      <div className="text-center mb-6">
                        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${selectedAssignment.originalityScore < 60 ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}`}>
                          <span className="text-3xl font-black">{selectedAssignment.originalityScore}%</span>
                        </div>
                        <p className="mt-3 font-semibold text-zinc-300">Originality Score</p>
                      </div>

                      <div className="bg-zinc-900 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed border border-zinc-800/50">
                        {selectedAssignment.originalityReport}
                      </div>
                    </div>
                  </div>

                  {/* Right: Submitted Content */}
                  <div className="w-full md:w-2/3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
                      Submitted Text
                    </h3>
                    <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800 text-zinc-300 whitespace-pre-wrap leading-relaxed h-[400px] overflow-y-auto font-serif">
                      {selectedAssignment.content}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
