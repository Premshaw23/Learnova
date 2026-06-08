"use client";

import { useState } from "react";

const weeklyData = [
  { day: "Mon", attendance: 100 },
  { day: "Tue", attendance: 80 },
  { day: "Wed", attendance: 100 },
  { day: "Thu", attendance: 60 },
  { day: "Fri", attendance: 100 },
];

const monthlyData = [
  { month: "Jan", attendance: 85 },
  { month: "Feb", attendance: 78 },
  { month: "Mar", attendance: 92 },
  { month: "Apr", attendance: 88 },
  { month: "May", attendance: 76 },
];

const subjectData = [
  { subject: "Math", attendance: 90 },
  { subject: "Science", attendance: 75 },
  { subject: "English", attendance: 85 },
  { subject: "History", attendance: 60 },
  { subject: "PE", attendance: 95 },
];

const getColor = (value) => {
  if (value >= 75) return "bg-green-500";
  if (value >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

const getTextColor = (value) => {
  if (value >= 75) return "text-green-400";
  if (value >= 60) return "text-yellow-400";
  return "text-red-400";
};

export default function AttendanceChart() {
  const [activeTab, setActiveTab] = useState("weekly");

  const overallAttendance = 82;

  return (
    <div className="bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        📈 Attendance Analytics
      </h3>

      {/* Overall Badge */}
      <div className="flex items-center space-x-4 mb-6">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg border-4 ${
            overallAttendance >= 75
              ? "border-green-500"
              : overallAttendance >= 60
                ? "border-yellow-500"
                : "border-red-500"
          }`}
        >
          {overallAttendance}%
        </div>

        <div>
          <p className="text-white font-medium">Overall Attendance</p>

          <p
            className={`text-sm font-medium ${getTextColor(overallAttendance)}`}
          >
            {overallAttendance >= 75
              ? "✅ Good Standing"
              : overallAttendance >= 60
                ? "⚠️ At Risk"
                : "🔴 Critical"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        {["weekly", "monthly", "subjects"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-white/60 hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Weekly */}
      {activeTab === "weekly" && (
        <div className="flex items-end justify-between gap-3 h-56">
          {weeklyData.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="relative w-full flex items-end h-44">
                <div
                  className={`w-full rounded-t-xl transition-all duration-500 hover:scale-105 ${getColor(
                    item.attendance
                  )}`}
                  style={{
                    height: `${item.attendance}%`,
                  }}
                />
              </div>

              <div className="mt-2 text-xs text-gray-400">{item.day}</div>

              <div className="text-sm font-semibold text-white mt-1">
                {item.attendance}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly */}
      {activeTab === "monthly" && (
        <div className="space-y-4">
          {monthlyData.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-white text-sm">{item.month}</span>

                <span className="text-white text-sm">{item.attendance}%</span>
              </div>

              <div className="w-full bg-white/10 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getColor(
                    item.attendance
                  )}`}
                  style={{
                    width: `${item.attendance}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subjects */}
      {activeTab === "subjects" && (
        <div className="space-y-3">
          {subjectData.map((item) => (
            <div key={item.subject} className="flex items-center space-x-3">
              <p className="text-white/80 text-sm w-20">{item.subject}</p>

              <div className="flex-1 bg-white/10 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getColor(
                    item.attendance
                  )}`}
                  style={{
                    width: `${item.attendance}%`,
                  }}
                />
              </div>

              <p className="text-white text-sm w-10 text-right">
                {item.attendance}%
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6">
        <span className="flex items-center text-xs text-white/60">
          <span className="w-3 h-3 rounded-full bg-green-500 mr-1" />
          Good (≥75%)
        </span>

        <span className="flex items-center text-xs text-white/60">
          <span className="w-3 h-3 rounded-full bg-yellow-500 mr-1" />
          At Risk (60-75%)
        </span>

        <span className="flex items-center text-xs text-white/60">
          <span className="w-3 h-3 rounded-full bg-red-500 mr-1" />
          Critical (&lt;60%)
        </span>
      </div>
    </div>
  );
}
