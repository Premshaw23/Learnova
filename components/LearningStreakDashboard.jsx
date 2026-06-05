import React, { useState } from 'react';

const MOCK_ANALYTICS_DATA = {
  currentStreak: 7,
  consistencyScore: 88,
  hoursLearned: 24.5,
  weeklyConsistency: [
    { day: "Mon", status: "Completed", hours: 3.5 },
    { day: "Tue", status: "Completed", hours: 2.0 },
    { day: "Wed", status: "Completed", hours: 4.5 },
    { day: "Thu", status: "Completed", hours: 1.5 },
    { day: "Fri", status: "Completed", hours: 3.0 },
    { day: "Sat", status: "Completed", hours: 5.0 },
    { day: "Sun", status: "Pending", hours: 0.0 }
  ],
  suggestions: [
    "Your learning volume peaks on Saturdays. Consider scheduling your toughest core modules for weekends.",
    "Maintain a minimum 1.5-hour sequence daily to lock down your target Consistency Score milestone."
  ]
};

const LearningStreakDashboard = () => {
  const [showInsights, setShowInsights] = useState(true);

  return (
    <div className="p-6 max-w-5xl mx-auto bg-slate-50 min-h-screen rounded-2xl border border-slate-100">
      {/* Analytics Hero Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Core Streak Widget */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-6 rounded-2xl shadow-sm text-white">
          <span className="text-[10px] font-black tracking-widest uppercase opacity-75">Active Progress</span>
          <h3 className="text-3xl font-black mt-1">🔥 {MOCK_ANALYTICS_DATA.currentStreak} Days</h3>
          <p className="text-xs mt-2 opacity-90">Current learning streak sequence locked in.</p>
        </div>

        {/* Consistency Score Widget */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-[10px] font-black tracking-widest text-indigo-500 uppercase">Stability Vector</span>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{MOCK_ANALYTICS_DATA.consistencyScore}%</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Overall learning habit validation metrics.</p>
        </div>

        {/* Total Time Investment Widget */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Time Investment</span>
          <h3 className="text-3xl font-black text-slate-800 mt-1">⏱️ {MOCK_ANALYTICS_DATA.hoursLearned} hrs</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Total active workspace learning hours.</p>
        </div>
      </div>

      {/* Weekly Activity Block Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs mb-8">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-6">7-Day Consistency Heatmap</h3>
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-4">
          {MOCK_ANALYTICS_DATA.weeklyConsistency.map((item, index) => (
            <div key={index} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center">
              <span className="text-xs font-bold text-slate-600">{item.day}</span>
              <span className={`w-3 h-3 rounded-full my-3 ${item.status === 'Completed' ? 'bg-orange-500 shadow-xs shadow-orange-500/50' : 'bg-slate-200'}`}></span>
              <span className="text-[10px] font-medium text-slate-400">{item.hours > 0 ? `${item.hours}h` : '---'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Actionable Insights Container */}
      <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowInsights(!showInsights)}>
          <h4 className="text-xs font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2">
            💡 Adaptive Learning Insights
          </h4>
          <span className="text-xs text-indigo-600 font-bold">{showInsights ? 'Hide Details' : 'Expand'}</span>
        </div>
        
        {showInsights && (
          <ul className="mt-4 space-y-3 text-xs text-indigo-950/80 font-medium list-disc list-inside">
            {MOCK_ANALYTICS_DATA.suggestions.map((tip, idx) => (
              <li key={idx} className="leading-relaxed">{tip}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LearningStreakDashboard;