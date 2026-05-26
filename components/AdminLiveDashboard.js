"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Users, MapPin, CheckCircle, Video, Clock } from "lucide-react";

// Mock classrooms since we don't have them in the DB yet
const CLASSROOMS = [
  { id: "Room A101", capacity: 40, color: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/30", text: "text-blue-400" },
  { id: "Room B204", capacity: 30, color: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/30", text: "text-purple-400" },
  { id: "Lab C3", capacity: 25, color: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30", text: "text-amber-400" },
  { id: "Lecture Hall 1", capacity: 100, color: "from-emerald-500/20 to-green-500/20", border: "border-emerald-500/30", text: "text-emerald-400" }
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Pseudo-randomly assign a classroom based on userId so it's consistent for the same user
const assignClassroom = (userId) => {
  if (!userId) return CLASSROOMS[0];
  const charCode = userId.charCodeAt(0) || 0;
  return CLASSROOMS[charCode % CLASSROOMS.length];
};

export default function AdminLiveDashboard() {
  const [records, setRecords] = useState([]);
  const [classStats, setClassStats] = useState({});
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const today = getTodayKey();
    const q = query(
      collection(db, "attendance_records"),
      where("date", "==", today)
    );

    setIsListening(true);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRecords = [];
      const stats = {};

      // Initialize stats
      CLASSROOMS.forEach(c => {
        stats[c.id] = 0;
      });

      snapshot.forEach((doc) => {
        const data = doc.data();
        const record = { id: doc.id, ...data };
        
        // Mock classroom assignment
        const room = assignClassroom(data.userId);
        record.classroom = room;
        stats[room.id] += 1;
        
        newRecords.push(record);
      });

      // Sort by timestamp descending (newest first)
      newRecords.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      setRecords(newRecords);
      setClassStats(stats);
    });

    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-foreground dark:text-white p-6 md:p-10 font-sans relative overflow-hidden">
      {/* Background Ambient Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Live Campus View
            </h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-2 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Real-time attendance telemetry
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-border dark:border-white/10 px-5 py-3 rounded-2xl shadow-xl">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
            <div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider font-semibold">Total Check-ins Today</p>
              <p className="text-2xl font-bold text-foreground dark:text-white leading-none mt-1">{records.length}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Classrooms Grid */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-indigo-400" />
              Active Classrooms
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {CLASSROOMS.map((room) => {
                const currentCount = classStats[room.id] || 0;
                const percentage = Math.min(100, Math.round((currentCount / room.capacity) * 100));
                
                return (
                  <motion.div 
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gradient-to-br ${room.color} backdrop-blur-xl border ${room.border} rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className={`text-xl font-bold ${room.text}`}>{room.id}</h3>
                        <p className="text-sm text-muted-foreground dark:text-gray-300 mt-1 flex items-center gap-1">
                          <Users className="w-4 h-4 opacity-70" />
                          Capacity: {room.capacity}
                        </p>
                      </div>
                      <div className="bg-black/30 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/5">
                        <span className="text-2xl font-black text-foreground dark:text-white">{currentCount}</span>
                        <span className="text-muted-foreground dark:text-gray-400 text-sm ml-1">/ {room.capacity}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mt-6">
                      <div className="flex justify-between text-xs font-semibold text-muted-foreground dark:text-gray-300">
                        <span>Occupancy Rate</span>
                        <span className={room.text}>{percentage}%</span>
                      </div>
                      <div className="w-full bg-card/40 dark:bg-black/40 rounded-full h-2.5 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full bg-gradient-to-r ${room.color.replace('20', '80')} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Live Feed Sidebar */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Video className="w-6 h-6 text-pink-400" />
              Live Feed
            </h2>
            
            <div className="bg-white/5 backdrop-blur-xl border border-border dark:border-white/10 rounded-3xl p-1 shadow-2xl overflow-hidden h-[600px] flex flex-col relative">
              <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none rounded-t-3xl" />
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar scroll-smooth">
                <AnimatePresence initial={false}>
                  {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                      <Clock className="w-12 h-12 opacity-20" />
                      <p>Waiting for check-ins...</p>
                    </div>
                  ) : (
                    records.slice(0, 50).map((record) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        className="bg-card/40 dark:bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-foreground dark:text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground dark:text-white truncate text-sm">
                            {record.studentName || record.email || "Unknown User"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className={`${record.classroom?.text || "text-muted-foreground dark:text-gray-400"} font-medium bg-white/5 px-2 py-0.5 rounded-md`}>
                              {record.classroom?.id || "Unknown"}
                            </span>
                            <span className="text-gray-500">
                              {record.timestamp?.seconds 
                                ? new Date(record.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                : "Just now"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
              
              <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none rounded-b-3xl" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
