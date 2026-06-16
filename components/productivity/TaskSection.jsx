import { motion } from "framer-motion";
import {
  ListTodo,
  Plus,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";

export function TaskSection({
  tasks,
  taskInput,
  taskPriority,
  setTaskInput,
  setTaskPriority,
  addTask,
  toggleTask,
  moveTask,
  removeTask,
  taskCompletion,
  PRIORITIES,
  isDark,
}) {
  return (
    <motion.div
      className={`${
        isDark
          ? "bg-black/40 border border-white/10 backdrop-blur-xl"
          : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
      } rounded-3xl p-6 md:p-8`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-center gap-2 mb-6">
        <ListTodo className="w-5 h-5 text-purple-400" />
        <h3 className="text-2xl font-semibold">Tasks</h3>
      </div>

      <form onSubmit={addTask} className="flex flex-col gap-3 mb-6">
        <input
          value={taskInput}
          onChange={(event) => setTaskInput(event.target.value)}
          placeholder="Add a new task..."
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm border
            ${
              isDark
                ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                : "bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400"
            }
            focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-transparent
            transition-all duration-200`}
        />
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((priority) => (
              <button
                key={priority.value}
                type="button"
                onClick={() => setTaskPriority(priority.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                  taskPriority === priority.value
                    ? priority.active
                    : priority.color
                }`}
              >
                {priority.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="ml-auto px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
            aria-label="Action button"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="mb-6">
        <div
          className={`flex items-center justify-between text-xs mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          <span>Progress</span>
          <span className="font-medium">{taskCompletion}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 dark:bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${taskCompletion}%` }}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {tasks.length === 0 && (
          <p
            className={`text-sm text-center py-8 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            No tasks yet. Add one above.
          </p>
        )}
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 border transition-all duration-200
              ${
                task.done
                  ? isDark
                    ? "bg-white/5 border-white/5 opacity-60"
                    : "bg-slate-50 border-slate-100 opacity-60"
                  : isDark
                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    : "bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300"
              }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button onClick={() => toggleTask(task.id)} className="shrink-0">
                <CheckCircle2
                  className={`w-5 h-5 transition-all duration-200 ${
                    task.done
                      ? "text-purple-400"
                      : isDark
                        ? "text-slate-500 hover:text-purple-400"
                        : "text-slate-300 hover:text-purple-500"
                  }`}
                />
              </button>
              <span
                className={`text-sm truncate ${
                  task.done
                    ? "line-through text-slate-500"
                    : isDark
                      ? "text-slate-200"
                      : "text-slate-800"
                }`}
              >
                {task.text}
              </span>
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider
                  ${PRIORITIES.find((p) => p.value === task.priority)?.color || "border-white/20 text-slate-400"}`}
              >
                {task.priority}
              </span>
            </div>
            <div
              className={`flex items-center gap-0.5 shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              <button
                onClick={() => moveTask(task.id, -1)}
                disabled={index === 0}
                className="p-1 rounded-lg hover:text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveTask(task.id, 1)}
                disabled={index === tasks.length - 1}
                className="p-1 rounded-lg hover:text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => removeTask(task.id)}
                className="p-1 rounded-lg hover:text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
