"use client";

import { createContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { throttle } from "@/lib/throttle";

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timersRef = useRef(new Map());

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  // Use the robust ID generation from master
  const addNotificationRaw = useCallback((notification) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newNotification = { id, ...notification };

    setNotifications((prev) => [...prev, newNotification]);

    const timerId = setTimeout(() => {
      removeNotification(id);
      timersRef.current.delete(id);
    }, 5000);

    timersRef.current.set(id, timerId);
  }, [removeNotification]);

  // Keep the throttle logic from your perf branch
  const throttledAddRef = useRef(null);
  if (!throttledAddRef.current) {
    throttledAddRef.current = throttle((notif) => addNotificationRaw(notif), 200);
  }
  const addNotification = throttledAddRef.current;

  const clearNotifications = useCallback(() => {
    // Cancel any pending auto-remove timeouts so callbacks cannot fire
    // after the notifications have already been cleared.
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current.clear();
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
        prev.map((notification) => ({
        ...notification,
        read: true,
        }))
    );
  }, []);

  useEffect(() => {
    return () => {
      // clear any remaining timeouts when provider unmounts
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}