"use client";

import React, { useState, useEffect } from "react";
import { Download, CloudOff, CheckCircle, RefreshCcw, Trash2 } from "lucide-react";

/**
 * OfflineModulePinner Component
 * 
 * Allows users to explicitly "pin" course modules for offline caching.
 * Communicates with a Service Worker (PWA) to precache video and reading materials,
 * and tracks offline progress via IndexedDB to sync when the connection is restored.
 */
export default function OfflineModulePinner({ moduleId, moduleTitle, moduleSize = "145 MB" }) {
  const [isOffline, setIsOffline] = useState(false);
  const [downloadState, setDownloadState] = useState("none"); // none, downloading, cached
  const [progress, setProgress] = useState(0);

  // Initialize network status listener
  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => {
      setIsOffline(false);
      triggerSync(); // Sync when connection is restored
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check if this module is already cached (mock implementation for UI)
    const checkCache = async () => {
      if ('caches' in window) {
        const hasCache = await caches.has(`module-${moduleId}`);
        if (hasCache) setDownloadState("cached");
      }
    };
    checkCache();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [moduleId]);

  // Mock function to simulate downloading heavy video/reading materials
  const handlePinModule = () => {
    setDownloadState("downloading");
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 15) + 5;
        if (next >= 100) {
          clearInterval(interval);
          setDownloadState("cached");
          
          // In a real implementation, we would register caches here via SW message
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CACHE_MODULE',
              moduleId: moduleId
            });
          }
          
          return 100;
        }
        return next;
      });
    }, 500);
  };

  const handleRemovePin = async () => {
    if ('caches' in window) {
      await caches.delete(`module-${moduleId}`);
    }
    setDownloadState("none");
    setProgress(0);
  };

  const triggerSync = () => {
    // In a real PWA, this would trigger Background Sync via Service Worker
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((swRegistration) => {
        swRegistration.sync.register(`sync-module-${moduleId}`).catch(() => {});
      });
    }
    // Alternatively, sync progress from IndexedDB directly here
    console.log(`Syncing offline progress for module ${moduleId} back to server...`);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between shadow-lg text-white max-w-3xl mx-auto">
      
      {/* Module Info */}
      <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
        <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-500/30">
          <CloudOff className="text-blue-400" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-100">{moduleTitle}</h3>
          <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
            <span>{moduleSize}</span>
            <span className="w-1 h-1 rounded-full bg-gray-500"></span>
            {isOffline ? (
              <span className="text-yellow-500 flex items-center gap-1"><CloudOff size={14}/> Offline Mode</span>
            ) : (
              <span className="text-green-500">Online</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        {downloadState === "none" && (
          <button 
            onClick={handlePinModule}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all w-full md:w-auto justify-center"
          >
            <Download size={18} /> Pin for Offline
          </button>
        )}

        {downloadState === "downloading" && (
          <div className="flex items-center gap-4 w-full md:w-64 bg-gray-800 p-2 rounded-lg border border-gray-700">
            <RefreshCcw className="animate-spin text-blue-500" size={20} />
            <div className="w-full bg-gray-700 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-gray-300 min-w-[3ch]">{progress}%</span>
          </div>
        )}

        {downloadState === "cached" && (
          <div className="flex items-center gap-3 w-full md:w-auto justify-between">
            <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-4 py-2 rounded-lg border border-green-500/20">
              <CheckCircle size={18} />
              <span className="font-semibold text-sm">Available Offline</span>
            </div>
            <button 
              onClick={handleRemovePin}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Remove Offline Download"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
