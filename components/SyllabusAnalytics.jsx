"use client";

import React, { useState } from 'react';

const MOCK_SYLLABUS_TRACKS = {
  courseTitle: "Full-Stack Security Engineering",
  overallCompletion: 68,
  modules: [
    { id: "mod-1", name: "Architecture Assessment & Tool Setup", topicsCount: 5, completedTopics: 5, weight: "15%" },
    { id: "mod-2", name: "Automated CI/CD Isolation Workflows", topicsCount: 8, completedTopics: 6, weight: "30%" },
    { id: "mod-3", name: "Local Interceptor & Sync Cache Control", topicsCount: 6, completedTopics: 2, weight: "25%" },
    { id: "mod-4", name: "Gamified Retentions & Badge Verification", topicsCount: 4, completedTopics: 0, weight: "30%" }
  ]
};

const SyllabusAnalytics = () => {
  const [selectedModule, setSelectedModule] = useState(null);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-slate-50 min-h-screen rounded-2xl border border-slate-100">
      {/* Dynamic Header Metrics Deck */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/60 mb-8">
        <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">Syllabus Analytics Engine</span>
        <h1 className="text-xl font-bold text-slate-800 mt-1">{MOCK_SYLLABUS_TRACKS.courseTitle}</h1>
        
        {/* Main Progression Bar Matrix */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Overall Course Syllabus Roadmap Progress</span>
            <span className="text-indigo-600 font-bold">{MOCK_SYLLABUS_TRACKS.overallCompletion}% Done</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${MOCK_SYLLABUS_TRACKS.overallCompletion}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Grid Iteration Space */}
      <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Course Syllabus Module Breakdown</h3>
      <div className="space-y-4">
        {MOCK_SYLLABUS_TRACKS.modules.map((mod) => {
          const completionPercentage = Math.round((mod.completedTopics / mod.topicsCount) * 100);
          
          return (
            <div 
              key={mod.id}
              onClick={() => setSelectedModule(selectedModule === mod.id ? null : mod.id)}
              className={`p-5 rounded-xl border transition-all duration-150 cursor-pointer bg-white shadow-xs ${
                selectedModule === mod.id ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{mod.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Completion telemetry: {mod.completedTopics}/{mod.topicsCount} core tasks compiled (Weight: {mod.weight})
                  </p>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold ${
                  completionPercentage === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  completionPercentage > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                  'bg-slate-50 text-slate-500 border border-slate-200'
                }`}>
                  {completionPercentage}% Metrics
                </span>
              </div>

              {/* Collapsible Micro Topic View Sub-System */}
              {selectedModule === mod.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 p-3 rounded-lg text-xs text-slate-600 leading-relaxed space-y-2">
                  <div className="font-semibold text-slate-700">Sub-topic Extraction Pipeline Diagnostics:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-500">
                    <li>Verification gates execution check summary logs.</li>
                    <li>Headless array telemetry compiler status tests.</li>
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SyllabusAnalytics;