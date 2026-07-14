"use client";

const EngagementBreakdown = ({ breakdown = [] }) => {
  return (
    <div className="bg-card/50 dark:bg-slate-950/80 border border-border rounded-3xl p-6 shadow-lg shadow-slate-900/5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-foreground">Engagement Breakdown</h3>
        <p className="text-sm text-muted-foreground">
          See how each engagement dimension contributes to overall performance.
        </p>
      </div>
      <div className="space-y-4">
        {breakdown.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{item.label}</span>
              <span className="font-semibold text-foreground">{Math.round(item.value)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
                style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EngagementBreakdown;
