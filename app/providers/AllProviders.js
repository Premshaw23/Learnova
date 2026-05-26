"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { FirestoreProvider } from "@/contexts/FirestoreContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function AllProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FirestoreProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </FirestoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}