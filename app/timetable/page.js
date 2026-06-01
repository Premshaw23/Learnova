"use client";

import { useState } from "react";

export default function TimetablePage() {
  const [goal, setGoal] = useState("");
  const [hours, setHours] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [topics, setTopics] = useState("");
  const [generated, setGenerated] = useState(false);

  const topicList = topics
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const generatePlan = () => {
    if (!goal || !hours || !topics) {
      alert("Please fill all fields");
      return;
    }
    setGenerated(true);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            AI Study Planner Generator
          </h1>

          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Generate personalized study plans based on your target exam,
            available study hours, skill level, and preferred topics.
          </p>
        </div>

        {/* Input Form */}
        <div className="border rounded-2xl p-5 bg-white dark:bg-zinc-900 shadow-sm mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Exam / Company
              </label>

              <input
                type="text"
                placeholder="Amazon SDE, Google, GATE CSE..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Study Hours Per Day
              </label>

              <input
                type="number"
                placeholder="4"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Current Skill Level
              </label>

              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Preferred Topics
              </label>

              <input
                type="text"
                placeholder="DSA, React, OS, DBMS"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            onClick={generatePlan}
            className="mt-5 w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2.5 rounded-lg transition"
          >
            Generate Study Plan
          </button>
        </div>

        {/* Generated Results */}
        {generated && (
  <>
    {/* AI Roadmap */}
    <div className="border rounded-xl p-5 mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
      <h2 className="text-lg font-bold mb-3">
        🚀 AI Learning Roadmap
      </h2>

      <div className="grid md:grid-cols-4 gap-3 text-sm">
        <div className="border rounded-lg p-3">
          <h3 className="font-semibold">Phase 1</h3>
          <p>Foundation & Basics</p>
          <p className="text-muted-foreground">Week 1-2</p>
        </div>

        <div className="border rounded-lg p-3">
          <h3 className="font-semibold">Phase 2</h3>
          <p>Core Concepts</p>
          <p className="text-muted-foreground">Week 3-6</p>
        </div>

        <div className="border rounded-lg p-3">
          <h3 className="font-semibold">Phase 3</h3>
          <p>Projects & Practice</p>
          <p className="text-muted-foreground">Week 7-10</p>
        </div>

        <div className="border rounded-lg p-3">
          <h3 className="font-semibold">Phase 4</h3>
          <p>Interview / Exam Prep</p>
          <p className="text-muted-foreground">Week 11-12</p>
        </div>
      </div>
    </div>

    <div className="grid lg:grid-cols-2 gap-4 mb-4">
      {/* Daily Timetable */}
      <div className="border rounded-xl p-4">
        <h2 className="font-bold text-lg mb-3">
          📅 Daily Timetable
        </h2>

        <div className="space-y-2 text-sm">
          <div>08:00 - 10:00 → {topicList[0] || "Core Topic"}</div>
          <div>10:15 - 11:15 → Practice Questions</div>
          <div>11:30 - 12:30 → Revision</div>
          <div>07:00 - 08:00 → {topicList[1] || "Projects"}</div>
          <div>08:00 - 08:30 → Notes Review</div>
        </div>
      </div>

      {/* Weekly Goals */}
      <div className="border rounded-xl p-4">
        <h2 className="font-bold text-lg mb-3">
          🎯 Weekly Goals
        </h2>

        <ul className="space-y-2 text-sm">
          <li>✓ Complete planned study sessions</li>
          <li>✓ Solve 25 practice problems</li>
          <li>✓ Build one mini project</li>
          <li>✓ Attempt one mock test</li>
          <li>✓ Revise weak concepts</li>
        </ul>
      </div>
    </div>

    <div className="grid lg:grid-cols-3 gap-4">
      {/* Priorities */}
      <div className="border rounded-xl p-4">
        <h2 className="font-bold text-lg mb-3">
          🔥 Topic Prioritization
        </h2>

        <ol className="text-sm space-y-2 list-decimal list-inside">
          {topicList.map((topic, index) => (
            <li key={index}>{topic}</li>
          ))}
        </ol>
      </div>

      {/* Revision */}
      <div className="border rounded-xl p-4">
        <h2 className="font-bold text-lg mb-3">
          🔄 Revision Strategy
        </h2>

        <ul className="text-sm space-y-2">
          <li>Day 1 → Learn Concept</li>
          <li>Day 3 → Quick Revision</li>
          <li>Day 7 → Practice Questions</li>
          <li>Day 14 → Mock Assessment</li>
        </ul>
      </div>

      {/* Resources */}
      <div className="border rounded-xl p-4">
        <h2 className="font-bold text-lg mb-3">
          📚 Recommended Resources
        </h2>

        <ul className="text-sm space-y-2">
          <li>• Striver A2Z DSA Sheet</li>
          <li>• NeetCode Roadmap</li>
          <li>• Gate Smashers</li>
          <li>• Official Documentation</li>
        </ul>
      </div>
    </div>

    {/* Summary */}
    <div className="mt-5 border rounded-xl p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
      <h3 className="font-semibold mb-2">
        🤖 AI Planner Summary
      </h3>

      <p className="text-sm">
        Based on your goal of <strong>{goal}</strong>, current level of{" "}
        <strong>{level}</strong>, and available study time of{" "}
        <strong>{hours} hours/day</strong>, this roadmap focuses on{" "}
        <strong>{topics}</strong>. Estimated preparation timeline:
        <strong> 10-14 weeks</strong>.
      </p>
    </div>
  </>
)}
      </div>
    </div>
  );
}