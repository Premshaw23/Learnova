import React, { useState } from 'react';

const MOCK_MISTAKE_ANALYSIS = {
  score: "70%",
  totalQuestions: 10,
  correctAnswers: 7,
  incorrectAnswers: 3,
  topics: [
    { name: "Cyber Security Fundamentals", incorrect: 1, total: 3, status: "Review Needed", color: "bg-amber-100 text-amber-800" },
    { name: "Network Security & Phishing", incorrect: 2, total: 4, status: "Critical Weakness", color: "bg-rose-100 text-rose-800" },
    { name: "Digital Forensics & Cryptography", incorrect: 0, total: 3, status: "Mastered", color: "bg-emerald-100 text-emerald-800" }
  ],
  questions: [
    {
      id: 1,
      question: "Which of the following is an execution layer vulnerability often exploited in phishing campaigns?",
      userAnswer: "Static Route Invalidation",
      correctAnswer: "Malicious Macro Script Injection",
      explanation: "Phishing emails frequently distribute payloads via document templates containing hidden macro scripts that compile automatically upon file execution paths.",
      resources: ["Intro to Social Engineering", "Analyzing Payload Triggers"]
    }
  ]
};

const QuizReviewMode = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="p-6 max-w-5xl mx-auto bg-slate-50 min-h-screen rounded-2xl">
      {/* Top Banner Dashboard Scorecard */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Interactive Quiz Performance Engine</h1>
          <p className="text-sm text-slate-500 mt-1">Post-assessment analytical telemetry and topic-wise breakdown metrics.</p>
        </div>
        <div className="flex gap-4">
          <div className="px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
            <span className="block text-2xl font-bold text-emerald-600">{MOCK_MISTAKE_ANALYSIS.correctAnswers}</span>
            <span className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider">Correct</span>
          </div>
          <div className="px-5 py-3 bg-rose-50 rounded-2xl border border-rose-100 text-center">
            <span className="block text-2xl font-bold text-rose-600">{MOCK_MISTAKE_ANALYSIS.incorrectAnswers}</span>
            <span className="text-[11px] text-rose-600 font-semibold uppercase tracking-wider">Incorrect</span>
          </div>
        </div>
      </div>

      {/* Mode Switch Controls */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-bold tracking-wide transition-all ${activeTab === 'analytics' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          📊 Topic Analytics
        </button>
        <button 
          onClick={() => setActiveTab('breakdown')}
          className={`pb-3 text-sm font-bold tracking-wide transition-all ${activeTab === 'breakdown' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          🔍 Mistake Breakdown
        </button>
      </div>

      {/* Tab Context View 1: Topic Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {MOCK_MISTAKE_ANALYSIS.topics.map((topic, idx) => (
            <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{topic.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Incorrect responses: {topic.incorrect} out of {topic.total} tracks</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold tracking-wide shadow-xs ${topic.color}`}>
                {topic.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab Context View 2: Detailed Mistake Resolution */}
      {activeTab === 'breakdown' && (
        <div className="space-y-6">
          {MOCK_MISTAKE_ANALYSIS.questions.map((q) => (
            <div key={q.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Question Defect #{q.id}</span>
              <p className="font-bold text-slate-800 text-sm mt-1">{q.question}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-rose-400 block">Your Answer:</span>
                  <span className="text-xs font-semibold text-rose-700">{q.userAnswer}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Correct Resolution:</span>
                  <span className="text-xs font-semibold text-emerald-700">{q.correctAnswer}</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Root-Cause Analysis & Explanation:</span>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{q.explanation}</p>
              </div>

              {/* Revision Library Integration Section */}
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] uppercase font-bold text-indigo-400 block mr-2">Recommended Framework Revision:</span>
                {q.resources.map((res, rIdx) => (
                  <span key={rIdx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] px-3 py-0.5 rounded-md font-medium cursor-pointer hover:bg-indigo-100 transition-all">
                    📚 {res}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizReviewMode;