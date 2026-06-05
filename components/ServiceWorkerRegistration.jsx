"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            // Service Worker registered
          },
          (err) => {
            console.error("Service Worker registration failed:", err);
          }
        );
      });
    }
  }, []);

  return null;
}
