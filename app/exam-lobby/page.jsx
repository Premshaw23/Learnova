"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import CameraSnapshot from "@/components/camera/CameraSnapshot";
import { Navbar } from "@/components/Navbar";
import { ShieldCheck, UserCheck, UserX, AlertCircle, RefreshCw, Star, Users } from "lucide-react";
import toast from "react-hot-toast";

const MOCK_EXAMS = [
  { id: "exam-101", title: "Computer Science 101 - Final Exam" },
  { id: "exam-202", title: "Advanced Calculus - Midterm" },
];

export default function ExamLobbyPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const [selectedExam, setSelectedExam] = useState(MOCK_EXAMS[0].id);
  const [studentBaseline, setStudentBaseline] = useState(null);
  const [loadingBaseline, setLoadingBaseline] = useState(false);
  const [studentStatus, setStudentStatus] = useState("pending"); // pending, verified, failed, requested_override, manual_approved
  const [confidence, setConfidence] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const isInstructor = userProfile?.role === "teacher" || userProfile?.role === "admin";

  // Fetch student's baseline descriptor
  const fetchStudentBaseline = async () => {
    if (!user) return;
    setLoadingBaseline(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/verify?userId=${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.faceDescriptor) {
        setStudentBaseline(data.data.faceDescriptor);
      } else {
        // Fallback descriptor if student has no profile photo set up (mock 128 floats)
        setStudentBaseline(Array.from({ length: 128 }, () => Math.random() * 0.1));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load baseline profile image descriptor.");
    } finally {
      setLoadingBaseline(false);
    }
  };

  // Log verification result to database
  const logVerificationResult = async (status, conf = 0) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId: selectedExam,
          userId: user.uid,
          studentName: userProfile?.fullName || user.displayName || user.email,
          status,
          confidence: conf,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log verification");
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync verification state to server.");
    }
  };

  // Fetch verification logs (Instructor Only)
  const fetchVerificationLogs = async () => {
    if (!user || !isInstructor) return;
    setLoadingLogs(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/verify?examId=${selectedExam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Instructor manual override/approval
  const handleManualApprove = async (studentId, studentName) => {
    if (!user || !isInstructor) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId: selectedExam,
          userId: studentId,
          studentName,
          status: "manually_approved",
          confidence: 100,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Approved ${studentName} manually.`);
        fetchVerificationLogs();
      } else {
        toast.error(data.error || "Override request failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && !isInstructor) {
      fetchStudentBaseline();
    }
    if (user && isInstructor) {
      fetchVerificationLogs();
    }
  }, [user, isInstructor, selectedExam]);

  // Handle successful biometric scan match
  const handleOnVerified = (conf) => {
    setConfidence(conf);
    setStudentStatus("verified");
    logVerificationResult("verified", conf);
    toast.success("Verification successful!");
  };

  // Handle scan match failure
  const handleOnFailed = (error) => {
    setStudentStatus("failed");
    logVerificationResult("failed", 0);
    toast.error("Verification failed. Face did not match.");
  };

  // Fallback: request instructor override
  const handleRequestOverride = () => {
    setStudentStatus("requested_override");
    logVerificationResult("pending_override", 0);
    toast.success("Override request sent to instructor.");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 max-w-6xl mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Exam Attendance Check-In
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">
              Contactless biometric identity check for secure exam sessions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">Select Exam Session:</span>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {MOCK_EXAMS.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isInstructor ? (
          /* ── INSTRUCTOR CONSOLE ────────────────── */
          <div className="grid grid-cols-1 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Live Attendance Lobby Monitor
                </h2>
                <button
                  onClick={fetchVerificationLogs}
                  disabled={loadingLogs}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                  Refresh Logs
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-850 text-zinc-500">
                      <th className="py-3 px-4 font-medium">Student Name</th>
                      <th className="py-3 px-4 font-medium">Lobby Status</th>
                      <th className="py-3 px-4 font-medium">Confidence Score</th>
                      <th className="py-3 px-4 font-medium">Timestamp</th>
                      <th className="py-3 px-4 font-medium text-right">Override Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <tr key={log._id} className="border-b border-zinc-900 hover:bg-zinc-900/10">
                          <td className="py-4 px-4 font-semibold text-zinc-300">{log.studentName}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              log.status === "verified"
                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                : log.status === "manually_approved"
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                : log.status === "pending_override"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
                                : "bg-red-500/10 border-red-500/30 text-red-400"
                            }`}>
                              {log.status === "verified" && <ShieldCheck className="w-3.5 h-3.5" />}
                              {log.status === "manually_approved" && <UserCheck className="w-3.5 h-3.5" />}
                              {log.status === "pending_override" && <AlertCircle className="w-3.5 h-3.5" />}
                              {log.status === "failed" && <UserX className="w-3.5 h-3.5" />}
                              {log.status.toUpperCase().replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono font-semibold">{log.confidence ? `${log.confidence}%` : "--"}</td>
                          <td className="py-4 px-4 text-xs text-zinc-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="py-4 px-4 text-right">
                            {log.status !== "verified" && log.status !== "manually_approved" && (
                              <button
                                onClick={() => handleManualApprove(log.userId, log.studentName)}
                                className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Manually Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-zinc-500 italic">
                          No students in the lobby yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ── STUDENT CHECK-IN INTERFACE ────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-md space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Biometric Identification Scan
              </h2>

              {!loadingBaseline && studentBaseline ? (
                <CameraSnapshot
                  baselineDescriptor={studentBaseline}
                  onVerified={handleOnVerified}
                  onVerificationFailed={handleOnFailed}
                />
              ) : (
                <div className="aspect-video w-full rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20 flex flex-col items-center justify-center gap-2 text-zinc-500 text-sm">
                  <RefreshCw className="w-6 h-6 animate-spin text-zinc-600" />
                  <span>Loading profile descriptors...</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Status card */}
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-md space-y-4">
                <h3 className="text-lg font-bold text-zinc-300">Verification Status</h3>

                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border ${
                    studentStatus === "verified" || studentStatus === "manual_approved"
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : studentStatus === "requested_override"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
                      : studentStatus === "failed"
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-zinc-800/40 border-zinc-700/50 text-zinc-400"
                  }`}>
                    {studentStatus.toUpperCase().replace("_", " ")}
                  </span>

                  {confidence && (
                    <span className="text-sm font-semibold text-zinc-500">
                      Match Score: <span className="font-mono text-zinc-300">{confidence}%</span>
                    </span>
                  )}
                </div>

                {studentStatus === "failed" && (
                  <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-300 text-xs leading-relaxed space-y-3">
                    <p>
                      ⚠️ Biometric signature mismatch. If this is a hardware issue or incorrect baseline profile photo, you can request manual override verification from the session instructor.
                    </p>
                    <button
                      onClick={handleRequestOverride}
                      type="button"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Request Instructor Verification
                    </button>
                  </div>
                )}

                {studentStatus === "requested_override" && (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 text-amber-300 text-xs leading-relaxed">
                    ⏱️ Override request sent. Please inform your instructor to manually verify and approve your entry from the lobby monitor.
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-850 flex justify-end">
                  <button
                    disabled={studentStatus !== "verified" && studentStatus !== "manual_approved"}
                    onClick={() => toast.success("Redirecting to active exam room...")}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/10 active:scale-95 cursor-pointer"
                  >
                    Enter Exam Room
                  </button>
                </div>
              </div>

              {/* Instructions Panel */}
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-md space-y-3">
                <h4 className="font-bold text-zinc-300 text-sm">Verification Guidelines</h4>
                <ul className="text-xs text-zinc-500 space-y-2 list-disc list-inside">
                  <li>Ensure your face is well-lit and facing straight at the camera.</li>
                  <li>Avoid wearing sunglasses, hats, or masks that obscure features.</li>
                  <li>Biometric matching is processed locally; no video data is sent to the server.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
