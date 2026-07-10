"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PenLine, FileText, UploadCloud, Calendar } from "lucide-react";

export default function StudentAssignmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    } else if (user) {
      fetchAssignments();
    }
  }, [user, loading, router]);

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/assignments");
      const data = await res.json();
      if (data.success) {
        setAssignments(data.assignments);
      }
    } catch (error) {
      console.error("Failed to fetch assignments", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both title and content.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Submitting and scanning for originality...");

    try {
      const res = await fetch("/api/assignments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Assignment submitted successfully!", { id: loadingToast });
        setTitle("");
        setContent("");
        fetchAssignments(); // Refresh list
      } else {
        toast.error(data.error || "Failed to submit assignment", { id: loadingToast });
      }
    } catch (error) {
      toast.error("An error occurred during submission.", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
          <p className="text-zinc-400">Submit your work here. Note: All submissions are automatically checked for originality by AI.</p>
        </header>

        <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <PenLine className="w-5 h-5 text-indigo-400" />
            Submit New Assignment
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Assignment Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Quantum Physics Essay"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write or paste your assignment content here..."
                rows={10}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              {isSubmitting ? "Submitting..." : "Submit Assignment"}
            </button>
          </form>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-400" />
            Past Submissions
          </h2>
          {assignments.length === 0 ? (
            <p className="text-zinc-500 italic bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">No assignments submitted yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                  <h3 className="font-semibold text-lg text-zinc-200 line-clamp-1">{assignment.title}</h3>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 text-zinc-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(assignment.submittedAt).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md text-xs font-semibold">
                      {assignment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
