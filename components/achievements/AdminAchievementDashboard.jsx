"use client";

import { useState, useEffect, useCallback } from "react";
import { Award, Search, Filter, CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";
import AchievementAnalytics from "./AchievementAnalytics";
import CertificatePreviewModal from "./CertificatePreviewModal";
import { VERIFICATION_STATUSES, STATUS_COLORS } from "./constants";

export default function AdminAchievementDashboard() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [preview, setPreview] = useState(null);
  const [verifyModal, setVerifyModal] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const qs = params.toString() ? `?${params}` : "";

      const [instRes, analyticsRes] = await Promise.all([
        apiFetch(`/api/achievements/institute${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch("/api/achievements/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setAchievements((instRes.data ?? instRes).achievements || []);
      setAnalytics((analyticsRes.data ?? analyticsRes).analytics || null);
    } catch (err) {
      toast.error("Failed to load achievements");
    } finally {
      setLoading(false);
    }
  }, [user, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerify = async (status) => {
    if (!verifyModal) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      await apiFetch(`/api/achievements/${verifyModal.achievementId}/verify`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: { verificationStatus: status, remarks: remarks || undefined },
      });
      toast.success(`Achievement ${status.toLowerCase()}`);
      setVerifyModal(null);
      setRemarks("");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <Award className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Global Achievement Dashboard</h3>
          <p className="text-xs text-gray-400">Manage and verify all platform achievements</p>
        </div>
      </div>

      <AchievementAnalytics analytics={analytics} />

      {analytics?.instituteLeaderboard?.length > 0 && (
        <div className="bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-white mb-3">Institution Leaderboard</h4>
          <div className="space-y-2">
            {analytics.instituteLeaderboard.map((inst, i) => (
              <div
                key={inst.instituteId}
                className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2"
              >
                <span className="text-sm text-gray-300">
                  #{i + 1} {inst.instituteId}
                </span>
                <span className="text-sm font-bold text-blue-400">{inst.count} achievements</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white"
        >
          <option value="">All Status</option>
          {VERIFICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-left">
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map((a) => (
              <tr key={a.achievementId} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 px-4 text-white font-medium">{a.title}</td>
                <td className="py-3 px-4 text-gray-400">{a.studentName}</td>
                <td className="py-3 px-4 text-gray-400">{a.category}</td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[a.verificationStatus]}`}
                  >
                    {a.verificationStatus}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-400">{a.achievementDate?.slice(0, 10)}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    {a.certificateUrl && (
                      <button
                        onClick={() => setPreview(a)}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        View
                      </button>
                    )}
                    {a.verificationStatus === "Pending" && (
                      <button
                        onClick={() => setVerifyModal(a)}
                        className="text-xs text-green-400 hover:underline"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {achievements.length === 0 && (
          <p className="text-center text-gray-500 py-8">No achievements found</p>
        )}
      </div>

      {verifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0B1120]/95 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h4 className="text-white font-semibold mb-4">Verify: {verifyModal.title}</h4>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Remarks"
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white mb-4 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleVerify("Verified")}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Verify
              </button>
              <button
                onClick={() => handleVerify("Rejected")}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button onClick={() => setVerifyModal(null)} className="px-4 py-2 text-gray-400 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <CertificatePreviewModal achievement={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
