"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { getTodayKeyLocal } from "@/lib/dateUtils";
import { getUserActivities } from "@/services/activityService";
import { apiFetch } from "@/lib/apiClient";

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const unwrapApiPayload = (payload) => {
  if (
    isRecord(payload) &&
    payload.success === true &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  ) {
    return payload.data;
  }

  return payload;
};

export const useAttendance = ({ role, user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // student
  const [recentActivity, setRecentActivity] = useState([]);
  const [gamificationData, setGamificationData] = useState(null);

  // teacher
  const [attendanceStats, setAttendanceStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    averageAttendance: 0,
  });
  const [studentAttendanceData, setStudentAttendanceData] = useState([]);

  // institute
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    todayAttendance: 0,
    weeklyTrend: "",
    activeClasses: 0,
    pendingRequests: 0,
  });
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attendanceRequests, setAttendanceRequests] = useState([]);
  const [hasMoreRequests, setHasMoreRequests] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // --- student fetchers ---
  const fetchStudentActivity = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const activities = await getUserActivities(user.uid);
      const mapped = activities.map((a) => ({
        subject: a.title,
        date: a.timestamp?.toLocaleDateString() || "",
        status: a.progress >= 100 ? "present" : "late",
      }));
      setRecentActivity(mapped);
    } catch (err) {
      console.error("Failed to load activity", err);
    }
  }, [user?.uid]);

  const fetchGamification = useCallback(async () => {
    if (!user) return;
    const controller = new AbortController();
    try {
      const token = await user.getIdToken();
      const res = await apiFetch("/api/student/gamification", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      setGamificationData(unwrapApiPayload(res));
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Failed to load gamification data", err);
      }
    }
    return () => controller.abort();
  }, [user]);

  // --- teacher fetchers ---
  const fetchTodayAttendanceStats = useCallback(async () => {
    try {
      const today = getTodayKeyLocal();
      const attendanceQuery = query(
        collection(db, "attendance_records"),
        where("date", "==", today)
      );
      const snapshot = await getDocs(attendanceQuery);
      const records = snapshot.docs.map((doc) => doc.data());

      const presentToday = records.filter(
        (r) => r.status === "present" || !r.status
      ).length;
      const lateToday = records.filter((r) => r.status === "late").length;

      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student")
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const totalStudents = studentsSnapshot.size;
      const absentToday = Math.max(
        0,
        totalStudents - (presentToday + lateToday)
      );
      const averageAttendance =
        totalStudents > 0
          ? Math.round(((presentToday + lateToday) / totalStudents) * 1000) / 10
          : 0;

      setAttendanceStats({
        totalStudents,
        presentToday,
        absentToday,
        lateToday,
        averageAttendance,
      });
    } catch (err) {
      console.error("Failed to fetch today's attendance stats:", err);
    }
  }, []);

  // --- institute fetcher ---
  const fetchInstituteStats = useCallback(async () => {
    if (!user) return;
    let mounted = true;
    try {
      setLoading(true);
      setError(null);
      const token = await user.getIdToken();
      const res = await apiFetch("/api/institute/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!mounted) return;
      const data = unwrapApiPayload(res);

      if (!isRecord(data)) {
        throw new Error("Invalid institute stats response");
      }

      if (data.dashboardData) setDashboardData(data.dashboardData);
      if (data.classes) setClasses(data.classes);
      if (data.teachers) setTeachers(data.teachers);
      if (data.attendanceRequests) {
        setAttendanceRequests(data.attendanceRequests);
        setHasMoreRequests(data.attendanceRequests.length >= 20);
      }
    } catch (err) {
      if (mounted) {
        setError("Network error. Please check your connection and try again.");
      }
      console.error(err);
    } finally {
      if (mounted) setLoading(false);
    }
  }, [user]);

  const loadMoreRequests = useCallback(async () => {
    if (!user || loadingRequests || !hasMoreRequests) return;

    setLoadingRequests(true);
    try {
      const token = await user.getIdToken();
      const lastRequest = attendanceRequests[attendanceRequests.length - 1];
      const cursor = lastRequest?.id || "";

      const res = await apiFetch(
        `/api/institute/attendance-requests?cursor=${cursor}&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = unwrapApiPayload(res);
      if (data && data.requests) {
        setAttendanceRequests((prev) => {
          // Avoid duplicates if rapid calls happen
          const existingIds = new Set(prev.map((r) => r.id));
          const newRequests = data.requests.filter(
            (r) => !existingIds.has(r.id)
          );
          return [...prev, ...newRequests];
        });
        setHasMoreRequests(data.requests.length >= 20);
      }
    } catch (err) {
      console.error("Failed to load more requests", err);
    } finally {
      setLoadingRequests(false);
    }
  }, [user, attendanceRequests, loadingRequests, hasMoreRequests]);

  // --- effects ---
  useEffect(() => {
    if (role !== "student") return;
    fetchStudentActivity();
    fetchGamification();
  }, [role, fetchStudentActivity, fetchGamification]);

  useEffect(() => {
    if (role !== "teacher" || !user) return;
    fetchTodayAttendanceStats();
  }, [role, user, fetchTodayAttendanceStats]);

  // teacher real-time roster via onSnapshot
  useEffect(() => {
    if (role !== "teacher" || !user) return;
    let cancelled = false;
    const unsubRef = { current: () => {} };

    const fetchStudentsAndAttendance = async () => {
      try {
        const usersRef = collection(db, "users");
        const qStudents = query(usersRef, where("role", "==", "student"));
        const studentDocs = await getDocs(qStudents);
        if (cancelled) return;

        const studentsList = studentDocs.docs.map((doc) => ({
          id: doc.id,
          name:
            doc.data().displayName ||
            doc.data().name ||
            `${doc.data().firstName || ""} ${doc.data().lastName || ""}`.trim() ||
            "Unknown",
          rollNo: doc.data().rollNo || doc.data().studentId || "N/A",
          email: doc.data().email,
        }));

        const today = getTodayKeyLocal();
        const attendanceQuery = query(
          collection(db, "attendance_records"),
          where("date", "==", today)
        );
        if (cancelled) return;

        unsubRef.current = onSnapshot(attendanceQuery, (snapshot) => {
          if (cancelled) return;
          const attendanceMap = new Map();
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.userId) attendanceMap.set(data.userId, data);
            else if (data.email) attendanceMap.set(data.email, data);
          });

          const mergedRoster = studentsList.map((student, index) => {
            const record =
              attendanceMap.get(student.id) || attendanceMap.get(student.email);
            return {
              id: student.id || index,
              name: student.name,
              rollNo: student.rollNo,
              status: record ? record.status || "present" : "absent",
              time:
                record && record.timestamp
                  ? new Date(
                      record.timestamp.toDate
                        ? record.timestamp.toDate()
                        : record.timestamp
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--",
              confidence: record
                ? record.confidenceScore
                  ? Math.round(record.confidenceScore * 100)
                  : 100
                : 0,
            };
          });

          mergedRoster.sort((a, b) => a.name.localeCompare(b.name));

          if (mergedRoster.length > 0) {
            setStudentAttendanceData(mergedRoster);
          } else {
            setStudentAttendanceData([
              {
                id: 1,
                name: "Alex Johnson",
                rollNo: "CS21B1001",
                status: "present",
                time: "09:02",
                confidence: 98,
              },
              {
                id: 2,
                name: "Emma Davis",
                rollNo: "CS21B1002",
                status: "present",
                time: "09:01",
                confidence: 95,
              },
              {
                id: 3,
                name: "Michael Chen",
                rollNo: "CS21B1003",
                status: "late",
                time: "09:08",
                confidence: 92,
              },
              {
                id: 4,
                name: "Sarah Wilson",
                rollNo: "CS21B1004",
                status: "absent",
                time: "--",
                confidence: 0,
              },
              {
                id: 5,
                name: "David Kumar",
                rollNo: "CS21B1005",
                status: "present",
                time: "09:03",
                confidence: 97,
              },
            ]);
          }
        });
      } catch (err) {
        console.error("Error fetching students for roster:", err);
      }
    };

    fetchStudentsAndAttendance();
    return () => {
      cancelled = true;
      unsubRef.current();
    };
  }, [role, user]);

  useEffect(() => {
    if (role !== "institute") return;
    fetchInstituteStats();
  }, [role, fetchInstituteStats]);

  const refetch = useCallback(() => {
    switch (role) {
      case "student":
        fetchStudentActivity();
        fetchGamification();
        break;
      case "teacher":
        fetchTodayAttendanceStats();
        break;
      case "institute":
        fetchInstituteStats();
        break;
    }
  }, [
    role,
    fetchStudentActivity,
    fetchGamification,
    fetchTodayAttendanceStats,
    fetchInstituteStats,
  ]);

  return {
    // student
    recentActivity,
    gamificationData,
    // teacher
    attendanceStats,
    studentAttendanceData,
    // institute (setAttendanceRequests exposed for local optimistic updates)
    dashboardData,
    classes,
    teachers,
    attendanceRequests,
    setAttendanceRequests,
    loadMoreRequests,
    hasMoreRequests,
    loadingRequests,
    // shared
    loading,
    error,
    refetch,
  };
};
