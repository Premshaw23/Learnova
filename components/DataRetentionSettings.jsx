"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";
import { Database, ShieldAlert, Loader2, Save, Trash2 } from "lucide-react";

export default function DataRetentionSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    attendanceRetentionMonths: 24,
    biometricPurgeMonths: 12,
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchConfig = async () => {
      try {
        const token = await user.getIdToken();
        const data = await apiFetch("/api/admin/data-retention", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.config) {
          setConfig(data.config);
        }
      } catch (err) {
        console.error("Failed to load data retention settings:", err);
        toast.error("Failed to load current retention policies");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    if (config.attendanceRetentionMonths < 1 || config.biometricPurgeMonths < 1) {
      toast.error("Retention periods must be at least 1 month");
      return;
    }

    if (!window.confirm("Are you sure you want to update the data retention policy? This will permanently affect data archival on the next scheduled run.")) {
      return;
    }

    setSaving(true);
    try {
      const token = await user.getIdToken();
      await apiFetch("/api/admin/data-retention", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
      });
      toast.success("Data retention policy updated successfully!");
    } catch (err) {
      console.error("Failed to save data retention settings:", err);
      toast.error("Failed to save policies. Only Super Admins can update this.");
    } finally {
      setSaving(false);
    }
  };

  const handleManualRun = async () => {
    if (!window.confirm("WARNING: Manually triggering the archival job will permanently delete/archive data right now based on the current saved policy. Continue?")) {
      return;
    }

    const loadToast = toast.loading("Executing archival policy...");
    try {
      const response = await fetch("/api/cron/archive-data"); // Assuming cron route is openly accessible for demo, or add token if protected.
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Archival complete! ${data.stats.attendanceArchived} attendance records archived. ${data.stats.biometricsPurged} biometrics purged.`, { id: loadToast });
      } else {
        toast.error(data.error || "Failed to run policy engine", { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while running policy", { id: loadToast });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-display">
          <Database className="w-6 h-6 text-indigo-400" />
          Data Retention & Archival Engine
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Configure automated rules to archive stale database records and safely purge unused biometric data in compliance with privacy regulations.
        </p>
      </div>

      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-4 items-start shadow-inner">
        <ShieldAlert className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
        <div>
          <h4 className="text-red-300 font-semibold mb-1">Critical Impact Warning</h4>
          <p className="text-red-200/80 text-sm">
            This policy engine runs daily via an automated scheduled cron job. Data purged by these rules is permanently archived/deleted from hot storage to conserve costs and comply with GDPR/COPPA privacy constraints.
          </p>
        </div>
      </div>

      <div className="bg-gray-800/40 border border-white/10 rounded-2xl p-6 shadow-xl max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-4">
            <div className="border-b border-gray-700 pb-4">
              <label className="block text-white font-semibold mb-1 text-lg">Attendance Logs Retention</label>
              <p className="text-gray-400 text-sm mb-3">
                How many months should granular daily attendance logs be kept in primary storage before being archived?
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={config.attendanceRetentionMonths}
                  onChange={(e) => setConfig({ ...config, attendanceRetentionMonths: parseInt(e.target.value) || 0 })}
                  className="w-32 bg-black/40 border border-white/15 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
                <span className="text-gray-300 font-medium">Months</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-white font-semibold mb-1 text-lg">Biometric Data Purge</label>
              <p className="text-gray-400 text-sm mb-3">
                Purge sensitive face descriptor vectors for students who have been inactive for more than this many months (e.g., graduated students).
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={config.biometricPurgeMonths}
                  onChange={(e) => setConfig({ ...config, biometricPurgeMonths: parseInt(e.target.value) || 0 })}
                  className="w-32 bg-black/40 border border-white/15 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
                <span className="text-gray-300 font-medium">Months of inactivity</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-4 items-center justify-between border-t border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Active Policy
            </button>
            
            <button
              type="button"
              onClick={handleManualRun}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-semibold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Run Policy Engine Now
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
