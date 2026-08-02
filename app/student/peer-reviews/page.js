"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Star, Send, CheckCircle, User, FileText, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const RUBRIC = [
  { key: "understanding", label: "Understanding of Topic", max: 25 },
  { key: "structure", label: "Structure & Clarity", max: 25 },
  { key: "originality", label: "Originality & Insight", max: 25 },
  { key: "references", label: "Use of References", max: 25 },
];

const MOCK_REVIEWS = [
  {
    id: "rev_001",
    assignmentTitle: "Essay: Causes of World War I",
    subject: "History",
    submittedBy: "Anonymous Student",
    dueDate: "2026-07-26",
    excerpt: "The First World War was a result of a complex interplay of alliances, militarism, imperialism, and nationalism. The assassination of Archduke Franz Ferdinand of Austria-Hungary on June 28, 1914, served as the immediate trigger..."
  },
  {
    id: "rev_002",
    assignmentTitle: "Lab Report: Photosynthesis Experiment",
    subject: "Biology",
    submittedBy: "Anonymous Student",
    dueDate: "2026-07-27",
    excerpt: "The experiment was designed to measure the rate of photosynthesis in Elodea under varying light intensities. We measured oxygen bubble production as a proxy for the photosynthesis rate..."
  },
];

export default function PeerReviewsPage() {
  const router = useRouter();
  const [selectedReview, setSelectedReview] = useState(null);
  const [rubricScores, setRubricScores] = useState({ understanding: 0, structure: 0, originality: 0, references: 0 });
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalScore = Object.values(rubricScores).reduce((a, b) => a + b, 0);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API call
    setSubmitted(true);
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold">Review Submitted!</h2>
          <p className="text-zinc-400">Your feedback has been recorded. The teacher will review your assessment.</p>
          <div className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-lg font-bold text-indigo-400">
            Final Score: {totalScore} / 100
          </div>
          <button onClick={() => { setSubmitted(false); setSelectedReview(null); setFeedback(""); setRubricScores({ understanding: 0, structure: 0, originality: 0, references: 0 }); }}
            className="mt-2 text-zinc-400 hover:text-white underline transition-colors">
            Review Another Assignment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 lg:p-8 flex gap-6">

        {/* Left: Assignment List */}
        <div className="w-full lg:w-2/5 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Peer Reviews</h1>
              <p className="text-xs text-zinc-500">{MOCK_REVIEWS.length} pending review{MOCK_REVIEWS.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {MOCK_REVIEWS.map(review => (
            <button
              key={review.id}
              onClick={() => { setSelectedReview(review); setSubmitted(false); }}
              className={`w-full text-left p-5 rounded-2xl border transition-all flex gap-4 items-start ${
                selectedReview?.id === review.id
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight mb-1">{review.assignmentTitle}</h3>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="px-2 py-0.5 bg-zinc-800 rounded-full">{review.subject}</span>
                  <span>Due {review.dueDate}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-1" />
            </button>
          ))}
        </div>

        {/* Right: Review Form */}
        <div className="w-full lg:w-3/5">
          {!selectedReview ? (
            <div className="h-full bg-zinc-900/30 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-12 text-center">
              <ClipboardList className="w-16 h-16 text-zinc-700 mb-4" />
              <h3 className="text-xl font-bold text-zinc-500 mb-2">Select an Assignment</h3>
              <p className="text-zinc-600 text-sm">Choose a pending peer review from the list on the left.</p>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-6 h-full overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                  <User className="w-3.5 h-3.5" /> {selectedReview.submittedBy} &bull; {selectedReview.subject}
                </div>
                <h2 className="text-xl font-bold mb-4">{selectedReview.assignmentTitle}</h2>
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed italic">
                  &ldquo;{selectedReview.excerpt}&rdquo;
                </div>
              </div>

              {/* Rubric */}
              <div>
                <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" /> Rubric Scoring
                </h3>
                <div className="space-y-4">
                  {RUBRIC.map(item => (
                    <div key={item.key}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-zinc-300 font-medium">{item.label}</span>
                        <span className="text-amber-400 font-bold">{rubricScores[item.key]} / {item.max}</span>
                      </div>
                      <input
                        type="range" min="0" max={item.max}
                        value={rubricScores[item.key]}
                        onChange={e => setRubricScores(prev => ({ ...prev, [item.key]: parseInt(e.target.value) }))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex justify-between items-center">
                  <span className="text-zinc-400 text-sm font-medium">Total Score</span>
                  <span className={`text-xl font-bold ${totalScore >= 75 ? 'text-emerald-400' : totalScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {totalScore} / 100
                  </span>
                </div>
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
                  Written Feedback
                </label>
                <textarea
                  className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-indigo-500/50 resize-none"
                  placeholder="Provide constructive feedback on the submission..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !feedback.trim()}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Submit Review
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
