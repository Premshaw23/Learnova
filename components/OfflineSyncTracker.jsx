import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/apiClient';
import {
  queueOfflineProgress,
  getPendingOfflineProgress,
  removeProgressFromQueue,
  getPendingProgressCount
} from '@/services/offlineSyncQueue';

const OfflineSyncTracker = ({ courseId, currentModuleId, currentProgress }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState('Synchronized'); // Synchronized, Queued, Syncing
  const [pendingCount, setPendingCount] = useState(0);

  const retryDelayRef = useRef(1000);
  const isSyncingRef = useRef(false);
  const timeoutRef = useRef(null);

  // Helper to fetch and update pending count from IndexedDB
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingProgressCount();
      setPendingCount(count);
      if (count > 0 && syncStatus !== 'Syncing') {
        setSyncStatus('Queued');
      } else if (count === 0 && syncStatus !== 'Syncing') {
        setSyncStatus('Synchronized');
      }
      return count;
    } catch (err) {
      console.error('[Offline Sync] Failed to get pending count:', err);
      return 0;
    }
  }, [syncStatus]);

  // Real backend sync logic with exponential backoff
  const triggerBackgroundSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    if (typeof window !== 'undefined' && !navigator.onLine) {
      setSyncStatus('Queued');
      return;
    }

    try {
      const pending = await getPendingOfflineProgress();
      if (pending.length === 0) {
        setSyncStatus('Synchronized');
        setPendingCount(0);
        retryDelayRef.current = 1000; // Reset backoff
        return;
      }

      isSyncingRef.current = true;
      setSyncStatus('Syncing');

      const response = await apiFetch('/api/student/course/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pending)
      });

      if (response && response.success) {
        // Clear synced items from IndexedDB
        for (const item of pending) {
          await removeProgressFromQueue(item.id);
        }
        retryDelayRef.current = 1000; // Reset delay on success
        isSyncingRef.current = false;
        await updatePendingCount();
      } else {
        throw new Error('Server sync rejected');
      }
    } catch (err) {
      console.error('[Offline Sync] Background sync failed:', err);
      isSyncingRef.current = false;
      setSyncStatus('Queued');
      await updatePendingCount();

      // Exponential backoff retry logic: delay = delay * 2 (max 30 seconds)
      const currentDelay = retryDelayRef.current;
      retryDelayRef.current = Math.min(currentDelay * 2, 30000);

      console.log(`[Offline Sync] Retrying sync in ${currentDelay}ms`);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        triggerBackgroundSync();
      }, currentDelay);
    }
  }, [updatePendingCount]);

  // 1. Monitor live connection stability states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      updatePendingCount().then((count) => {
        if (count > 0 && navigator.onLine) {
          triggerBackgroundSync();
        }
      });

      const handleOnline = () => {
        setIsOnline(true);
        triggerBackgroundSync();
      };
      const handleOffline = () => {
        setIsOnline(false);
        setSyncStatus('Queued');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [triggerBackgroundSync, updatePendingCount]);

  // 2. Queue management interceptor for progress shifts
  useEffect(() => {
    let active = true;

    const handleProgressUpdate = async () => {
      // Don't sync mock or initial values if they're empty or invalid
      if (!courseId || !currentModuleId) return;

      if (!isOnline) {
        const backupPayload = {
          courseId,
          currentModuleId,
          progress: currentProgress,
          timestamp: new Date().toISOString()
        };
        await queueOfflineProgress(backupPayload);
        if (active) {
          setSyncStatus('Queued');
          await updatePendingCount();
        }
      } else {
        // If online, we queue and run sync
        const backupPayload = {
          courseId,
          currentModuleId,
          progress: currentProgress,
          timestamp: new Date().toISOString()
        };
        await queueOfflineProgress(backupPayload);
        if (active) {
          triggerBackgroundSync();
        }
      }
    };

    handleProgressUpdate();

    return () => {
      active = false;
    };
  }, [currentProgress, isOnline, courseId, currentModuleId, triggerBackgroundSync, updatePendingCount]);

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs max-w-md mx-auto my-4 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`relative flex h-3 w-3`}>
            {isOnline && syncStatus === 'Synchronized' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <div>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Network Data Telemetry</h4>
            <p className="text-[11px] text-slate-400 font-medium">
              Mode: {isOnline ? 'Online (Cloud Connection)' : 'Offline (Local Cache Active)'}
            </p>
          </div>
        </div>

        {/* Dynamic Status Badges */}
        <div>
          <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide border ${
            syncStatus === 'Synchronized' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            syncStatus === 'Queued' ? 'bg-amber-50 border-amber-200 text-amber-700' :
            'bg-indigo-50 border-indigo-200 text-indigo-700 animate-pulse'
          }`}>
            🔄 {syncStatus} {pendingCount > 0 && `(${pendingCount})`}
          </span>
        </div>
      </div>
      
      {/* Alert Warning for Local Staging Blocks */}
      {!isOnline && (
        <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-100 text-[10px] text-amber-700 font-medium leading-relaxed">
          ⚠️ Connection interrupted. Your course progression parameters are currently cached securely in local browser storage layers (IndexedDB). Sync will resume automatically upon link re-establishment.
        </div>
      )}
    </div>
  );
};

export default OfflineSyncTracker;