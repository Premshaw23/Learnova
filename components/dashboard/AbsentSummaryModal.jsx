"use client";

import React, { useState } from "react";
import { X, Sparkles, Send, FileText, Loader2, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AbsentSummaryModal({ isOpen, onClose, absentStudents = [] }) {
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!notes.trim()) {
      toast.error("Please enter lecture notes to summarize");
      return;
    }
    
    setIsGenerating(true);
    try {
      const { apiFetch } = await import("@/lib/apiClient");
      const { auth } = await import("@/lib/firebaseConfig");
      const token = await auth.currentUser?.getIdToken();
      
      const res = await apiFetch("/api/study-ai/lecture-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate summary");
      
      setSummary(data.data.summary);
      toast.success("Summary generated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!summary.trim()) {
      toast.error("Please generate a summary first");
      return;
    }
    if (absentStudents.length === 0) {
      toast.error("No absent students to send to");
      return;
    }

    setIsSending(true);
    let successCount = 0;
    try {
      const emailjs = (await import("@emailjs/browser")).default;
      const emailjsServiceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const emailjsTemplateId = process.env.NEXT_PUBLIC_EMAILJS_ATTENDANCE_TEMPLATE_ID; 
      const emailjsPublicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
        for (const student of absentStudents) {
          try {
            await emailjs.send(
              emailjsServiceId,
              emailjsTemplateId,
              {
                to_email: student.email || "student@example.com",
                to_name: student.name || student.studentName || "Student",
                message: summary,
                risk_level: "Lecture Summary",
                attendance_rate: "Missed Class",
                trend: "N/A"
              },
              emailjsPublicKey
            );
            successCount++;
          } catch (e) {
            console.error("Failed to send to", student, e);
          }
        }
        setSentCount(successCount);
        toast.success(`Sent summary to ${successCount} absent students`);
      } else {
        toast.error("EmailJS configuration is missing");
      }
    } catch (error) {
      toast.error("Failed to send emails");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card dark:bg-gray-900 border border-border dark:border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground dark:text-white">
              AI Lecture Summary
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-gray-300 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Raw Lecture Notes / Transcript
            </label>
            <textarea
              className="w-full h-32 p-3 rounded-xl bg-background dark:bg-black/50 border border-border dark:border-white/10 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Paste your lecture notes or transcript here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !notes.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Summary
            </button>
          </div>

          {summary && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <label className="block text-sm font-medium text-foreground dark:text-gray-300 mb-2">
                Generated Summary
              </label>
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-foreground dark:text-gray-200 whitespace-pre-wrap max-h-60 overflow-y-auto text-sm">
                {summary}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border dark:border-white/10 bg-muted/30 dark:bg-white/5 flex items-center justify-between">
          <div className="text-sm text-muted-foreground dark:text-gray-400">
            {absentStudents.length} absent student(s) will receive this.
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border dark:border-white/10 text-foreground dark:text-white rounded-lg hover:bg-muted dark:hover:bg-white/10 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !summary || absentStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : sentCount > 0 ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sentCount > 0 ? "Sent Successfully" : "Send to Absentees"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
