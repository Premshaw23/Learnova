"use client";

import { useState, useEffect, useCallback } from "react";
import { Award, Download, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";
import { exportToCSV } from "@/utils/exportUtils";
import AchievementAnalytics from "./AchievementAnalytics";

export default function InstituteAchievementPanel() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const [instRes, analyticsRes] = await Promise.all([
        apiFetch("/api/achievements/institute", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch("/api/achievements/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setAchievements((instRes.data ?? instRes).achievements || []);
      setAnalytics((analyticsRes.data ?? analyticsRes).analytics || null);
    } catch (err) {
      toast.error("Failed to load achievement analytics");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    if (!achievements.length) {
      toast.error("No data to export");
      return;
    }
    const data = achievements.map((a) => ({
      Title: a.title,
      Student: a.studentName,
      Category: a.category,
      Status: a.verificationStatus,
      Date: a.achievementDate?.slice(0, 10),
      "Issued By": a.issuedBy?.name || "",
    }));
    exportToCSV(data, `institute_achievements_${new Date().toISOString().slice(0, 10)}`);
    toast.success("Report exported to CSV");
  };

  if (loading) {
    return <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Institution Achievement Analytics</h3>
            <p className="text-xs text-gray-400">
              {analytics?.total || 0} total achievements across your institution
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-teal-500/20 border border-teal-500/30 rounded-xl text-sm text-teal-400 hover:bg-teal-500/30 transition"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <AchievementAnalytics analytics={analytics} />

      {analytics?.topPerformers?.length > 0 && (
        <div className="bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-white mb-3">Top Performing Students</h4>
          <div className="space-y-2">
            {analytics.topPerformers.map((s, i) => (
              <div
                key={s.studentId}
                className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2"
              >
                <span className="text-sm text-gray-300">
                  #{i + 1} {s.studentName}
                </span>
                <span className="text-sm font-bold text-teal-400">{s.count} achievements</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
