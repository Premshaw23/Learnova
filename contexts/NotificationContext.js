"use client";

import { createContext, useState, useEffect, useRef } from "react";

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  // Keep timers so we can clear on unmount
  const timersRef = useRef(new Map());

  const addNotification = (notification) => {
    const id = Date.now();

    const newNotification = {
      id,
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remove notification after 5s. Track timer so it can be cleared
    // if the provider unmounts or the notification is removed early.
    const timerId = setTimeout(() => {
      removeNotification(id);
      // clean up timer map entry
      timersRef.current.delete(id);
    }, 5000);

    timersRef.current.set(id, timerId);
  };

  const removeNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );

    // clear any pending timer for this notification
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  };

  const clearNotifications = () => {
    // Cancel any pending auto-remove timeouts so callbacks cannot fire
    // after the notifications have already been cleared.
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current.clear();
    setNotifications([]);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
        prev.map((notification) => ({
        ...notification,
        read: true,
        }))
    );
  };
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