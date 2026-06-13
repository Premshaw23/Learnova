"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Upload,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import AchievementCard from "./AchievementCard";
import CertificatePreviewModal from "./CertificatePreviewModal";
import AchievementAnalytics from "./AchievementAnalytics";
import { ACHIEVEMENT_CATEGORIES, VERIFICATION_STATUSES } from "./constants";

export default function TeacherAchievementPanel() {
  const { user, userProfile } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verifyModal, setVerifyModal] = useState(null);
  const [remarks, setRemarks] = useState("");

  const [form, setForm] = useState({
    studentId: "",
    title: "",
    description: "",
    category: "Academic",
    achievementDate: new Date().toISOString().slice(0, 10),
    certificateFile: null,
    certificateUrl: "",
  });

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

      const instPayload = instRes.data ?? instRes;
      const analyticsPayload = analyticsRes.data ?? analyticsRes;
      setAchievements(instPayload.achievements || []);
      setAnalytics(analyticsPayload.analytics || null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load achievements");
    } finally {
      setLoading(false);
    }
  }, [user, search, statusFilter]);

  const fetchStudents = useCallback(async () => {
    if (!userProfile?.instituteId) return;
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("instituteId", "==", userProfile.instituteId)
      );
      const snap = await getDocs(q);
      setStudents(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().fullName || d.data().displayName || d.data().email,
        }))
      );
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  }, [userProfile?.instituteId]);

  useEffect(() => {
    fetchData();
    fetchStudents();
  }, [fetchData, fetchStudents]);

  const handleUploadCertificate = async (file) => {
    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append("file", file);
    const result = await apiFetch("/api/upload/certificate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const payload = result.data ?? result;
    return payload.url;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.title || !form.description) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      let certificateUrl = form.certificateUrl;
      if (form.certificateFile) {
        certificateUrl = await handleUploadCertificate(form.certificateFile);
      }

      await apiFetch("/api/achievements", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: {
          studentId: form.studentId,
          title: form.title,
          description: form.description,
          category: form.category,
          achievementDate: form.achievementDate,
          certificateUrl: certificateUrl || undefined,
        },
      });

      toast.success("Achievement created successfully");
      setShowForm(false);
      setForm({
        studentId: "",
        title: "",
        description: "",
        category: "Academic",
        achievementDate: new Date().toISOString().slice(0, 10),
        certificateFile: null,
        certificateUrl: "",
      });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create achievement");
    } finally {
      setSubmitting(false);
    }
  };

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

  const pending = achievements.filter((a) => a.verificationStatus === "Pending");

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Achievement Management</h3>
            <p className="text-xs text-gray-400">
              Upload, assign, and verify student certificates
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Add Achievement
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleCreate}
          className="bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Student</label>
              <select
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white"
              >
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white"
              >
                {ACHIEVEMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date</label>
              <input
                type="date"
                value={form.achievementDate}
                onChange={(e) => setForm({ ...form, achievementDate: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Certificate (PDF/PNG/JPG)</label>
            <label className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">
                {form.certificateFile?.name || "Choose file"}
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) =>
                  setForm({ ...form, certificateFile: e.target.files?.[0] || null })
                }
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-xl text-sm font-medium transition disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Achievement
          </button>
        </motion.form>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: achievements.length },
          { label: "Pending", value: pending.length },
          {
            label: "Verified",
            value: achievements.filter((a) => a.verificationStatus === "Verified").length,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center"
          >
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-yellow-400 mb-3">
            Pending Verification ({pending.length})
          </h4>
          <div className="space-y-2">
            {pending.slice(0, 5).map((a) => (
              <div
                key={a.achievementId}
                className="flex items-center justify-between bg-black/30 rounded-xl p-3"
              >
                <div>
                  <p className="text-sm text-white font-medium">{a.title}</p>
                  <p className="text-xs text-gray-400">{a.studentName}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVerifyModal(a)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition"
                  >
                    Review
                  </button>
                </div>
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
            placeholder="Search title or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white"
          >
            <option value="">All Status</option>
            {VERIFICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AchievementAnalytics analytics={analytics} compact />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((a, i) => (
          <div key={a.achievementId} className="relative">
            <AchievementCard achievement={a} index={i} showStudent onPreview={setPreview} />
            {a.verificationStatus === "Pending" && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    setVerifyModal(a);
                    setRemarks("");
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30 transition"
                >
                  <CheckCircle className="w-3 h-3" /> Verify
                </button>
                <button
                  onClick={() => {
                    setVerifyModal(a);
                    setRemarks("");
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition"
                >
                  <XCircle className="w-3 h-3" /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {verifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0B1120]/95 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h4 className="text-white font-semibold mb-2">Verify: {verifyModal.title}</h4>
            <p className="text-xs text-gray-400 mb-4">Student: {verifyModal.studentName}</p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Remarks (optional for verify, recommended for reject)"
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white mb-4 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleVerify("Verified")}
                disabled={submitting}
                className="flex-1 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-sm hover:bg-green-500/30 transition"
              >
                Verify
              </button>
              <button
                onClick={() => handleVerify("Rejected")}
                disabled={submitting}
                className="flex-1 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm hover:bg-red-500/30 transition"
              >
                Reject
              </button>
              <button
                onClick={() => setVerifyModal(null)}
                className="px-4 py-2 bg-white/10 text-gray-400 rounded-xl text-sm hover:bg-white/20 transition"
              >
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
