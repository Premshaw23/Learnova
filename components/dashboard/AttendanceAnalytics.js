"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getWeekdaysSinceYearStart } from "@/services/statsService";

const AttendanceAnalytics = ({ userId }) => {
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalClasses: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const attendanceQuery = query(
          collection(db, "attendance_records"),
          where("userId", "==", userId)
        );
        
        const snapshot = await getDocs(attendanceQuery);
        const totalPresent = snapshot.size;
        const totalClasses = getWeekdaysSinceYearStart();
        
        // Prevent division by zero
        const safeTotalClasses = totalClasses > 0 ? totalClasses : 1;
        let totalAbsent = safeTotalClasses - totalPresent;
        
        // Ensure totalAbsent is never negative if they attended more times than expected
        if (totalAbsent < 0) totalAbsent = 0;

        const attendancePercentage = Math.round((totalPresent / safeTotalClasses) * 100);

        setStats({
          totalPresent,
          totalAbsent,
          totalClasses: safeTotalClasses,
          percentage: Math.min(100, attendancePercentage),
        });
      } catch (err) {
        console.error("Error fetching attendance analytics:", err);
        setError("Failed to load attendance data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (stats.totalClasses === 0 && stats.totalPresent === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm text-center">
        <p className="text-gray-500 text-sm">No attendance data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
          Attendance Analytics
        </h3>
        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {stats.percentage}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg flex items-center border border-green-100 dark:border-green-500/20">
          <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-full mr-3 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Present</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">{stats.totalPresent}</p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-lg flex items-center border border-red-100 dark:border-red-500/20">
          <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-full mr-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Absent</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">{stats.totalAbsent}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400 font-medium">Progress</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">{stats.totalPresent} / {stats.totalClasses} Classes</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${stats.percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceAnalytics;
