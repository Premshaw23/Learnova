"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BellOff, Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { dropdownVariants } from "./constants";
import { dropdownPanelClass, glassPanelStyle, iconBtnClass } from "./glassStyles";

export default function NotificationPanel({
  isOpen,
  onToggle,
  onCloseOthers,
  panelRef,
}) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          onToggle();
          onCloseOthers?.();
        }}
        className={iconBtnClass}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#070B14]"
            />
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`${dropdownPanelClass} w-72`}
            style={glassPanelStyle}
            role="region"
            aria-label="Notifications panel"
          >
            <div className="flex items-center justify-between border-b border-zinc-100/60 dark:border-white/6 px-4 py-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 rounded"
                  aria-label="Mark all notifications as read"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-60 divide-y divide-zinc-100/50 dark:divide-white/5 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-3.5 px-4 py-8 text-center select-none">
                  <div className="rounded-full bg-zinc-100 p-3 text-zinc-400 dark:bg-white/5 dark:text-zinc-500">
                    <BellOff className="h-6 w-6 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      You&apos;re all caught up!
                    </p>
                    <p className="mx-auto max-w-[180px] text-[10px] leading-normal text-zinc-400 dark:text-zinc-500">
                      No new notifications to display.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        markAsRead(n.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/60 ${
                      !n.read ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                    }`}
                  >
                    <p className="line-clamp-2 text-sm text-zinc-800 dark:text-zinc-200">
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
