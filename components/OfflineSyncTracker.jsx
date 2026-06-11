import React, { useState, useEffect } from 'react';

const OfflineSyncTracker = ({ courseId, currentModuleId, currentProgress }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState([]);
  const [syncStatus, setSyncStatus] = useState('Synchronized'); // Synchronized, Queued, Syncing

  // 1. Monitor live connection stability states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        triggerBackgroundSync();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [syncQueue]);

  // 2. Queue management interceptor for progress shifts
  useEffect(() => {
    if (!isOnline) {
      setSyncStatus('Queued');
      const backupPayload = {
        courseId,
        currentModuleId,
        progress: currentProgress,
        timestamp: new Date().toISOString()
      };
      
      // Save data locally within local storage layers
      const updatedQueue = [...syncQueue, backupPayload];
      setSyncQueue(updatedQueue);
      localStorage.setItem('learnova_offline_sync_queue', JSON.stringify(updatedQueue));
    }
  }, [currentProgress, isOnline]);

  // 3. Background verification and simulation payload recovery
  const triggerBackgroundSync = async () => {
    const activeQueue = JSON.parse(localStorage.getItem('learnova_offline_sync_queue')) || [];
    if (activeQueue.length === 0) return;

    setSyncStatus('Syncing');

    // Simulating batch execution validation sequence natively 
    setTimeout(() => {
      localStorage.removeItem('learnova_offline_sync_queue');
      setSyncQueue([]);
      setSyncStatus('Synchronized');
    }, 2000);
  };

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
            🔄 {syncStatus}
          </span>
        </div>
      </div>
      
      {/* Alert Warning for Local Staging Blocks */}
      {!isOnline && (
        <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-100 text-[10px] text-amber-700 font-medium leading-relaxed">
          ⚠️ Connection interrupted. Your course progression parameters are currently cached securely in local browser storage layers. Sync will resume automatically upon link re-establishment.
        </div>
      )}
    </div>
  );
};

export default OfflineSyncTracker;