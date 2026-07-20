"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, TrendingDown, User, Star, AlertTriangle, ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function TeacherBehaviorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Modal state
  const [actionType, setActionType] = useState('merit'); // 'merit' or 'demerit'
  const [points, setPoints] = useState(5);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'teacher' && user.role !== 'admin'))) {
      router.push("/auth");
    } else if (user) {
      fetchStudents();
    }
  }, [user, loading, router]);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/behavior");
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Failed to fetch students", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmitPoints = async (e) => {
    e.preventDefault();
    if (!points || points <= 0) {
      toast.error("Please enter a valid number of points.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Updating student behavior points...");

    try {
      const res = await fetch("/api/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          studentId: selectedStudent.id, 
          type: actionType, 
          points: parseInt(points), 
          reason 
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`${points} ${actionType} points awarded!`, { id: loadingToast });
        setSelectedStudent(null);
        setReason("");
        setPoints(5);
        fetchStudents(); // Refresh data
      } else {
        toast.error(data.error || "Failed to update points", { id: loadingToast });
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
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Behavioral Tracking</h1>
          <p className="text-zinc-400 mt-2">Award merit points for positive behavior or demerit points for infractions.</p>
        </header>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-xl leading-5 bg-zinc-900/50 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
            placeholder="Search students by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(student => (
            <div 
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-zinc-800 mb-4 flex items-center justify-center overflow-hidden border-2 border-zinc-800/80">
                {student.photoURL ? (
                  <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-zinc-500" />
                )}
              </div>
              
              <h3 className="font-bold text-lg text-zinc-200">{student.name}</h3>
              <p className="text-xs text-zinc-500 mb-6 truncate w-full">{student.email}</p>
              
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl py-2 flex flex-col items-center">
                  <span className="text-green-500 font-bold text-xl">{student.meritPoints}</span>
                  <span className="text-[10px] text-green-400 uppercase tracking-wider font-semibold">Merits</span>
                </div>
                <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl py-2 flex flex-col items-center">
                  <span className="text-red-500 font-bold text-xl">{student.demeritPoints}</span>
                  <span className="text-[10px] text-red-400 uppercase tracking-wider font-semibold">Demerits</span>
                </div>
              </div>
            </div>
          ))}
          
          {filteredStudents.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
              No students found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Action Modal */}
        <AnimatePresence>
          {selectedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setSelectedStudent(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    Award Points
                  </h2>
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmitPoints} className="p-6 space-y-6">
                  <div className="text-center">
                    <p className="text-zinc-400 text-sm">Managing points for</p>
                    <p className="text-xl font-bold text-white mt-1">{selectedStudent.name}</p>
                  </div>

                  {/* Type Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setActionType('merit')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        actionType === 'merit' 
                          ? 'border-green-500 bg-green-500/10 text-green-400' 
                          : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <TrendingUp className="w-6 h-6" />
                      <span className="font-bold">Merit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType('demerit')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        actionType === 'demerit' 
                          ? 'border-red-500 bg-red-500/10 text-red-400' 
                          : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <TrendingDown className="w-6 h-6" />
                      <span className="font-bold">Demerit</span>
                    </button>
                  </div>

                  {/* Points Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Number of Points</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      required
                    />
                  </div>

                  {/* Reason Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Reason (Optional)</label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={actionType === 'merit' ? "e.g., Helping a classmate" : "e.g., Disrupting class"}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                      actionType === 'merit' 
                        ? 'bg-green-600 hover:bg-green-500 shadow-green-600/20' 
                        : 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                    } disabled:opacity-50`}
                  >
                    {isSubmitting ? "Updating..." : `Award ${points} ${actionType === 'merit' ? 'Merits' : 'Demerits'}`}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
