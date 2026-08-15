"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Users, Search, BookOpen, Star, Plus, CheckCircle, ArrowRight, MessageCircle, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const MOCK_TUTORS = [
  { uid: "t1", name: "Alex Johnson", rating: 4.9, subjects: ["Mathematics", "Physics"], xp: 1250 },
  { uid: "t2", name: "Maria Garcia", rating: 4.8, subjects: ["Chemistry", "Biology"], xp: 980 },
  { uid: "t3", name: "Liam Chen", rating: 5.0, subjects: ["Computer Science", "Algebra"], xp: 1420 }
];

const MOCK_REQUESTS = [
  { id: "r1", studentName: "Emily Watson", subject: "Physics", question: "Can someone explain the difference between static and kinetic friction?", status: "pending" },
  { id: "r2", studentName: "Daniel Craig", subject: "Calculus", question: "Stuck on integrating by parts. Need help with this question: ∫ x * ln(x) dx.", status: "pending" }
];

export default function TutoringMarketplacePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tutors, setTutors] = useState(MOCK_TUTORS);
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  
  const [newQuestion, setNewQuestion] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isTutorMode, setIsTutorMode] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const handlePostRequest = (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setRequests([
        ...requests,
        {
          id: Date.now().toString(),
          studentName: user?.displayName || "Anonymous Student",
          subject: selectedSubject,
          question: newQuestion.trim(),
          status: "pending"
        }
      ]);
      setNewQuestion("");
      setSuccessMsg("Your tutoring request has been posted successfully!");
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    }, 800);
  };

  const handleAcceptRequest = (id) => {
    setRequests(requests.filter(r => r.id !== id));
    alert("Help request accepted! Loading live video and whiteboard session workspace...");
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-8">
        
        {/* Marketplace Banner Header */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 justify-center md:justify-start">
                Peer Tutoring Marketplace
              </h1>
              <p className="text-xs text-zinc-400 mt-1">Request quick help from peer student tutors or volunteer to earn extra XP.</p>
            </div>
          </div>

          <button
            onClick={() => setIsTutorMode(!isTutorMode)}
            className={`px-5 py-3 rounded-xl border font-bold text-xs transition-all ${
              isTutorMode 
                ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-400" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15"
            }`}
          >
            {isTutorMode ? "Switch to Student View" : "Volunteer as Tutor"}
          </button>
        </div>

        {/* Content columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {isTutorMode ? (
            /* TUTOR VIEW (Volunteer Dashboard - Left 2 Columns) */
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" /> Active Student Help Requests
              </h2>
              
              {requests.length === 0 ? (
                <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-zinc-300">All cleared!</p>
                  <p className="text-xs text-zinc-500 mt-1">There are no active help requests at this moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-xs px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold rounded-md">
                            {req.subject}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium">Requested by {req.studentName}</span>
                        </div>
                        <p className="text-sm font-semibold text-zinc-200 mt-2">&ldquo;{req.question}&rdquo;</p>
                      </div>
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="self-end px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        Accept & Start Session <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* STUDENT VIEW (Standard View - Left 2 Columns) */
            <div className="lg:col-span-2 space-y-8">
              
              {/* Request form */}
              <form onSubmit={handlePostRequest} className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" /> Request Quick Help
                </h2>
                <p className="text-xs text-zinc-400">Post a question to find an online peer tutor who can help you resolve it.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="What is your question or topic?"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                      required
                    />
                  </div>
                  <div>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none"
                    >
                      {["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Algebra"].map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {successMsg && (
                  <p className="text-xs text-emerald-400 font-bold bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> {successMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !newQuestion.trim()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all self-start"
                >
                  {isSubmitting ? "Posting..." : "Post Request"}
                </button>
              </form>

              {/* Tutors online grid */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" /> Online Peer Tutors
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tutors.map(tutor => (
                    <div key={tutor.uid} className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-zinc-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-sm font-bold text-zinc-200 truncate">{tutor.name}</h4>
                          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" /> {tutor.rating}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tutor.subjects.map(sub => (
                            <span key={sub} className="text-[9px] px-1.5 py-0.5 bg-zinc-950 text-zinc-500 border border-zinc-850 rounded">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Tutorial / Rewards Shelf (Right Column) */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" /> Tutor Rules
            </h2>
            <div className="bg-zinc-900/20 border border-zinc-850 p-6 rounded-3xl space-y-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Post details of questions</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Write a clear topic title to attract matching peer helpers.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Volunteers earn +50XP</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Tutors earn standard study XP upon resolving peer help requests.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Use Shared Canvas Workspace</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Help sessions integrate chat interfaces and whiteboards.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
