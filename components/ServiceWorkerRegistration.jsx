"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            registration.addEventListener("updatefound", () => {
              const installingWorker = registration.installing;
              if (!installingWorker) return;

              installingWorker.addEventListener("statechange", () => {
                if (
                  installingWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  toast.custom(
                    (t) => (
                      <div className="flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 shadow-lg text-white">
                        <span className="text-sm">
                          New version available! Refresh to update.
                        </span>
                        <button
                          onClick={() => {
                            toast.dismiss(t.id);
                            registration.waiting?.postMessage({
                              type: "SKIP_WAITING",
                            });
                            window.location.reload();
                          }}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition"
                        >
                          Refresh
                        </button>
                      </div>
                    ),
                    { duration: Infinity }
                  );
                }
              });
            });
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
