"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, TrendingUp, Target } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function AIProductivityInsights({
  analytics,
  isDark,
}) {
    const { user } = useAuthContext();

  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  const generateInsights = async () => {
  setLoading(true);

  try {
    setLoading(true);

    if (!user) {
      alert("Please login to generate AI insights.");
      return;
    }

    const idToken = await user.getIdToken();

    const response = await fetch("/api/ai-productivity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(analytics),
    });

    const data = await response.json();

    console.log(data);

    if (data.success) {
      setInsights(data.data);
    }
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  return (
    <motion.div
      className={`mt-8 rounded-3xl p-6 ${
        isDark
          ? "bg-black/40 border border-white/10 backdrop-blur-xl"
          : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
      }`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}

      <div className="flex items-center justify-between mb-6">
        <div>
          <p
            className={`text-sm ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            AI Powered Analysis
          </p>

          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            AI Productivity Intelligence Engine
          </h3>
        </div>

        <button
          onClick={generateInsights}
          disabled={loading}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isDark
              ? "bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30"
              : "bg-purple-100 border border-purple-200 text-purple-700 hover:bg-purple-200"
          }`}
        >
          {loading ? "Analyzing..." : "Generate AI Insights"}
        </button>
      </div>

      {/* Empty State */}

      {!insights && !loading && (
        <div
          className={`rounded-2xl p-6 text-center ${
            isDark
              ? "bg-black/30 border border-white/10"
              : "bg-slate-50 border border-slate-200"
          }`}
        >
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-purple-400" />

          <p className="font-medium mb-2">
            Personalized Productivity Guidance
          </p>

          <p
            className={`text-sm ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Generate AI-powered insights based on your focus analytics and
            productivity trends.
          </p>
        </div>
      )}

      {/* Loading State */}

      {loading && (
        <div
          className={`rounded-2xl p-6 text-center ${
            isDark
              ? "bg-black/30 border border-white/10"
              : "bg-slate-50 border border-slate-200"
          }`}
        >
          <Brain className="w-10 h-10 mx-auto mb-3 animate-pulse text-purple-400" />

          <p>Analyzing productivity patterns...</p>
        </div>
      )}

      {/* Results */}

      {insights && !loading && (
  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Strength */}

          <div
            className={`rounded-2xl p-4 ${
              isDark
                ? "bg-black/30 border border-white/10"
                : "bg-slate-50 border border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-green-400" />
              <h4 className="font-semibold">Strength</h4>
            </div>

            <p
              className={`text-sm ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {insights.strength}
            </p>
          </div>

          {/* Improvement */}

          <div
            className={`rounded-2xl p-4 ${
              isDark
                ? "bg-black/30 border border-white/10"
                : "bg-slate-50 border border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h4 className="font-semibold">Improvement Area</h4>
            </div>

            <p
              className={`text-sm ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {insights.improvement}
            </p>
          </div>

          {/* Recommendation */}

          <div
            className={`rounded-2xl p-4 ${
              isDark
                ? "bg-black/30 border border-white/10"
                : "bg-slate-50 border border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-yellow-400" />
              <h4 className="font-semibold">Recommendation</h4>
            </div>

            <p
              className={`text-sm ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {insights.recommendation}
            </p>
          </div>
          {/* Productivity Score */}

<div
  className={`rounded-2xl p-4 ${
    isDark
      ? "bg-black/30 border border-white/10"
      : "bg-slate-50 border border-slate-200"
  }`}
>
  <div className="flex items-center gap-2 mb-3">
    <Brain className="w-5 h-5 text-purple-400" />
    <h4 className="font-semibold">Productivity Score</h4>
  </div>

  <p className="text-3xl font-bold text-purple-400">
    {insights.productivityScore ?? "--"}
  </p>
</div>

{/* Weekly Goal */}

<div
  className={`rounded-2xl p-4 ${
    isDark
      ? "bg-black/30 border border-white/10"
      : "bg-slate-50 border border-slate-200"
  }`}
>
  <div className="flex items-center gap-2 mb-3">
    <Target className="w-5 h-5 text-green-400" />
    <h4 className="font-semibold">Weekly Goal</h4>
  </div>

  <p
    className={`text-sm ${
      isDark ? "text-slate-300" : "text-slate-600"
    }`}
  >
    {insights.weeklyGoal}
  </p>
</div>

{/* Focus Pattern */}

<div
  className={`rounded-2xl p-4 ${
    isDark
      ? "bg-black/30 border border-white/10"
      : "bg-slate-50 border border-slate-200"
  }`}
>
  <div className="flex items-center gap-2 mb-3">
    <TrendingUp className="w-5 h-5 text-cyan-400" />
    <h4 className="font-semibold">Focus Pattern</h4>
  </div>

  <p
    className={`text-sm ${
      isDark ? "text-slate-300" : "text-slate-600"
    }`}
  >
    {insights.focusPattern}
  </p>
</div>

{/* Next Action */}

<div
  className={`rounded-2xl p-4 ${
    isDark
      ? "bg-black/30 border border-white/10"
      : "bg-slate-50 border border-slate-200"
  }`}
>
  <div className="flex items-center gap-2 mb-3">
    <Sparkles className="w-5 h-5 text-yellow-400" />
    <h4 className="font-semibold">Next Action</h4>
  </div>

  <p
    className={`text-sm ${
      isDark ? "text-slate-300" : "text-slate-600"
    }`}
  >
    {insights.nextAction}
  </p>
</div>
        </div>
      )}
    </motion.div>
  );
}