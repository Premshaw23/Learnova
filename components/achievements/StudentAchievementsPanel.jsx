"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Award, Search, Filter, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";
import AchievementCard from "./AchievementCard";
import CertificatePreviewModal from "./CertificatePreviewModal";
import { ACHIEVEMENT_CATEGORIES } from "./constants";

export default function StudentAchievementsPanel() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [preview, setPreview] = useState(null);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      const qs = params.toString() ? `?${params}` : "";
      const result = await apiFetch(
        `/api/achievements/student/${user.uid}${qs}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const payload = result.data ?? result;
      setAchievements(payload.achievements || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load achievements");
    } finally {
      setLoading(false);
    }
  }, [user, search, category]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const stats = useMemo(() => {
    const verified = achievements.filter((a) => a.verificationStatus === "Verified").length;
    const pending = achievements.filter((a) => a.verificationStatus === "Pending").length;
    return { total: achievements.length, verified, pending };
  }, [achievements]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Digital Certificates</h3>
            <p className="text-xs text-gray-400">Your achievements & verified certificates</p>
          </div>
        </div>
        <button
          onClick={fetchAchievements}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-blue-400" },
          { label: "Verified", value: stats.verified, color: "text-green-400" },
          { label: "Pending", value: stats.pending, color: "text-yellow-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center"
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white appearance-none focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All Categories</option>
            {ACHIEVEMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {achievements.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-[#0B1120]/60 backdrop-blur-xl border border-white/10 rounded-3xl"
        >
          <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No achievements yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Your teacher will add achievements and certificates here
          </p>
        </motion.div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10 hidden md:block" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:pl-8">
            {achievements.map((a, i) => (
              <AchievementCard
                key={a.achievementId}
                achievement={a}
                index={i}
                onPreview={setPreview}
              />
            ))}
          </div>
        </div>
      )}

      {preview && (
        <CertificatePreviewModal achievement={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
