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
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Service Worker registration failed silently
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
      // Silently handle localStorage errors
    }

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setTimeout(() => setIsVisible(true), 5000);
    };

    const appInstalledHandler = () => {
      setIsInstalled(true);
      setIsVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", appInstalledHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    try {
      const result = await installPrompt.prompt();
      setInstallPrompt(null);
      setIsVisible(false);
    } catch (error) {
      // Silently handle installation errors
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("pwa-install-dismissed", "true");
      }
    } catch (error) {
      // Silently handle localStorage errors
    }
  };

  if (!isMounted) return null;
  if (isInstalled || !installPrompt) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-500 ease-out transform ${
        isVisible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 translate-y-8 pointer-events-none"
      }`}
    >
      <div className="relative w-full max-w-sm sm:max-w-[360px] mx-auto bg-slate-900/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:border-purple-500/40 hover:shadow-purple-500/10">
        {/* Ambient Background Glows */}
        <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 relative z-10">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 ring-1 ring-purple-500/30 flex-shrink-0">
            <Download className="h-5 w-5 text-purple-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-extrabold text-base tracking-tight mb-1">
              Install Learnova
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-normal">
              Install our premium app for quick access and offline use!
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={handleInstall}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 cursor-pointer shadow-lg shadow-purple-600/20"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-xl bg-slate-800/80 border border-white/5 text-slate-300 font-semibold text-xs hover:bg-slate-700/80 hover:text-white hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 cursor-pointer"
              >
                Not now
              </button>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-4 pt-4 border-t border-white/5 relative z-10">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-slate-400 text-[11px] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
              Works offline
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
              Fast & reliable
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
              Home screen access
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}