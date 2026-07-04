"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { FirestoreProvider } from "@/contexts/FirestoreContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RoleThemeProvider } from "@/components/RoleThemeProvider";
import { ReduxProvider } from "@/lib/store/Provider";
import { SessionAwareFetchProvider } from "@/hooks/useSessionMonitor";

export default function AllProviders({ children }) {
  return (
    <ReduxProvider>
      <ThemeProvider>
        <AuthProvider>
          <RoleThemeProvider>
            <SessionAwareFetchProvider>
              <FirestoreProvider>
                <NotificationProvider>{children}</NotificationProvider>
              </FirestoreProvider>
            </SessionAwareFetchProvider>
          </RoleThemeProvider>
        </AuthProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
