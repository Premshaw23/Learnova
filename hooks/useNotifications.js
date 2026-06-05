"use client";

import { useContext } from "react";
import { NotificationContext } from "@/contexts/NotificationContext";

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }

  return context;
}
