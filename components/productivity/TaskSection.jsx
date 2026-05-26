import { motion } from "framer-motion";
import { ListTodo, Plus, CheckCircle2, ChevronUp, ChevronDown, X } from "lucide-react";

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
  isDark
}) {
  return (
    <motion.div
      className={`${isDark
          ? "bg-black/40 border border-white/10 backdrop-blur-xl"
          : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
        } rounded-3xl p-6`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <ListTodo className="w-5 h-5 text-emerald-300" />
        <h3 className="text-xl font-semibold">Tasks</h3>
      </div>
      <form onSubmit={addTask} className="flex flex-col gap-3 mb-4">
        <input
          value={taskInput}
          onChange={(event) => setTaskInput(event.target.value)}
          placeholder="Add a new task"
          className={`flex-1 rounded-xl ${isDark
              ? "bg-white/10 border border-white/10 text-white"
              : "bg-slate-100 border border-slate-300 text-slate-900"
            } px-3 py-2 text-sm ${isDark ? "text-white" : "text-slate-900"} placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40`}
        />
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((priority) => (
              <button
                key={priority.value}
                type="button"
                onClick={() => setTaskPriority(priority.value)}
                className={`px-3 py-1 rounded-full text-xs border transition ${priority.color} ${taskPriority === priority.value
                    ? "bg-white/10"
                    : "bg-transparent"
                  }`}
              >
                {priority.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="ml-auto px-3 py-2 rounded-xl bg-cyan-500/80 text-slate-900"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>
      <div className="mb-4">
        <div className={`flex items-center justify-between text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          <span>Completion</span>
          <span>{taskCompletion}%</span>
        </div>
        <div className="h-2 mt-2 rounded-full bg-slate-100/80 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
            style={{ width: `${taskCompletion}%` }}
          />
        </div>
      </div>
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`flex items-center justify-between gap-3 ${isDark
                ? "bg-black/40 border border-white/10 backdrop-blur-xl"
                : "bg-white/80 border border-slate-200 shadow-xl backdrop-blur-xl"
              } rounded-2xl px-3 py-2`}
          >
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => toggleTask(task.id)}
                className={`flex items-center gap-2 ${task.done
                    ? "text-slate-500 line-through"
                    : isDark
                      ? "text-slate-200"
                      : "text-slate-800"
                  }`}
              >
                <CheckCircle2
                  className={`flex items-center gap-2 ${task.done
                      ? "text-slate-500 line-through"
                      : isDark
                        ? "text-slate-200"
                        : "text-slate-800"
                    }`}
                />
                {task.text}
              </button>
              <span
                className={`ml-2 px-2 py-0.5 rounded-full border text-[10px] uppercase ${PRIORITIES.find((priority) => priority.value === task.priority)?.color ||
                  "border-white/20 text-slate-300"
                  }`}
              >
                {task.priority}
              </span>
            </div>
            <div className={`flex items-center gap-1 text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              <button
                onClick={() => moveTask(task.id, -1)}
                disabled={index === 0}
                className={`p-1 rounded-lg ${isDark ? "hover:text-white" : "hover:text-slate-900"} disabled:opacity-40`}
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => moveTask(task.id, 1)}
                disabled={index === tasks.length - 1}
                className={`p-1 rounded-lg ${isDark ? "hover:text-white" : "hover:text-slate-900"} disabled:opacity-40`}
              >
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => removeTask(task.id)}
                className="p-1 rounded-lg hover:text-red-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
