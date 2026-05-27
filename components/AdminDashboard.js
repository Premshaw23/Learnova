"use client";
import { useEffect } from "react";
import { useState } from "react";
import {
  Building2,
  Users,
  Server,
  Shield,
  AlertTriangle,
  Activity,
  TrendingUp,
  Database,
  Settings,
  ChevronDown,
  Download,
  RefreshCw,
  Lock,
  Unlock,
  Ban,
  UserCheck,
  MapPin,
  Camera,
  DollarSign,
  Trash2,
  Play,
  CheckCircle2,
  Wifi,
  WifiOff,
  FileText,
  History,
} from "lucide-react";
import { Navbar } from "./Navbar";
import dynamic from "next/dynamic";
import ChartSkeleton from "@/components/ui/ChartSkeleton";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import SkeletonCard from "@/components/ui/SkeletonCard";

// CRITICAL FIX: Imported missing useAuth hook to prevent ReferenceError crash
import { useAuth } from "@/hooks/useAuth";
import { getOutboxRecords, removeFromOutbox, clearOutbox } from "@/lib/offlineStore";
import { syncAttendanceQueue } from "@/lib/syncService";

const AttendanceTrendsChart = dynamic(
  () => import("@/components/charts/AttendanceTrendsChart"),
  { ssr: false, loading: () => <ChartSkeleton variant="chart" /> }
);

const EngagementChart = dynamic(
  () => import("@/components/charts/EngagementChart"),
  { ssr: false, loading: () => <ChartSkeleton variant="doughnut" /> }
);

const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedInstitute, setSelectedInstitute] = useState("all");
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const [systemStatus, setSystemStatus] = useState("operational");
  const { user } = useAuth();

  const [platformStats, setPlatformStats] = useState({
    totalInstitutes: 0,
    activeInstitutes: 0,
    totalUsers: 0,
    dailyActiveUsers: 0,
    faceRecognitionAPICalls: "—",
    storageUsed: "—",
    systemUptime: "—",
    revenue: "—",
    pendingIssues: 0,
    serverLoad: 0,
  });
  const [institutes, setInstitutes] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({});
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [featureUsage, setFeatureUsage] = useState({});

  const [outboxRecords, setOutboxRecords] = useState([]);
  const [syncHistory, setSyncHistory] = useState([]);
  const [sessionSyncedCount, setSessionSyncedCount] = useState(0);
  const [sessionRejectedCount, setSessionRejectedCount] = useState(0);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [selectedRecordPayload, setSelectedRecordPayload] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setOnlineStatus(navigator.onLine);

    const updateOutbox = async () => {
      try {
        const records = await getOutboxRecords();
        setOutboxRecords(records || []);
      } catch (err) {
        console.error("Error reading outbox in dashboard:", err);
      }
    };

    updateOutbox();

    const handleOnline = () => {
      setOnlineStatus(true);
      setSyncHistory((prev) => [
        {
          time: new Date().toLocaleTimeString(),
          type: "info",
          message: "Network connection restored. Preparing automatic sync replay.",
        },
        ...prev,
      ]);
      updateOutbox();
    };

    const handleOffline = () => {
      setOnlineStatus(false);
      setSyncHistory((prev) => [
        {
          time: new Date().toLocaleTimeString(),
          type: "warning",
          message: "Network connection lost. Offline mode active. Outbox will cache sync actions.",
        },
        ...prev,
      ]);
    };

    const handleSyncComplete = (e) => {
      const count = e.detail?.count || 0;
      setSessionSyncedCount((prev) => prev + count);
      setSyncHistory((prev) => [
        {
          time: new Date().toLocaleTimeString(),
          type: "success",
          message: `Replay acknowledgment received: ${count} attendance records successfully synced.`,
        },
        ...prev,
      ]);
      updateOutbox();
    };

    const handleSyncRejected = (e) => {
      const count = e.detail?.count || 0;
      setSessionRejectedCount((prev) => prev + count);
      setSyncHistory((prev) => [
        {
          time: new Date().toLocaleTimeString(),
          type: "error",
          message: `Replay rejected: ${count} records permanently failed validation. ${e.detail?.warning || ""}`,
        },
        ...prev,
      ]);
      updateOutbox();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("attendance-sync-complete", handleSyncComplete);
    window.addEventListener("attendance-sync-rejected", handleSyncRejected);

    const interval = setInterval(updateOutbox, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("attendance-sync-complete", handleSyncComplete);
      window.removeEventListener("attendance-sync-rejected", handleSyncRejected);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    let isActive = true;

    const fetchStats = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!isActive) return;

        if (res.ok) {
          const data = await res.json();
          if (data.platformStats) setPlatformStats(data.platformStats);
          if (data.institutes) setInstitutes(data.institutes);
          if (data.systemMetrics) setSystemMetrics(data.systemMetrics);
          if (data.criticalAlerts) setCriticalAlerts(data.criticalAlerts);
          if (data.featureUsage) setFeatureUsage(data.featureUsage);
        } else {
          console.error("Failed to fetch admin stats:", res.status);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Error fetching admin stats:", err);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [user]);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Platform Health Status Bar */}
      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-4 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-green-400" />
            <span className="font-semibold text-green-300">
              System Status: All Services Operational
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span>Uptime: {platformStats.systemUptime}</span>
            <span>Server Load: {platformStats.serverLoad}%</span>
            <span>API Health: Excellent</span>
          </div>
        </div>
      </div>

      {/* Key Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-5 shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
              Active
            </span>
          </div>
          <h3 className="text-2xl font-bold text-blue-400">
            {platformStats.totalInstitutes}
          </h3>
          <p className="text-sm text-gray-300 mt-1">Total Institutes</p>
          <p className="text-xs text-green-400 mt-2">
            ↑ {platformStats.activeInstitutes} active
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5 shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 text-purple-400" />
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/30">
              Live
            </span>
          </div>
          <h3 className="text-2xl font-bold text-purple-400">
            {platformStats.totalUsers.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-300 mt-1">Total Users</p>
          <p className="text-xs text-blue-400 mt-2">
            ↑ {platformStats.dailyActiveUsers.toLocaleString()} active today
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-5 shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <Camera className="w-8 h-8 text-green-400" />
            <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-green-400">
            {platformStats.faceRecognitionAPICalls}
          </h3>
          <p className="text-sm text-gray-300 mt-1">
            Face Recognition API Calls
          </p>
          <p className="text-xs text-gray-400 mt-2">This month</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-5 shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-yellow-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-yellow-400">
            {platformStats.revenue}
          </h3>
          <p className="text-sm text-gray-300 mt-1">Monthly Revenue</p>
          <p className="text-xs text-green-400 mt-2">↑ 12% from last month</p>
        </div>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <Server className="w-5 h-5 text-gray-400" />
            Infrastructure Status
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1 text-gray-300">
                <span>CPU Usage</span>
                <span className="font-medium">{platformStats.serverLoad}%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${platformStats.serverLoad}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1 text-gray-300">
                <span>Memory Usage</span>
                <span className="font-medium">72%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "72%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1 text-gray-300">
                <span>Storage Usage</span>
                <span className="font-medium">78.4%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: "78.4%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-gray-400" />
            Security Overview
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-green-500/20 border border-green-500/30 rounded">
              <span className="text-sm text-gray-300">Face Recognition</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-500/20 border border-green-500/30 rounded">
              <span className="text-sm text-gray-300">GPS Geofencing</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-500/20 border border-yellow-500/30 rounded">
              <span className="text-sm text-gray-300">Failed Attempts</span>
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">
                234 today
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-500/20 border border-green-500/30 rounded">
              <span className="text-sm text-gray-300">SSL Certificates</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                Valid
              </span>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-gray-400" />
            API Performance
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">
                Face Recognition API
              </span>
              <span className="text-sm font-medium text-green-400">120ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">GPS Service</span>
              <span className="text-sm font-medium text-green-400">45ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Database Queries</span>
              <span className="text-sm font-medium text-green-400">8ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">CDN Response</span>
              <span className="text-sm font-medium text-green-400">15ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Platform Attendance Trends
          </h3>
          <div className="w-full aspect-video min-h-[300px] overflow-hidden">
            <AttendanceTrendsChart />
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-green-400" />
            Student Engagement Overview
          </h3>
          <div className="w-full min-h-[300px] overflow-hidden flex items-center justify-center">
            <EngagementChart />
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 shadow-2xl">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          Critical Alerts
        </h3>
        <div className="space-y-2">
          {criticalAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between bg-black/40 backdrop-blur-xl p-3 rounded border border-red-500/20"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    alert.severity === "high"
                      ? "bg-red-500"
                      : alert.severity === "medium"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-300">{alert.message}</span>
              </div>
              <span className="text-xs text-gray-400">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInstitutes = () => (
    <div className="space-y-6">
      {/* Institute Management Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Institute Management</h2>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 shadow-lg transition-all duration-300">
            <Building2 className="w-4 h-4" />
            Add New Institute
          </button>
          <button className="px-4 py-2 bg-gray-800/60 text-gray-300 rounded-xl hover:bg-gray-700/60 flex items-center gap-2 border border-gray-600/40 transition-all duration-300">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Institute Table */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Institute
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  API Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Storage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Health
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {institutes.map((institute) => (
                <tr
                  key={institute.id}
                  className="hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {institute.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        Last active: {institute.lastActive}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full border ${
                        institute.status === "active"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}
                    >
                      {institute.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-white">
                        {institute.students} students
                      </div>
                      <div className="text-xs text-gray-400">
                        {institute.teachers} teachers
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-white">
                        {institute.plan}
                      </div>
                      <div
                        className={`text-xs ${
                          institute.payment === "paid"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {institute.payment}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-white">
                        {institute.apiCalls.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">this month</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {institute.storage}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          institute.healthScore > 90
                            ? "bg-green-500"
                            : institute.healthScore > 70
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-sm text-white">
                        {institute.healthScore}%
                      </span>
                      {institute.issues > 0 && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                          {institute.issues} issues
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button aria-label="Institute Settings" className="text-blue-400 hover:text-blue-300 transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                      {institute.status === "active" ? (
                        <button aria-label="Lock Institute" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                          <Lock className="w-4 h-4" />
                        </button>
                      ) : (
                        <button aria-label="Unlock Institute" className="text-green-400 hover:text-green-300 transition-colors">
                          <Unlock className="w-4 h-4" />
                        </button>
                      )}
                      <button aria-label="Ban Institute" className="text-red-400 hover:text-red-300 transition-colors">
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Usage Statistics */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Feature Adoption Across Institutes
        </h3>
        <div className="space-y-4">
          {Object.entries(featureUsage).map(([feature, data]) => (
            <div key={feature} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm capitalize text-gray-300">
                    {feature.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="text-sm font-medium text-white">
                    {data.enabled}/{data.total} institutes
                  </span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${data.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSystemMonitoring = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">
        System Monitoring & Infrastructure
      </h2>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(systemMetrics).map(([service, metrics]) => (
          <div
            key={service}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold capitalize text-white">
                {service.replace(/([A-Z])/g, " $1").trim()}
              </h3>
              <span
                className={`px-2 py-1 text-xs rounded-full border ${
                  metrics.status === "operational"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}
              >
                {metrics.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              {Object.entries(metrics).map(
                ([key, value]) =>
                  key !== "status" && (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-400 capitalize">{key}:</span>
                      <span className="font-medium text-white">{value}</span>
                    </div>
                  )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Database Performance */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <Database className="w-5 h-5 text-gray-400" />
          Database Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div className="text-2xl font-bold text-white">234</div>
            <div className="text-sm text-gray-400">Active Connections</div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div className="text-2xl font-bold text-white">8ms</div>
            <div className="text-sm text-gray-400">Avg Query Time</div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div className="text-2xl font-bold text-white">1.2M</div>
            <div className="text-sm text-gray-400">Queries/Day</div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div className="text-2xl font-bold text-white">65%</div>
            <div className="text-sm text-gray-400">Cache Hit Rate</div>
          </div>
        </div>
      </div>

      {/* API Rate Limiting */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold mb-4 text-white">
          API Rate Limiting & Quotas
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-2 text-left text-sm text-gray-400">
                  Institute
                </th>
                <th className="px-4 py-2 text-left text-sm text-gray-400">
                  Plan Limit
                </th>
                <th className="px-4 py-2 text-left text-sm text-gray-400">
                  Current Usage
                </th>
                <th className="px-4 py-2 text-left text-sm text-gray-400">
                  % Used
                </th>
                <th className="px-4 py-2 text-left text-sm text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              <tr>
                <td className="px-4 py-2 text-sm text-white">
                  Delhi Technical University
                </td>
                <td className="px-4 py-2 text-sm text-gray-300">500K/month</td>
                <td className="px-4 py-2 text-sm text-gray-300">125K</td>
                <td className="px-4 py-2 text-sm text-gray-300">25%</td>
                <td className="px-4 py-2">
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                    Normal
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm text-white">
                  Mumbai Institute of Technology
                </td>
                <td className="px-4 py-2 text-sm text-gray-300">300K/month</td>
                <td className="px-4 py-2 text-sm text-gray-300">280K</td>
                <td className="px-4 py-2 text-sm text-gray-300">93%</td>
                <td className="px-4 py-2">
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">
                    Warning
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSecurityCenter = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">
        Security & Compliance Center
      </h2>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <Shield className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-green-400">98.5%</span>
          </div>
          <h3 className="font-semibold text-white">Security Score</h3>
          <p className="text-sm text-gray-300 mt-1">
            Based on 24 security metrics
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <Lock className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-blue-400">234</span>
          </div>
          <h3 className="font-semibold text-white">Failed Auth Attempts</h3>
          <p className="text-sm text-gray-300 mt-1">Last 24 hours</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <Camera className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-purple-400">12</span>
          </div>
          <h3 className="font-semibold text-white">Face Spoofing Detected</h3>
          <p className="text-sm text-gray-300 mt-1">Blocked today</p>
        </div>
      </div>

      {/* GPS Violations */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <MapPin className="w-5 h-5 text-gray-400" />
          GPS Geofencing Violations
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-500/20 border border-red-500/30 rounded">
            <div>
              <div className="font-medium text-sm text-white">
                Delhi Technical University - Room 301
              </div>
              <div className="text-xs text-gray-400">
                15 attempts outside geofence radius
              </div>
            </div>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Investigate
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-500/20 border border-yellow-500/30 rounded">
            <div>
              <div className="font-medium text-sm text-white">
                Mumbai Institute - Building A
              </div>
              <div className="text-xs text-gray-400">
                GPS spoofing detected - 3 devices
              </div>
            </div>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Investigate
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Audits */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <Shield className="w-5 h-5 text-gray-400" />
          Compliance Audits
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-400">
                  Audit ID
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-400">
                  Institute
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-400">
                  Status
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-400">
                  Date
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              <tr>
                <td className="px-4 py-2 text-white">AUD-1024</td>
                <td className="px-4 py-2 text-white">
                  Delhi Technical University
                </td>
                <td className="px-4 py-2">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs border border-green-500/30">
                    Compliant
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-300">2025-09-20</td>
                <td className="px-4 py-2">
                  <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                    View Report
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-white">AUD-1025</td>
                <td className="px-4 py-2 text-white">Mumbai Institute</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs border border-yellow-500/30">
                    Pending
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-300">2025-09-21</td>
                <td className="px-4 py-2">
                  <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                    View Report
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const handleForceSync = async () => {
    setSyncHistory((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        type: "info",
        message: "Manually triggered outbox sync execution.",
      },
      ...prev,
    ]);
    await syncAttendanceQueue();
    const records = await getOutboxRecords();
    setOutboxRecords(records || []);
  };

  const handleClearOutbox = async () => {
    if (!window.confirm("Are you sure you want to clear the entire offline sync queue? This will delete all pending offline actions permanently.")) return;
    await clearOutbox();
    setSyncHistory((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        type: "warning",
        message: "Offline outbox queue was manually cleared.",
      },
      ...prev,
    ]);
    setOutboxRecords([]);
  };

  const handleRemoveItem = async (id) => {
    await removeFromOutbox(id);
    setSyncHistory((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        type: "info",
        message: `Removed pending outbox record ID: ${id}`,
      },
      ...prev,
    ]);
    const records = await getOutboxRecords();
    setOutboxRecords(records || []);
  };

  const renderSyncInspector = () => {
    const queueHealthScore = outboxRecords.some((r) => Date.now() - r.queuedAt > 24 * 60 * 60 * 1000) ? 75 : 100;

    return (
      <div className="space-y-6">
        {/* Sync Replay Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-display">
              <RefreshCw className="w-6 h-6 text-blue-400" />
              Offline Sync Replay Reconciliation Inspector
            </h2>
            <p className="text-sm text-gray-400">
              Prune, replay, and monitor the client-side IndexedDB outbox queue in real-time.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleForceSync}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-300"
            >
              <Play className="w-4 h-4" />
              Sync Now
            </button>
            <button
              onClick={handleClearOutbox}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 flex items-center gap-2 border border-red-500/30 transition-all duration-300"
            >
              <Trash2 className="w-4 h-4" />
              Clear Queue
            </button>
          </div>
        </div>

        {/* Sync Overview Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-6 h-6 text-blue-400" />
              <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${onlineStatus ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"}`}>
                {onlineStatus ? "Online" : "Offline"}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-blue-400">{outboxRecords.length}</h3>
            <p className="text-sm text-gray-300 mt-1">Total Queued Operations</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <span className="text-xs text-gray-400">This Session</span>
            </div>
            <h3 className="text-2xl font-bold text-green-400">{sessionSyncedCount}</h3>
            <p className="text-sm text-gray-300 mt-1">Successfully Synced</p>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <span className="text-xs text-gray-400">Rejected Replays</span>
            </div>
            <h3 className="text-2xl font-bold text-red-400">{sessionRejectedCount}</h3>
            <p className="text-sm text-gray-300 mt-1">Rejected Replays</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-6 h-6 text-purple-400" />
              <span className="text-xs text-gray-400">Queue Health</span>
            </div>
            <h3 className={`text-2xl font-bold ${queueHealthScore === 100 ? "text-purple-400" : "text-yellow-400"}`}>
              {queueHealthScore}%
            </h3>
            <p className="text-sm text-gray-300 mt-1">Stale Record Health</p>
          </div>
        </div>

        {/* Main Content Grid (Inspector & Logs) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Outbox Queue Inspector List */}
          <div className="lg:col-span-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-gray-400" />
              Pending Replay Queue Inspector
            </h3>

            {outboxRecords.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-gray-700 rounded-xl space-y-2">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
                <p className="font-medium text-gray-300 font-display">Outbox Queue Clean</p>
                <p className="text-xs text-gray-500">No cached actions or pending synchronizations detected in IndexedDB.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-700/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800/50 text-gray-400 text-xs font-medium uppercase tracking-wider">
                      <tr className="border-b border-gray-700/50">
                        <th className="px-4 py-3 text-left">ID</th>
                        <th className="px-4 py-3 text-left">Record / Identity</th>
                        <th className="px-4 py-3 text-left">Confidence</th>
                        <th className="px-4 py-3 text-left">Queued At</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {outboxRecords.map((record) => {
                        const isStale = Date.now() - record.queuedAt > 24 * 60 * 60 * 1000;
                        return (
                          <tr key={record.id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-4 text-xs font-mono text-gray-400 font-bold">#{record.id}</td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-white">{record.studentName || "Self Submit"}</div>
                              <div className="text-xs text-gray-400 font-mono">UID: {record.userId.slice(0, 8)}...</div>
                            </td>
                            <td className="px-4 py-4 font-mono text-gray-300">{(record.confidenceScore * 100).toFixed(0)}%</td>
                            <td className="px-4 py-4 text-xs text-gray-400">
                              {new Date(record.queuedAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${isStale ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}>
                                {isStale ? "Stale (>24h)" : "Pending"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setSelectedRecordPayload(record)}
                                  className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600/40 text-gray-300 px-2 py-1 rounded transition-colors"
                                >
                                  View Payload
                                </button>
                                <button
                                  onClick={() => handleRemoveItem(record.id)}
                                  className="text-red-400 hover:text-red-300 p-1 transition-colors"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sync Timeline / Diagnostic Logs */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
              <History className="w-5 h-5 text-gray-400" />
              Replay Timeline & Diagnostics
            </h3>

            <div className="h-[300px] overflow-y-auto pr-2 space-y-3 font-mono text-xs scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
              {syncHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-center text-[11px] py-12">
                  No real-time synchronization events recorded yet. Ready and listening to connection changes.
                </div>
              ) : (
                syncHistory.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2.5 rounded border ${
                      log.type === "success"
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : log.type === "error"
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : log.type === "warning"
                        ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    }`}
                  >
                    <div className="flex justify-between font-bold text-[10px] opacity-75 mb-0.5">
                      <span>[{log.time}]</span>
                      <span className="uppercase">{log.type}</span>
                    </div>
                    <div>{log.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* JSON Payload Modal Backdrop */}
        {selectedRecordPayload && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/15 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 bg-gray-800/80 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Queued Payload Details (Record #{selectedRecordPayload.id})
                </h3>
                <button
                  onClick={() => setSelectedRecordPayload(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <pre className="bg-black/60 border border-gray-700/50 p-4 rounded-xl text-xs font-mono text-green-400 overflow-x-auto max-h-[300px]">
                  {JSON.stringify(selectedRecordPayload, null, 2)}
                </pre>
              </div>
              <div className="px-6 py-4 bg-gray-800/50 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSelectedRecordPayload(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors border border-gray-600/40 text-sm"
                >
                  Close Payload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen p-6 space-y-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-16">
      {/* Premium Glassy Top Bar */}
      <Navbar />
      <div className="bg-gradient-to-r from-gray-900/80 via-blue-900/70 to-purple-900/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl px-6 py-4 mb-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Learnova Admin Center
              </h1>
              <p className="text-xs text-gray-400">Super Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-white font-semibold text-lg">
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-xs text-gray-400">
                {new Date().toLocaleDateString()}
              </div>
            </div>
            <button className="relative p-2.5 bg-gray-800/60 hover:bg-gray-700/60 rounded-xl border border-gray-600/40 transition-colors shadow-sm">
              <AlertTriangle className="w-5 h-5 text-gray-300" />
              {criticalAlerts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-md">
                  {criticalAlerts.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 bg-gray-800/60 hover:bg-gray-700/60 rounded-xl px-3 py-2 border border-gray-600/40 shadow-sm cursor-pointer">
              <div className="w-9 h-9 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-white text-sm font-medium">
                  Super Admin
                </div>
                <div className="text-xs text-gray-400">Platform Owner</div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-2">
        {["overview", "institutes", "monitoring", "security", "sync reconciliation"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
              activeTab === tab
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg font-bold"
                : "text-gray-300 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-4">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "institutes" && renderInstitutes()}
          {activeTab === "monitoring" && renderSystemMonitoring()}
          {activeTab === "security" && renderSecurityCenter()}
          {activeTab === "sync reconciliation" && renderSyncInspector()}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;