"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const EngagementTrendChart = ({ history = [] }) => {
  const chartData = history.length
    ? history
    : [
        { date: "Week 1", score: 0 },
        { date: "Week 2", score: 0 },
      ];

  return (
    <div className="bg-card/50 dark:bg-slate-950/80 border border-border rounded-3xl p-5 shadow-lg shadow-slate-900/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Engagement Trend</h3>
          <p className="text-sm text-muted-foreground">
            Monthly engagement trend for the most recent record set.
          </p>
        </div>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 4 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid rgba(148,163,184,0.16)",
                color: "#f8fafc",
              }}
              labelStyle={{ color: "#f8fafc" }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#60A5FA"
              strokeWidth={3}
              dot={{ fill: "#60A5FA", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EngagementTrendChart;
