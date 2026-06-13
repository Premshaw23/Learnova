"use client";

import { useState, useEffect, useCallback } from "react";
import { Award, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";
import AchievementCard from "./AchievementCard";
import CertificatePreviewModal from "./CertificatePreviewModal";

export default function ParentAchievementsPanel({ studentId, studentName }) {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  const fetchAchievements = useCallback(async () => {
    if (!user || !studentId) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const result = await apiFetch(`/api/achievements/parent/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = result.data ?? result;
      setAchievements(payload.achievements || []);
      setStats(payload.stats || null);
      setRecent(payload.recentAccomplishments || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load child achievements");
    } finally {
      setLoading(false);
    }
  }, [user, studentId]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  if (!studentId) {
    return (
      <div className="text-center py-12 text-gray-400">
        Select a child to view their achievements
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {studentName}&apos;s Achievements
            </h3>
            <p className="text-xs text-gray-400">Certificates and accomplishments</p>
          </div>
        </div>
        <button
          onClick={fetchAchievements}
          className="p-2 hover:bg-white/10 rounded-xl text-gray-400 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-blue-400" },
            { label: "Verified", value: stats.verified, color: "text-green-400" },
            { label: "Pending", value: stats.pending, color: "text-yellow-400" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 text-center"
            >
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-pink-400 mb-3">Recent Accomplishments</h4>
          <div className="space-y-2">
            {recent.map((a) => (
              <div
                key={a.achievementId}
                className="flex items-center justify-between bg-black/20 rounded-xl px-4 py-2"
              >
                <span className="text-sm text-white">{a.title}</span>
                <span className="text-xs text-gray-400">{a.achievementDate?.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {achievements.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-white/10 rounded-3xl">
          <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No achievements recorded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((a, i) => (
            <AchievementCard
              key={a.achievementId}
              achievement={a}
              index={i}
              onPreview={setPreview}
            />
          ))}
        </div>
      )}

      {preview && (
        <CertificatePreviewModal achievement={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
