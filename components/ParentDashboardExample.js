/**
 * components/ParentDashboardExample.js
 * 
 * Example component showing how to integrate achievements in a parent dashboard.
 * Parents can view their child's achievements and progress.
 * 
 * NOTE: This is an example component. Implement according to your requirements.
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Award, TrendingUp, Calendar } from "lucide-react";
import AchievementProgress from "./AchievementProgress";
import StudentAchievementCard from "./StudentAchievementCard";

/**
 * Example ParentDashboard Achievement Section
 * Shows child's achievements and progress
 */
const ParentDashboardAchievements = ({ childId, childName }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    unlockedBadges: 0,
    totalBadges: 3,
    attendancePercentage: 0,
    nextMilestone: "",
  });

  useEffect(() => {
    const fetchChildAchievements = async () => {
      try {
        setLoading(true);
        // This would use your auth context to get the parent's token
        // Then fetch the child's achievements
        const token = "parent-token"; // Replace with actual token

        const res = await fetch(
          `/api/parent/child-achievements?childId=${childId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setAchievements(data.badges || []);
          setStats({
            unlockedBadges: data.badges.filter((b) => b.unlocked).length,
            totalBadges: data.total || 3,
            attendancePercentage: data.attendancePercentage || 0,
            nextMilestone: data.nextMilestone || "Early Bird - 5 more days",
          });
        }
      } catch (err) {
        console.error("Failed to fetch child achievements:", err);
      } finally {
        setLoading(false);
      }
    };

    if (childId) {
      fetchChildAchievements();
    }
  }, [childId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Award className="w-8 h-8 text-yellow-400" />
            {childName}'s Achievements
          </h2>
          <p className="text-gray-400 mt-1">
            Track your child's academic achievements and milestones
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/30 rounded-lg p-4"
        >
          <p className="text-yellow-400 text-sm font-semibold">Badges Unlocked</p>
          <p className="text-3xl font-bold text-white mt-2">
            {stats.unlockedBadges}/{stats.totalBadges}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-4"
        >
          <p className="text-blue-400 text-sm font-semibold">Attendance</p>
          <p className="text-3xl font-bold text-white mt-2">
            {stats.attendancePercentage}%
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-4"
        >
          <p className="text-green-400 text-sm font-semibold">Progress</p>
          <p className="text-3xl font-bold text-white mt-2">
            {Math.round((stats.unlockedBadges / stats.totalBadges) * 100)}%
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4"
        >
          <p className="text-purple-400 text-sm font-semibold">Next Goal</p>
          <p className="text-sm text-white mt-2 line-clamp-2">
            {stats.nextMilestone}
          </p>
        </motion.div>
      </div>

      {/* Detailed Achievement View */}
      {loading ? (
        <div className="bg-black/20 backdrop-blur-lg rounded-lg border border-white/10 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
        </div>
      ) : achievements.length > 0 ? (
        <div className="bg-black/20 backdrop-blur-lg rounded-lg border border-white/10 p-6">
          <AchievementProgress
            badges={achievements}
            title={`${childName}'s Achievements`}
            showStats={true}
            size="default"
          />
        </div>
      ) : (
        <div className="bg-black/20 backdrop-blur-lg rounded-lg border border-white/10 p-8 text-center">
          <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No achievements data available yet.</p>
        </div>
      )}

      {/* Achievement Tips */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          How to Earn Badges
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-semibold text-white">Perfect Attendance</p>
              <p className="text-sm text-gray-400">
                Attend classes for 30 consecutive days
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🌅</span>
            <div>
              <p className="font-semibold text-white">Early Bird</p>
              <p className="text-sm text-gray-400">
                Arrive before 8:00 AM on 10 different days
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="font-semibold text-white">Consistency Champion</p>
              <p className="text-sm text-gray-400">
                Maintain 95%+ attendance during the semester
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Example: Parent Dashboard Integration
 * 
 * Usage:
 * <ParentDashboardAchievements 
 *   childId="student-uid" 
 *   childName="John Doe"
 * />
 */

export default ParentDashboardAchievements;
