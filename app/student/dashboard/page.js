"use client";


import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

// Dynamically import the dashboard component
const StudentDashboard = dynamic(
  () => import("@/components/StudentDashboard"),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

export default function Student() {
  const [shippingState, setShippingState] = useState({
    isLoading: true,
    isLocked: false,
    trackingUrl: "",
  });

  useEffect(() => {
    async function checkAntiSpoilerLock() {
      try {
        // Replace this URL with your actual order/shipping status API endpoint
        const response = await fetch("/api/student/dashboard/route"); 
        const data = await response.json();

        // Expecting backend to return { locked: true/false, trackingUrl: "..." }
        setShippingState({
          isLoading: false,
          isLocked: data.locked,
          trackingUrl: data.trackingUrl || "",
        });
      } catch (error) {
        console.error("Error checking shipping status:", error);
        // Fallback: If API fails, default to unlocked so student isn't permanently broken
        setShippingState({ isLoading: false, isLocked: false, trackingUrl: "" });
      }
    }

    checkAntiSpoilerLock();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      {shippingState.isLoading ? (
        <DashboardSkeleton />
      ) : shippingState.isLocked ? (
        /* --- ANTI-SPOILER LOCKED VIEW --- */
        <div style={styles.container}>
          <div style={styles.card}>
            <span style={styles.icon}>🎁</span>
            <h2 style={styles.title}>Your Surprise Box is on its Way!</h2>
            <p style={styles.text}>
              To keep the unboxing experience a surprise for everyone, your digital 
              dashboard details are locked until your physical package is officially delivered.
            </p>
            {shippingState.trackingUrl && (
              <a
                href={shippingState.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.button}
              >
                Track Your Shipment Live
              </a>
            )}
          </div>
        </div>
      ) : (
        /* --- NORMAL UNLOCKED DASHBOARD --- */
        <StudentDashboard />
      )}
    </ProtectedRoute>
  );
}

/* --- Inline Minimal Styling --- */
const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "80vh",
    fontFamily: "system-ui, sans-serif",
    padding: "20px",
  },
  card: {
    textAlign: "center",
    maxWidth: "450px",
    padding: "40px 30px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    background: "#fff",
    border: "1px solid #eaeaea",
  },
  icon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "16px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#111",
    marginBottom: "12px",
  },
  text: {
    fontSize: "15px",
    color: "#666",
    lineHeight: "1.6",
    marginBottom: "24px",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#0070f3",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "500",
    transition: "background 0.2s",
  },
};
