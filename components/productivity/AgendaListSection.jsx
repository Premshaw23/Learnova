import { motion } from "framer-motion";
import { CalendarDays, Plus, ChevronUp, ChevronDown, X } from "lucide-react";

export function AgendaListSection({
  selectedDateLabel,
  agendaForSelectedDate,
  TIME_BLOCKS,
  agendaInput,
  setAgendaInput,
  agendaLabel,
  setAgendaLabel,
  addAgendaItem,
  moveAgendaItem,
  removeAgendaItem,
  isDark
}) {
  return (
    <motion.div
      className={`${isDark
          ? "bg-black/40 border border-white/10 backdrop-blur-xl"
          : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
        } rounded-3xl p-6 `}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className={`w-5 h-5 ${isDark ? "text-purple-300" : "text-purple-600"}`} />
        <div>
          <h3 className="text-xl font-semibold">Agenda</h3>
          <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{selectedDateLabel}</p>
        </div>
      </div>
      <form onSubmit={addAgendaItem} className="flex flex-col gap-3 mb-4">
        <input
          value={agendaInput}
          onChange={(event) => setAgendaInput(event.target.value)}
          placeholder="Add agenda item"
          className={`flex-1 rounded-xl ${isDark
              ? "bg-white/10 border border-white/10 text-white"
              : "bg-slate-100 border border-slate-300 text-slate-900"
            } px-3 py-2 text-sm ${isDark ? "text-white" : "text-slate-900"} placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
        />
        <div className="flex flex-wrap items-center gap-2">
          {TIME_BLOCKS.map((block) => (
            <button
              key={block.label}
              type="button"
              onClick={() => setAgendaLabel(block.label)}

              className={`px-3 py-1 rounded-full text-xs border transition ${agendaLabel === block.label
                  ? isDark
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-slate-100 border-slate-300 text-slate-900"
                  : isDark
                    ? "border-white/10 text-slate-300 hover:text-white"
                    : "border-slate-300 text-slate-700 hover:text-slate-900 bg-white/60"
                }`}

             className={`px-3 py-1 rounded-full text-xs border transition ${
  agendaLabel === block.label
    ? isDark
      ? "bg-white/10 border-white/20 text-white"
      : "bg-slate-200 border-slate-400 text-slate-900"
    : isDark
      ? "border-white/10 text-slate-300 hover:text-white"
      : "border-slate-300 text-slate-700 hover:text-slate-900 bg-white/60"
}`}

            >
              <span className={`inline-block h-2 w-2 rounded-full mr-2 ${block.color}`} />
              {block.label}
            </button>
          ))}
          <button
            type="submit"
            className="ml-auto px-3 py-2 rounded-xl bg-purple-500/80 text-slate-900"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>
      <div className="space-y-3">
        {agendaForSelectedDate.length === 0 ? (
          <div className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            No agenda yet. Add a focus item for this day.
          </div>
        ) : (
          agendaForSelectedDate.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-3 ${isDark
                  ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                  : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
                } rounded-2xl px-3 py-2`}
            >
              <div className={`text-sm ${isDark ? "text-slate-200" : "text-slate-800"
                }`}
              >
                <p className="font-medium">{item.text}</p>
                <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item.time}</p>
                <p className={`text-xs ${isDark ? "text-purple-200" : "text-purple-700"}`}>{item.label}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                <button
                  onClick={() => moveAgendaItem(item.id, -1)}
                  disabled={index === 0}
                  className={`p-1 rounded-lg ${isDark ? "hover:text-white" : "hover:text-slate-900"} disabled:opacity-40`}
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => moveAgendaItem(item.id, 1)}
                  disabled={index === agendaForSelectedDate.length - 1}
                  className={`p-1 rounded-lg ${isDark ? "hover:text-white" : "hover:text-slate-900"} disabled:opacity-40`}
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeAgendaItem(item.id)}
                  className="p-1 rounded-lg hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
