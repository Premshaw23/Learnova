"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    try {
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (dismissed) {
        return;
      }
    } catch (error) {
      console.error("Failed to read localStorage:", error);
    }

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setTimeout(() => setIsVisible(true), 5000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsVisible(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    try {
      const result = await installPrompt.prompt();

      if (result.outcome === "accepted") {
        setIsVisible(false);
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error("Error during installation:", error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("pwa-install-dismissed", "true");
      }
    } catch (error) {
      console.error("Failed to save preference:", error);
    }
  };

  if (!isMounted) return null;

  if (isInstalled || !isVisible || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-br from-purple-900/95 to-accent/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl p-6 max-w-sm">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="bg-white/10 rounded-xl p-3">
            <Download className="w-8 h-8 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-2">
              Install Learnova
            </h3>
            <p className="text-white/80 text-sm mb-4">
              Install our app for quick access and offline use!
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleInstall}
                className="flex-1 bg-white text-purple-900 font-semibold py-2.5 px-4 rounded-lg hover:bg-white/90 transition-all duration-300 hover:scale-105"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 text-white/80 hover:text-white transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <ul className="space-y-2 text-white/70 text-xs">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
              Works offline
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
              Fast & reliable
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
              Home screen access
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}