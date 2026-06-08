"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#f59e0b", "#14b8a6", "#ef4444", "#64748b"];
const STATUS_COLORS = { Pending: "#eab308", Verified: "#22c55e", Rejected: "#ef4444" };

export default function AchievementAnalytics({ analytics, compact = false }) {
  if (!analytics) {
    return (
      <div className="text-center text-gray-400 py-8 text-sm">
        No analytics data available
      </div>
    );
  }

  const verificationData = Object.entries(analytics.verificationStats || {}).map(
    ([name, value]) => ({ name, value })
  );

  const chartHeight = compact ? 180 : 240;

  return (
    <div className={`grid gap-6 ${compact ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 lg:grid-cols-2"}`}>
      <div className="bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4">Achievement Growth</h4>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={analytics.growthTrend || []}>
            <defs>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#0B1120", border: "1px solid #ffffff20", borderRadius: 12 }}
            />
            <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#growthGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4">Category Distribution</h4>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie
              data={analytics.categoryDistribution || []}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={compact ? 60 : 80}
              label={({ category, percent }) =>
                `${category} ${(percent * 100).toFixed(0)}%`
              }
            >
              {(analytics.categoryDistribution || []).map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#0B1120", border: "1px solid #ffffff20", borderRadius: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4">Verification Status</h4>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={verificationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#0B1120", border: "1px solid #ffffff20", borderRadius: 12 }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {verificationData.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#64748b"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4">Top Performers</h4>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={analytics.topPerformers || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="studentName"
              width={100}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{ background: "#0B1120", border: "1px solid #ffffff20", borderRadius: 12 }}
            />
            <Bar dataKey="count" fill="#a855f7" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
