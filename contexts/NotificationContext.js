"use client";

import { createContext, useState, useEffect, useRef, useContext } from "react";
import { useFirestoreNotifications } from "@/contexts/FirestoreContext";
import { db } from "@/lib/firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [toastNotifications, setToastNotifications] = useState([]);
  const timersRef = useRef(new Map());
  const { user } = useAuth();
  const { firestoreNotifications, loading: notificationsLoading } = useFirestoreNotifications();

  // Calculate unread count from Firestore notifications
  const unreadCount = firestoreNotifications?.filter(n => !n.read).length || 0;

  // Add a temporary toast notification (auto-dismisses after 5s)
  const addToastNotification = (notification) => {
    const id = Date.now();

    const newNotification = {
      id,
      ...notification,
    };

    setToastNotifications((prev) => [...prev, newNotification]);

    // Show toast alert
    if (notification.message) {
      toast(notification.message, {
        icon: notification.type === 'alert' ? '⚠️' : '🔔',
        duration: 5000,
      });
    }

    // Auto-remove notification after 5s
    const timerId = setTimeout(() => {
      removeToastNotification(id);
      timersRef.current.delete(id);
    }, 5000);

    timersRef.current.set(id, timerId);
  };

  const removeToastNotification = (id) => {
    setToastNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );

    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  };

  const clearToastNotifications = () => {
    setToastNotifications([]);
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
  };

  // Mark a Firestore notification as read
  const markAsRead = async (id) => {
    try {
      if (!user?.uid) return;
      
      const notificationRef = doc(db, "notifications", id);
      await updateDoc(notificationRef, {
        read: true,
        readAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all Firestore notifications as read
  const markAllAsRead = async () => {
    try {
      if (!user?.uid) return;
      
      const unreadNotifications = firestoreNotifications?.filter(n => !n.read) || [];
      
      await Promise.all(
        unreadNotifications.map((notification) =>
          updateDoc(doc(db, "notifications", notification.id), {
            read: true,
            readAt: new Date().toISOString(),
          })
        )
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Create a new notification in Firestore
  const createNotification = async (notificationData) => {
    try {
      if (!user?.uid) return;

      const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
      
      const notification = {
        recipientId: notificationData.recipientId || user.uid,
        type: notificationData.type || "info",
        title: notificationData.title || "",
        message: notificationData.message || "",
        read: false,
        createdAt: serverTimestamp(),
        metadata: notificationData.metadata || {},
        actionUrl: notificationData.actionUrl || null,
      };

      await addDoc(collection(db, "notifications"), notification);
      
      // Also show toast for immediate feedback
      addToastNotification({
        message: notification.message,
        type: notification.type,
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        // Firestore notifications (persistent)
        notifications: firestoreNotifications || [],
        unreadCount,
        notificationsLoading,
        
        // Toast notifications (temporary)
        toastNotifications,
        
        // Actions
        addToastNotification,
        removeToastNotification,
        clearToastNotifications,
        markAsRead,
        markAllAsRead,
        createNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}