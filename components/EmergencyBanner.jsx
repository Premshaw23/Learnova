"use client";

import { useState, useEffect } from "react";
import { useNotices } from "@/contexts/FirestoreContext";
import { AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

export default function EmergencyBanner() {
  const { notices, loading } = useNotices();
  const { user } = useAuth();
  const [acknowledgedIds, setAcknowledgedIds] = useState(new Set());

  useEffect(() => {
    if (!user?.uid) return;
    try {
      const saved = localStorage.getItem(`emergencyAck_${user.uid}`);
      if (saved) {
        setAcknowledgedIds(new Set(JSON.parse(saved)));
      }
    } catch (err) {
      console.error("Failed to load acknowledged emergency notices", err);
    }
  }, [user]);

  const handleAcknowledge = (id) => {
    setAcknowledgedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(`emergencyAck_${user?.uid || "anon"}`, JSON.stringify([...next]));
      } catch (err) {}
      return next;
    });
  };

  if (loading || !notices) return null;

  const emergencyNotices = notices.filter(
    (n) => n.priority === "emergency" && !acknowledgedIds.has(n.id)
  );

  if (emergencyNotices.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center w-full shadow-2xl">
      <AnimatePresence>
        {emergencyNotices.map((notice) => (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="w-full bg-red-600 border-b border-red-700 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 text-white flex-1 min-w-0">
              <AlertTriangle className="h-6 w-6 flex-shrink-0 animate-pulse text-yellow-300" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base leading-tight truncate">
                  EMERGENCY ALERT: {notice.title}
                </p>
                <p className="text-xs sm:text-sm text-red-100 truncate mt-0.5">
                  {notice.content}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleAcknowledge(notice.id)}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors flex-shrink-0"
            >
              Acknowledge
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
