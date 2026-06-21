"use client";

import { useCallback, useRef, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useAuth } from "@/hooks/useAuth";

export function useRealtimeAttendance({ classFilter } = {}) {
  const { user } = useAuth();
  const [liveCheckIns, setLiveCheckIns] = useState([]);
  const maxEntriesRef = useRef(50);

  const handleAttendance = useCallback((payload) => {
    const record = {
      id: payload._id || payload.id || crypto.randomUUID(),
      studentId: payload.userId || payload.studentId,
      studentName: payload.studentName || "Unknown",
      className: payload.className || payload.subject || "General",
      status: payload.status || "present",
      timestamp: payload.timestamp || payload.date || new Date().toISOString(),
      confidenceScore: payload.confidenceScore,
    };

    if (classFilter && record.className !== classFilter) return;

    setLiveCheckIns((prev) => {
      const exists = prev.some(
        (c) => c.studentId === record.studentId && c.timestamp === record.timestamp
      );
      if (exists) return prev;
      const next = [record, ...prev];
      return next.slice(0, maxEntriesRef.current);
    });
  }, [classFilter]);

  useRealtime(
    { onAttendance: handleAttendance },
    { enabled: !!user }
  );

  const clearCheckIns = useCallback(() => setLiveCheckIns([]), []);

  return { liveCheckIns, clearCheckIns };
}
