"use client";

import React, { useState } from "react";
import { Users, Clock, CheckCircle, Target, Award, Mail, ChevronRight, FileText } from "lucide-react";

/**
 * SponsorMonitoringPortal Component
 * 
 * A secondary, read-only dashboard for invited sponsors or parents.
 * Provides a transparent way to verify a learner's progression through paid material,
 * displaying high-level metrics like hours studied, quiz scores, and completion percentages.
 */
export default function SponsorMonitoringPortal({ sponsorName = "Acme Corp HR", studentName = "Alex Johnson" }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for the monitored student
  const studentMetrics = {
    hoursStudied: 42.5,
    totalModules: 24,
    completedModules: 18,
    averageQuizScore: 88,
    lastActive: "Today, 10:30 AM",
    recentActivity: [
      { id: 1, action: "Completed Quiz", module: "React Hooks Deep Dive", score: 92, date: "Oct 24, 2023" },
      { id: 2, action: "Watched Video", module: "Advanced State Management", duration: "45 mins", date: "Oct 23, 2023" },
      { id: 3, action: "Submitted Project", module: "Frontend Architecture", grade: "Pending", date: "Oct 21, 2023" }
    ]
  };

  const completionPercentage = Math.round((studentMetrics.completedModules / studentMetrics.totalModules) * 100);

  return (
    <div className="bg-gray-50 min-h-screen p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Portal Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="text-indigo-600" />
              Sponsor Monitoring Portal
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome, <span className="font-semibold text-gray-700">{sponsorName}</span>. Viewing progress for <span className="font-semibold text-gray-700">{studentName}</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium">
              <FileText size={16} /> Export Report
            </button>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
              <Mail size={16} /> Contact Learner
            </button>
          </div>
        </header>

        {/* High-Level Metrics KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="bg-blue-100 p-4 rounded-full text-blue-600">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Hours Studied</p>
              <h3 className="text-3xl font-black text-gray-800">{studentMetrics.hoursStudied}<span className="text-lg text-gray-500 font-medium ml-1">hrs</span></h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="bg-green-100 p-4 rounded-full text-green-600">
              <Target size={28} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Course Progress</p>
              <div className="flex items-end gap-2 mb-2">
                <h3 className="text-3xl font-black text-gray-800">{completionPercentage}%</h3>
                <span className="text-sm font-medium text-gray-500 mb-1">({studentMetrics.completedModules}/{studentMetrics.totalModules})</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full" style={{ width: `${completionPercentage}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="bg-yellow-100 p-4 rounded-full text-yellow-600">
              <Award size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Avg Quiz Score</p>
              <h3 className="text-3xl font-black text-gray-800">{studentMetrics.averageQuizScore}<span className="text-lg text-gray-500 font-medium ml-1">%</span></h3>
            </div>
          </div>

        </div>

        {/* Detailed Tabs & Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Recent Activity
            </button>
            <button 
              onClick={() => setActiveTab("modules")}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'modules' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Module Breakdown
            </button>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">Latest Milestones</h3>
                  <span className="text-sm text-gray-500 flex items-center gap-1">Last Active: <span className="font-semibold text-gray-700">{studentMetrics.lastActive}</span></span>
                </div>
                
                <div className="space-y-4">
                  {studentMetrics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 text-indigo-500">
                          {activity.action.includes("Quiz") ? <Award size={20} /> : <CheckCircle size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{activity.action}</p>
                          <p className="text-sm text-gray-500">{activity.module}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-bold text-gray-800">
                            {activity.score ? `${activity.score}%` : activity.duration || activity.grade}
                          </p>
                          <p className="text-xs text-gray-500">{activity.date}</p>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-indigo-400 transition-colors" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "modules" && (
              <div className="py-8 text-center text-gray-500">
                <Target size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="font-medium">Detailed module breakdown visualization would render here.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
