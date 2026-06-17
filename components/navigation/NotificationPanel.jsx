"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BellOff, Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotices } from "@/contexts/FirestoreContext";
import { useAuth } from "@/hooks/useAuth";
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

  // feat #2184: notice unread badge
  // Count notices that the user hasn't read yet by checking
  // the readNotices array stored on their Firestore profile.
  const { notices } = useNotices();
  const { userProfile } = useAuth();
  const readNoticeIds = new Set(userProfile?.readNotices || []);
  const unreadNoticeCount = notices.filter((n) => !readNoticeIds.has(n.id)).length;

  // Combined badge — show dot if either notifications OR notices are unread
  const hasAnyUnread = unreadCount > 0 || unreadNoticeCount > 0;

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
          {hasAnyUnread && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#070B14]"
            />
          )}
        </AnimatePresence>

        {/* Unread notice count badge — separate pill */}
        <AnimatePresence>
          {unreadNoticeCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-[#070B14]"
            >
              {unreadNoticeCount > 9 ? "9+" : unreadNoticeCount}
            </motion.span>
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
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Unread notices summary link */}
{unreadNoticeCount > 0 && (
              <a href="/notices"
                className="flex items-center justify-between border-b border-zinc-100/60 dark:border-white/6 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                    <Bell className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {unreadNoticeCount} unread notice{unreadNoticeCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className="text-xs text-indigo-500 font-semibold">
                  View →
                </span>
              </a>
            )}

            <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100/50 dark:divide-white/5">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-3.5 select-none">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/6">
                    <BellOff className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      All caught up!
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      No new notifications
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-white/5 ${
                      !notif.read ? "bg-indigo-50/50 dark:bg-indigo-500/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!notif.read && (
                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />
                      )}
                      <div className={!notif.read ? "" : "pl-5"}>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {notif.title}
                        </p>
                        {notif.message && (
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                            {notif.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
