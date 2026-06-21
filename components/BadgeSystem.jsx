import React, { useState } from "react";

const MOCK_BADGES = [
  {
    id: 1,
    title: "First Step",
    desc: "First Course Completed",
    icon: "🚀",
    category: "Milestone",
    unlocked: true,
    progress: 100,
  },
  {
    id: 2,
    title: "Flame On",
    desc: "7-Day Learning Streak",
    icon: "🔥",
    category: "Streak",
    unlocked: true,
    progress: 100,
  },
  {
    id: 3,
    title: "Quiz Master",
    desc: "Solve 50+ Quizzes successfully",
    icon: "🧠",
    category: "Academic",
    unlocked: false,
    progress: 65,
  },
  {
    id: 4,
    title: "Flawless",
    desc: "Perfect Score Achievement",
    icon: "💯",
    category: "Academic",
    unlocked: true,
    progress: 100,
  },
  {
    id: 5,
    title: "Sonic Learner",
    desc: "Complete a course in under 3 days",
    icon: "⚡",
    category: "Speed",
    unlocked: false,
    progress: 20,
  },
  {
    id: 6,
    title: "Subject Specialist",
    desc: "Master an entire core subject line",
    icon: "🎓",
    category: "Milestone",
    unlocked: false,
    progress: 0,
  },
];

const BadgeSystem = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredBadges =
    activeFilter === "All"
      ? MOCK_BADGES
      : MOCK_BADGES.filter((b) => b.category === activeFilter);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen rounded-xl shadow-inner">
      {/* Header Profile Summary Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Your Achievements & Milestones
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Unlock badges, maintain your streaks, and track learning rewards.
          </p>
        </div>
        <div className="flex gap-4 bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-100">
          <div className="text-center">
            <span className="block text-xl font-bold text-indigo-600">
              3 / 6
            </span>
            <span className="text-xs text-indigo-500 font-medium">
              Badges Unlocked
            </span>
          </div>
          <div className="w-[1px] bg-indigo-200 self-stretch"></div>
          <div className="text-center">
            <span className="block text-xl font-bold text-amber-500">
              🔥 7 Days
            </span>
            <span className="text-xs text-amber-600 font-medium">
              Current Streak
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Controls */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["All", "Milestone", "Streak", "Academic", "Speed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeFilter === tab
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Badges Grid View Surface */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBadges.map((badge) => (
          <div
            key={badge.id}
            className={`p-5 rounded-2xl border transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
              badge.unlocked
                ? "border-indigo-100"
                : "border-gray-200 opacity-75"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`text-3xl p-3 rounded-xl flex items-center justify-center ${
                  badge.unlocked
                    ? "bg-indigo-50"
                    : "bg-gray-100 filter grayscale"
                }`}
              >
                {badge.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-sm">
                    {badge.title}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      badge.unlocked
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {badge.unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {badge.desc}
                </p>

                {/* Micro Progress Bar Configuration */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-gray-400 font-medium mb-1">
                    <span>Progress</span>
                    <span>{badge.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        badge.unlocked ? "bg-indigo-600" : "bg-amber-500"
                      }`}
                      style={{ width: `${badge.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeSystem;
