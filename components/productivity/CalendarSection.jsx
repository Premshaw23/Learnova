import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";

export function CalendarSection({
  calendar,
  monthLabel,
  selectedDateLabel,
  selectedDateKey,
  setSelectedDateKey,
  agendaItems,
  agendaSummaryForSelectedDate,
  monthOffset,
  setMonthOffset,
  calendarFilter,
  setCalendarFilter,
  TIME_BLOCKS,
  WEEK_DAYS,
  todayKey,
  isDark
}) {
  return (
    <motion.div
      className={`${isDark
          ? "bg-black/40 border border-white/10 backdrop-blur-xl"
          : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
        } rounded-3xl p-6 md:p-8`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <p className={`text-sm ${isDark ? "text-slate-200" : "text-slate-800"
            }`}
          >Calendar Pulse</p>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-300" />
            {monthLabel}
          </h2>
          <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"} mt-1`}>
            {selectedDateLabel} - {agendaSummaryForSelectedDate.total} items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((prev) => prev - 1)}
            className={`px-3 py-2 rounded-xl ${isDark
                ? "bg-white/10 border border-white/10 text-white"
                : "bg-slate-100 border border-slate-300 text-slate-900"
              }`}
          >
            Prev
          </button>
          <button
            onClick={() => setMonthOffset(0)}
            className={`px-3 py-2 rounded-xl ${isDark
                ? "bg-white/10 border border-white/10 text-white"
                : "bg-slate-100 border border-slate-300 text-slate-900"
              }`}
          >
            Today
          </button>
          <button
            onClick={() => setMonthOffset((prev) => prev + 1)}
            className={`px-3 py-2 rounded-xl ${isDark
                ? "bg-white/10 border border-white/10 text-white"
                : "bg-slate-100 border border-slate-300 text-slate-900"
              }`}
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <button
          type="button"
          onClick={() => setCalendarFilter("all")}
          className={`px-3 py-1 rounded-full text-xs border transition ${calendarFilter === "all"
              ? "bg-white/10 border border-white/20 text-white"
              : " border border-white/10 text-slate-300"
            }`}
        >
          All
        </button>
        {TIME_BLOCKS.map((block) => (
          <button
            key={block.label}
            type="button"
            onClick={() => setCalendarFilter(block.label)}
            className={`px-3 py-1 rounded-full text-xs border transition ${calendarFilter === block.label
                ? "bg-white/10 border-white/20 text-white"
                : "border-white/10 text-slate-300"
              }`}
          >
            <span className={`inline-block h-2 w-2 rounded-full mr-2 ${block.color}`} />
            {block.label}
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-2 text-xs ${isDark ? "text-slate-300" : "text-slate-600"} mb-3`}>
        {WEEK_DAYS.map((day) => (
          <div key={day} className="text-center">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {calendar.cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} />;
          }
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          const isToday = key === todayKey;
          const isSelected = key === selectedDateKey;
          const agendaListForDay = agendaItems[key] || [];
          const agendaCountForDay = agendaListForDay.length;
          const agendaCountsByLabel = agendaListForDay.reduce(
            (acc, item) => {
              acc[item.label] = (acc[item.label] || 0) + 1;
              return acc;
            },
            {}
          );
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDateKey(key)}
              className={`h-16 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-sm transition hover:border-cyan-400/40 hover:${isDark ? "bg-cyan-500/10" : "bg-cyan-300/30"
                } focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${isToday
                  ? isDark
                    ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-100"
                    : "bg-cyan-100 border-cyan-300 text-cyan-900"
                  : isSelected
                    ? isDark
                      ? "bg-purple-500/20 border-purple-400/40 text-purple-100"
                      : "bg-purple-100 border-purple-300 text-purple-900"
                    : isDark
                      ? "bg-white/5 text-slate-200"
                      : "bg-white/80 text-slate-900 border border-slate-200"
                }`}
            >
              <span className="font-semibold">{date.getDate()}</span>
              <div className="mt-1 flex items-center gap-1">
                {agendaCountForDay ? (
                  <span className={`text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {agendaCountForDay} items
                  </span>
                ) : (
                  <span className={`text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>Focus</span>
                )}
                <div className="flex gap-1">
                  {TIME_BLOCKS.filter((block) => {
                    if (calendarFilter === "all") return true;
                    return calendarFilter === block.label;
                  })
                    .filter((block) => agendaCountsByLabel[block.label])
                    .map((block) => (
                      <span
                        key={`${key}-${block.label}`}
                        className={`h-1.5 w-1.5 rounded-full ${block.color} opacity-70`}
                        aria-hidden="true"
                      />
                    ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
