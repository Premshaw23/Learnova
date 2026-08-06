"use client";

import React, { useState, useEffect } from "react";
import { Users, Globe, BookOpen, Clock, CheckCircle, Search, MessageCircle } from "lucide-react";

/**
 * StudyGroupMatcher Component
 * 
 * Automatically clusters 4-6 students into an intimate study group based on 
 * their geographic timezone, pace of progression, and baseline assessment scores.
 */
export default function StudyGroupMatcher() {
  const [matchState, setMatchState] = useState("idle"); // idle, searching, matched
  const [progress, setProgress] = useState(0);
  const [matchedGroup, setMatchedGroup] = useState(null);

  const startMatching = () => {
    setMatchState("searching");
    setProgress(0);

    // Simulate the algorithmic clustering process
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          clearInterval(interval);
          setMatchState("matched");
          
          // Generate mock group data
          setMatchedGroup({
            id: `GRP-${Math.floor(Math.random() * 9000) + 1000}`,
            timezone: "UTC-5 (EST)",
            focus: "Advanced Data Structures",
            members: [
              { name: "Sarah M.", role: "Peer", pace: "Fast", avatar: "bg-blue-500" },
              { name: "David K.", role: "Peer", pace: "Fast", avatar: "bg-green-500" },
              { name: "Elena R.", role: "Peer", pace: "Fast", avatar: "bg-purple-500" },
              { name: "Marcus T.", role: "Peer", pace: "Moderate", avatar: "bg-yellow-500" },
              { name: "You", role: "You", pace: "Fast", avatar: "bg-red-500" }
            ]
          });
          return 100;
        }
        return next;
      });
    }, 400);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto my-8">
      
      <div className="text-center mb-8">
        <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
          <Users size={32} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Dynamic Study Groups</h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          We'll automatically match you with 4-6 students based on your timezone, learning pace, and current module.
        </p>
      </div>

      {matchState === "idle" && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4 uppercase text-sm tracking-wider">Matching Criteria</h3>
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-gray-600 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <Globe className="text-blue-500" size={20} />
              <span className="font-medium">Timezone Proximity (UTC-5)</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <BookOpen className="text-green-500" size={20} />
              <span className="font-medium">Skill Level & Module Alignment</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <Clock className="text-purple-500" size={20} />
              <span className="font-medium">Pace of Progression</span>
            </div>
          </div>
          
          <button 
            onClick={startMatching}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Search size={20} /> Find My Study Group
          </button>
        </div>
      )}

      {matchState === "searching" && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div 
              className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"
            ></div>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-700 text-xl">
              {Math.floor(progress)}%
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Analyzing Cohort Data...</h3>
          <p className="text-gray-500 mt-2">Clustering peers with similar progression rates.</p>
        </div>
      )}

      {matchState === "matched" && matchedGroup && (
        <div className="bg-white rounded-xl border border-green-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-green-50 p-6 border-b border-green-100 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-gray-800">Group Found!</h3>
            <p className="text-green-700 font-medium">Welcome to {matchedGroup.id}</p>
          </div>
          
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-1"><Globe size={14}/> {matchedGroup.timezone}</span>
              <span className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-1"><BookOpen size={14}/> {matchedGroup.focus}</span>
            </div>

            <div className="space-y-3 mb-8">
              {matchedGroup.members.map((member, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${member.role === 'You' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold shadow-sm ${member.avatar}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                    {member.pace} Pace
                  </span>
                </div>
              ))}
            </div>

            <button className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2">
              <MessageCircle size={20} /> Enter Group Chat
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
