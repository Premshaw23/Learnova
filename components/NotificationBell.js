"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiClient";
import { extractNotificationsFromResponse } from "@/lib/notificationResponse";
import { useSafePolling } from "@/hooks/useSafePolling";
import { useIsMounted } from "@/hooks/useIsMounted";

// AbortController for fetch requests
const createAbortController = () => {
  try {
    return new AbortController();
  } catch {
    return null; // Fallback for environments without AbortController
  }
};

function timeAgo(date) {
  if (!date) {
    return "just now";
  }

  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
}

const typeStyles = {
  attendance:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200",
  notice:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200",
  alert: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-200",
};

export default function NotificationBell() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isMounted = useIsMounted();

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const previousIdsRef = useRef(new Set());
  const hasLoadedRef = useRef(false);

  useSafePolling(
    async (signal) => {
      if (loading) {
        return;
      }

      if (!user?.uid) {
        setNotifications([]);
        previousIdsRef.current = new Set();
        hasLoadedRef.current = false;
        setError("");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const token = await user.getIdToken();
        const data = await apiFetch(
          `/api/notifications?userId=${encodeURIComponent(user.uid)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal,
          }
        );

        const fetchedNotifications = extractNotificationsFromResponse(data);
        const currentIds = new Set(
          fetchedNotifications
            .map(
              (notification) =>
                notification._id?.toString?.() || notification._id
            )
            .filter(Boolean)
        );

        if (hasLoadedRef.current) {
          const newNotifications = fetchedNotifications.filter(
            (notification) => {
              const id = notification._id?.toString?.() || notification._id;
              return id && !previousIdsRef.current.has(id);
            }
          );

          if (newNotifications.length > 0) {
            newNotifications.forEach((notification) => {
              toast.success(notification.message);
            });
          }
        }

        previousIdsRef.current = currentIds;
        hasLoadedRef.current = true;
        setNotifications(fetchedNotifications);
        setError("");
      } catch (err) {
        if (err?.name !== "AbortError") {
          setError("Unable to load notifications");
          setNotifications([]);
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    30000,
    [user?.uid, loading]
  );

  const markNotificationsAsRead = useCallback(async () => {
    if (!user?.uid) {
      return;
    }

    try {
      const token = await user.getIdToken();
      await apiFetch("/api/notifications", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { userId: user.uid },
      });

      if (isMounted()) {
        setNotifications((currentNotifications) =>
          currentNotifications.map((notification) => ({
            ...notification,
            read: true,
          }))
        );
        setError("");
      }
    } catch (err) {
      if (isMounted())
        setError(err.message || "Unable to update notifications");
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggleDropdown = async () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);

    if (nextOpen) {
      await markNotificationsAsRead();
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggleDropdown}
        className="relative flex items-center justify-center rounded-xl p-2 text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed inset-x-4 top-20 z-[100] rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:absolute sm:right-0 sm:top-full sm:mt-3 sm:w-96 sm:max-w-none">
          <div className="flex items-start justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Notifications
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Latest updates
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    markNotificationsAsRead();
                  }}
                  className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400"
                >
                  Mark all read
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                Loading notifications...
              </div>
            ) : null}

            {error ? (
              <div className="px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                {error}
              </div>
            ) : null}

            {!isLoading && !error && notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                No notifications yet
              </div>
            ) : null}

            {!isLoading && !error
              ? notifications.map((notification) => (
                  <div
                    key={notification._id || notification.id}
                    className={`border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-900 ${notification.read ? "bg-white dark:bg-zinc-950" : "bg-blue-50/60 dark:bg-blue-950/20"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p
                          className={`text-sm ${notification.read ? "font-medium text-zinc-700 dark:text-zinc-200" : "font-semibold text-zinc-900 dark:text-zinc-50"}`}
                        >
                          {notification.message}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${typeStyles[notification.type] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"}`}
                          >
                            {notification.type}
                          </span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {timeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      {!notification.read ? (
                        <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                      ) : null}
                    </div>
                  </div>
                ))
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
