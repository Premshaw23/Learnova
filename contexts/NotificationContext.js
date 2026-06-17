"use client";

import { createContext, useState, useEffect, useRef, useContext, useCallback } from "react";
import { rtdb, isMockAuthMode, MOCK_USER } from "@/lib/firebaseConfig";
import { ref, onValue, off, push, serverTimestamp } from "firebase/database";
import { AuthContext } from "@/contexts/AuthContext";

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const { user } = useContext(AuthContext);
  // Keep timers so we can clear on unmount
  const timersRef = useRef(new Map());

  const addNotification = useCallback((notification) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `notif_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`;

    const newNotification = {
      id,
      read: false,
      timestamp: Date.now(),
      ...notification,
    };

    setNotifications((prev) => {
      // Avoid duplicates
      if (prev.some(n => n.id === id)) return prev;
      return [...prev, newNotification];
    });

    // Auto-remove notification after 8s for real-time alerts
    const timerId = setTimeout(() => {
      removeNotification(id);
      timersRef.current.delete(id);
    }, 8000);

    timersRef.current.set(id, timerId);
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (isMockAuthMode) {
      // Simulate real-time events in mock mode
      const interval = setInterval(() => {
        const mockEvents = [
          { message: "New Quiz Result: You scored 95% in Next.js Advanced!", type: "success" },
          { message: "New Assignment: 'React Server Components' is now available.", type: "info" },
          { message: "Deadline approaching: 'Tailwind CSS' assignment due in 2 hours.", type: "warning" },
        ];
        const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
        addNotification(randomEvent);
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }

    if (!rtdb || !user?.uid) return;

    const notifRef = ref(rtdb, `notifications/${user.uid}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Data is an object of notifications indexed by push ID
        Object.entries(data).forEach(([key, value]) => {
          addNotification({
            id: key,
            ...value,
          });
        });
      }
    });

    return () => unsubscribe();
  }, [user?.uid, addNotification]);

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
        notification.id === id ? { ...notification, read: true } : notification
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
