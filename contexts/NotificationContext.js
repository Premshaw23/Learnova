"use client";

import { createContext, useState } from "react";

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now();

    const newNotification = {
      id,
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);

    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const clearNotifications = () => {
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