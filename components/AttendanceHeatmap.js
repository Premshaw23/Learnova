import React, { useMemo } from "react";

const STATUS_STYLES = {
  present: "bg-green-500 hover:bg-green-400",
  late: "bg-yellow-500 hover:bg-yellow-400",
  absent: "bg-red-500 hover:bg-red-400",
  none: "bg-gray-700/50 hover:bg-gray-600/60",
};

const STATUS_LABELS = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  none: "No class",
};

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatLabel(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Deterministic mock status from ISO date when no activity row exists. */
function mockStatusFromDate(isoDate, isWeekend) {
  if (isWeekend) {
    return "none";
  }
  const hash = isoDate.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const bucket = hash % 10;
  if (bucket < 7) return "present";
  if (bucket === 7) return "late";
  if (bucket === 8) return "absent";
  return "none";
}

function buildHeatmapDays(recentActivity) {
  const statusByDate = {};
  recentActivity.forEach((entry) => {
    if (entry?.date && entry?.status) {
      statusByDate[entry.date] = entry.status;
    }
  });

  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 83; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = dateKey(day);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const status =
      statusByDate[key] ?? mockStatusFromDate(key, isWeekend);

    days.push({
      date: key,
      status,
      label: formatLabel(day),
    });
  }

  return days;
}

const AttendanceHeatmap = ({ recentActivity = [] }) => {
  const days = useMemo(
    () => buildHeatmapDays(recentActivity),
    [recentActivity],
  );

  const weeks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7));
    }
    return chunks;
  }, [days]);

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">
          12-week attendance
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-500" />
            Present
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500" />
            Late
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            Absent
          </span>
        </div>
      </div>

      <div
        className="flex gap-1 overflow-x-auto pb-1"
        role="img"
        aria-label="Attendance heatmap for the last twelve weeks"
      >
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.label}: ${STATUS_LABELS[day.status] ?? day.status}`}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-colors cursor-default ${
                  STATUS_STYLES[day.status] ?? STATUS_STYLES.none
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Hover a cell for date and status. Recent activity rows override mock
        data.
      </p>
    </div>
  );
};

export default AttendanceHeatmap;
