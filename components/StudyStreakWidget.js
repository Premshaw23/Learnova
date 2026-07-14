import { useStudyStreak } from "@/hooks/useStudyStreak";
import { getLast30Days } from "@/utils/streakUtils";

const MILESTONES = [3, 7, 14, 30];

function getColor(count) {
  if (!count) return "#e5e7eb";
  if (count <= 2) return "#86efac";
  if (count <= 5) return "#22c55e";
  return "#15803d";
}

export default function StudyStreakWidget({ studentId }) {
  const { streak, heatmap, loading } = useStudyStreak(studentId);
  const days = getLast30Days();

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-400">Loading streak...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            🔥 {streak.current} day streak
          </p>
          <p className="text-sm text-gray-500">Best: {streak.best} days</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-10 gap-1">
        {days.map((date) => (
          <div
            key={date}
            title={date}
            className="h-6 w-6 rounded-sm"
            style={{ backgroundColor: getColor(heatmap[date] || 0) }}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {MILESTONES.map((m) => (
          <span
            key={m}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              streak.best >= m
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {streak.best >= m ? "✅" : "⬜"} {m}-day streak
          </span>
        ))}
      </div>
    </div>
  );
}
