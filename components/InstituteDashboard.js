import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Clock,
  Settings,
  Bell,
  Download,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  BookOpen,
  GraduationCap,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  X,
  Zap,
  Building,
  Mail,
  Phone,
  Globe,
  User,
  RefreshCw,
  Upload,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ExportDropdown from "@/components/ui/ExportDropdown";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";
import { Navbar } from "./Navbar";
import { useAttendance } from "@/hooks/useAttendance";
import { useCurriculum } from "@/hooks/useCurriculum";
import BulkImportModal from "./dashboard/BulkImportModal";
import dynamic from "next/dynamic";
import ChartSkeleton from "@/components/ui/ChartSkeleton";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

const AttendanceTrendsChart = dynamic(
  () => import("@/components/charts/AttendanceTrendsChart"),
  { ssr: false, loading: () => <ChartSkeleton variant="chart" /> }
);

const InstituteDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = (format) => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const exportData = attendanceRequests.map(req => ({
          Date: selectedDate,
          'Student Name': req.student,
          'Roll No': req.rollNo,
          'Class': req.class,
          'Status': req.status,
        }));
        
        const filename = `institute_attendance_requests_${selectedDate}`;
        
        if (format === 'csv') {
          exportToCSV(exportData, filename);
        } else {
          const columns = [
            { header: 'Date', dataKey: 'Date' },
            { header: 'Student', dataKey: 'Student Name' },
            { header: 'Roll No', dataKey: 'Roll No' },
            { header: 'Class', dataKey: 'Class' },
            { header: 'Status', dataKey: 'Status' }
          ];
          exportToPDF(exportData, columns, `Institute Attendance Requests - ${selectedDate}`, filename);
        }
        toast.success(`Successfully exported as ${format.toUpperCase()}`);
      } catch (err) {
        console.error("Export failed:", err);
        toast.error("Failed to export report");
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  // Data fetched via useAttendance hook (replaces /api/institute/stats fetch block)
  const { user } = useAuth();
  const {
    dashboardData,
    classes,
    teachers,
    attendanceRequests,
    setAttendanceRequests,
    loading: initialLoading,
    error,
  } = useAttendance({ role: "institute", user });
  const { curriculum } = useCurriculum({ role: "institute", user });

  // Keep institute and currentUser as static placeholders
  // Mock institute data
  const institute = {
    name: "Learnova Institute of Technology",
    code: "LIT001",
    email: "admin@learnova.edu",
    phone: "+1 (555) 123-4567",
    address: "123 Education Street, Knowledge City",
    established: "2010",
    website: "www.learnova.edu",
    accreditation: "NAAC A++",
  };

  const currentUser = {
    name: "Dr. Admin",
    role: "Institute Administrator",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
  };

  // Clock interval only
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleApproveRequest = (requestId) => {
    setAttendanceRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: "approved" } : req
      )
    );
  };

  const handleRejectRequest = (requestId) => {
    setAttendanceRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: "rejected" } : req
      )
    );
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "blue",
  }) => {
    const colorClasses = {
      blue: {
        gradient: "from-blue-500/20 to-blue-600/20",
        border: "border-blue-500/30",
        text: "text-blue-400",
      },
      green: {
        gradient: "from-green-500/20 to-green-600/20",
        border: "border-green-500/30",
        text: "text-green-400",
      },
      red: {
        gradient: "from-red-500/20 to-red-600/20",
        border: "border-red-500/30",
        text: "text-red-400",
      },
      yellow: {
        gradient: "from-yellow-500/20 to-yellow-600/20",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
      },
      purple: {
        gradient: "from-purple-500/20 to-purple-600/20",
        border: "border-purple-500/30",
        text: "text-purple-400",
      },
    };

    const currentColor = colorClasses[color] || colorClasses.blue;

    return (
      <div
        className={`bg-gradient-to-br ${currentColor.gradient} ${currentColor.border} backdrop-blur-xl rounded-2xl border p-6 shadow-2xl hover:scale-105 transition-all duration-300`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground dark:text-gray-300 text-sm font-medium">{title}</p>

            <p className={`text-2xl font-bold mt-1 ${currentColor.text}`}>
              {value}
            </p>

            {subtitle && (
              <p
                className={`text-sm mt-1 ${
                  trend && trend.startsWith("+")
                    ? "text-green-400"
                    : "text-muted-foreground dark:text-gray-400"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>

          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${currentColor.gradient}`}
          >
            <Icon className={`w-6 h-6 ${currentColor.text}`} />
          </div>
        </div>
      </div>
    );
  };

  const TopInfoBar = () => (
    <div
      className="bg-gradient-to-r from-gray-900/80 via-blue-900/70 to-purple-900/80 
                  backdrop-blur-xl border border-border dark:border-white/10 shadow-lg rounded-2xl"
    >
      <div className="px-6 py-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Institute Info */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 
                          rounded-xl flex items-center justify-center shadow-md"
            >
              <Building className="w-6 h-6 text-foreground dark:text-white" />
            </div>

            {/* Name + Basic Info */}
            <div>
              <h1 className="text-xl font-bold text-foreground dark:text-white tracking-tight">
                {institute.name}
              </h1>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                Code: {institute.code} • Est. {institute.established}
              </p>
            </div>

            {/* Contact Info (hidden on small screens) */}
            <div className="hidden md:flex items-center gap-5 text-sm text-muted-foreground dark:text-gray-300 ml-4">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span>{institute.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{institute.phone}</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <span>{institute.website}</span>
              </div>
            </div>
          </div>

          {/* Right: Date, Notifications, User */}
          <div className="flex items-center gap-5">
            {/* Date & Time */}
            <div className="text-right">
              <div className="text-foreground dark:text-white font-semibold text-lg">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-muted-foreground dark:text-gray-400">
                {formatDate(currentTime)}
              </div>
            </div>

            {/* Notifications */}
            <button
              aria-label={`Notifications${dashboardData.pendingRequests > 0 ? `, ${dashboardData.pendingRequests > 99 ? '99+' : dashboardData.pendingRequests} pending requests` : ''}`}
              className="relative p-2.5 bg-gray-800/60 hover:bg-gray-700/60 
                             rounded-xl border border-gray-600/40 transition-colors shadow-sm"
            >
              <Bell className="w-5 h-5 text-muted-foreground dark:text-gray-300" />
              {dashboardData.pendingRequests > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-red-500 text-foreground dark:text-white 
                               text-xs rounded-full flex items-center justify-center shadow-md"
                >
                  {dashboardData.pendingRequests > 99 ? "99+" : dashboardData.pendingRequests}
                </span>
              )}
            </button>

            {/* User Profile */}
            <div
              className="flex items-center gap-3 bg-gray-800/60 hover:bg-gray-700/60 
                          rounded-xl px-3 py-2 border border-gray-600/40 shadow-sm cursor-pointer"
            >
              <div
                className="w-9 h-9 bg-gradient-to-r from-green-400 to-blue-500 
                            rounded-full flex items-center justify-center"
              >
                <User className="w-5 h-5 text-foreground dark:text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-foreground dark:text-white text-sm font-medium">
                  {currentUser.name}
                </div>
                <div className="text-xs text-muted-foreground dark:text-gray-400">{currentUser.role}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={dashboardData.totalStudents.toLocaleString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Teachers"
          value={dashboardData.totalTeachers}
          icon={GraduationCap}
          color="green"
        />
        <StatCard
          title="Active Classes"
          value={dashboardData.activeClasses}
          subtitle="Today"
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="Today's Attendance"
          value={`${dashboardData.todayAttendance}%`}
          subtitle={dashboardData.weeklyTrend + " from last week"}
          icon={UserCheck}
          trend={dashboardData.weeklyTrend}
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-foreground dark:text-white mb-6 flex items-center">
          <Zap className="w-6 h-6 text-blue-400 mr-2" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="group bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 rounded-xl p-4 transition-all duration-500 ease-in-out hover:scale-105"
          >
            <div className="flex items-center space-x-3">
              <Plus className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
              <div className="text-left">
                <div className="font-medium text-purple-300">Add New Class</div>
                <div className="text-sm text-muted-foreground dark:text-gray-400">
                  Create class schedule
                </div>
              </div>
            </div>
          </button>

          <ExportDropdown
            onExport={handleExport}
            isExporting={isExporting}
            className="group w-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 rounded-xl p-4 transition-all duration-500 ease-in-out hover:scale-105 flex justify-start items-center"
          >
            <div className="flex items-center space-x-3 text-left">
              <Download className="w-5 h-5 text-green-400 group-hover:text-green-300" />
              <div>
                <div className="font-medium text-green-300">Export Reports</div>
                <div className="text-sm text-muted-foreground dark:text-gray-400">CSV/PDF formats</div>
              </div>
            </div>
          </ExportDropdown>

          <button
            onClick={() => setActiveTab("settings")}
            className="group bg-gradient-to-r from-orange-600/20 to-red-600/20 hover:from-orange-600/30 hover:to-red-600/30 border border-orange-500/30 rounded-xl p-4 transition-all duration-500 ease-in-out hover:scale-105"
          >
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-orange-400 group-hover:text-orange-300" />
              <div className="text-left">
                <div className="font-medium text-orange-300">
                  System Settings
                </div>
                <div className="text-sm text-muted-foreground dark:text-gray-400">Configure platform</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground dark:text-white">
              Recent Attendance Requests
            </h3>
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm border border-red-500/30">
              {
                attendanceRequests.filter((req) => req.status === "pending")
                  .length
              }{" "}
              Pending
            </span>
          </div>
          <div className="space-y-4">
            {attendanceRequests.slice(0, 3).map((request) => (
              <div
                key={request.id}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground dark:text-white">{request.student}</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      {request.rollNo} • {request.class}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium border ${
                      request.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : request.status === "approved"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}
                  >
                    {request.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground dark:text-gray-300 mb-1">
                  <span className="font-medium">Reason:</span> {request.reason}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground dark:text-gray-400">{request.location}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-500">{request.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-foreground dark:text-white mb-6">
            Today's Class Schedule
          </h3>
          <div className="space-y-4">
            {classes.slice(0, 3).map((classItem) => (
              <div
                key={classItem.id}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-foreground dark:text-white font-medium">{classItem.name}</div>
                  <div className="text-sm text-muted-foreground dark:text-gray-400">{classItem.time}</div>
                </div>
                <div className="text-sm text-muted-foreground dark:text-gray-400 mb-2">
                  {classItem.teacher} • Room {classItem.room}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
                      {classItem.semester} - {classItem.section}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-400">
                      {classItem.students}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Trends Chart */}
      <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-foreground dark:text-white mb-6 flex items-center">
          <Activity className="w-6 h-6 text-blue-400 mr-2" />
          Weekly Attendance Trends
        </h3>
        <div className="w-full aspect-video min-h-[300px] overflow-hidden">
          <AttendanceTrendsChart />
        </div>
      </div>
    </div>
  );

  const ClassesTab = () => {
    const filteredClasses = classes.filter(
      (cls) =>
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-8">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-foreground dark:text-white">Class Management</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-card/40 dark:bg-black/40 border border-white/20 rounded-xl text-foreground dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl"
              />
            </div>
            <button
              onClick={() => setShowBulkImportModal(true)}
              disabled={isLoading}
              className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-foreground dark:text-white px-4 py-2 rounded-xl transition-all duration-500 ease-in-out hover:scale-105 flex items-center shadow-xl border border-gray-500/30"
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-foreground dark:text-white px-4 py-2 rounded-xl transition-all duration-500 ease-in-out hover:scale-105 flex items-center shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </button>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <div
              key={classItem.id}
              className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 shadow-2xl hover:scale-105 transition-all duration-500 ease-in-out"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-foreground dark:text-white" />
                </div>
                <div className="flex space-x-2">
                  <button aria-label="View class details" className="text-blue-400 hover:text-blue-300 p-2 bg-blue-500/20 rounded-lg border border-blue-500/30 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button aria-label="Edit class" className="text-green-400 hover:text-green-300 p-2 bg-green-500/20 rounded-lg border border-green-500/30 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button aria-label="Delete class" className="text-red-400 hover:text-red-300 p-2 bg-red-500/20 rounded-lg border border-red-500/30 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-foreground dark:text-white text-lg mb-2">
                {classItem.name}
              </h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-gray-400">Teacher:</span>
                  <span className="text-foreground dark:text-white font-medium">
                    {classItem.teacher}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-gray-400">Room:</span>
                  <span className="text-blue-400">{classItem.room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-gray-400">Time:</span>
                  <span className="text-green-400">{classItem.time}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-medium border border-purple-500/30">
                  {classItem.semester} - {classItem.section}
                </span>
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/30">
                  {classItem.students} students
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground dark:text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground dark:text-gray-400">
              No classes found matching your search.
            </p>
          </div>
        )}
      </div>
    );
  };

  const TeachersTab = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground dark:text-white">Teacher Management</h2>
        <button
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-foreground dark:text-white px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 flex items-center shadow-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Teacher
        </button>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <div
            key={teacher.id}
            className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-foreground dark:text-white" />
              </div>
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium border ${
                  teacher.status === "active"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}
              >
                {teacher.status.toUpperCase()}
              </span>
            </div>

            <h3 className="font-bold text-foreground dark:text-white text-lg mb-1">
              {teacher.name}
            </h3>
            <p className="text-muted-foreground dark:text-gray-400 text-sm mb-1">{teacher.email}</p>
            <p className="text-blue-400 text-sm mb-4">{teacher.department}</p>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground dark:text-gray-400">Classes:</span>
                <span className="text-foreground dark:text-white font-medium">
                  {teacher.classes}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground dark:text-gray-400">Avg. Attendance:</span>
                <span className="text-green-400 font-medium">
                  {teacher.attendance}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-3 py-2 rounded-xl transition-colors text-sm font-medium">
                View Details
              </button>
              <button aria-label="Edit teacher" className="bg-gray-500/20 hover:bg-gray-500/30 text-muted-foreground dark:text-gray-400 border border-gray-500/30 px-3 py-2 rounded-xl transition-colors">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AttendanceTab = () => (
    <div className="space-y-8">
      {/* Header with Date Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground dark:text-white">Attendance Overview</h2>
        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-card/40 dark:bg-black/40 border border-white/20 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl"
          />
          <ExportDropdown
            onExport={handleExport}
            isExporting={isExporting}
            label="Export"
            className="bg-gradient-to-r from-green-600 to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-foreground dark:text-white px-4 py-2 rounded-xl flex items-center shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:brightness-110"
          />
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Present Today"
          value={dashboardData.todayAttendance?.toLocaleString() ?? "N/A"}
          subtitle={`${dashboardData.todayAttendance ? ((dashboardData.todayAttendance/dashboardData.totalStudents)*100).toFixed(1) : 0}% of total`}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Absent Today"
          value={dashboardData.totalStudents - dashboardData.todayAttendance || 0}
          subtitle={`${dashboardData.totalStudents ? (((dashboardData.totalStudents - dashboardData.todayAttendance)/dashboardData.totalStudents)*100).toFixed(1) : 0}% of total`}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Late Arrivals"
          value={dashboardData.lateArrivals ?? "N/A"}
          subtitle={dashboardData.lateArrivals ? `${((dashboardData.lateArrivals/dashboardData.totalStudents)*100).toFixed(1)}% of total` : "Data unavailable"}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Pending Requests"
          value={dashboardData.pendingRequests ?? 0}
          subtitle="Awaiting approval"
          icon={AlertTriangle}
          color="purple"
        />
      </div>

      {/* Attendance Requests */}
      <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-foreground dark:text-white mb-6">
          Attendance Requests Management
        </h3>
        <div className="space-y-4">
          {attendanceRequests.map((request) => (
            <div
              key={request.id}
              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <p className="font-medium text-foreground dark:text-white">
                        {request.student}
                      </p>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        {request.rollNo} • {request.class}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    <p className="text-sm text-muted-foreground dark:text-gray-300">
                      <span className="font-medium">Reason:</span>{" "}
                      {request.reason}
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-gray-300">
                      <span className="font-medium">Location:</span>{" "}
                      {request.location}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-gray-500">{request.time}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium border ${
                      request.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : request.status === "approved"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}
                  >
                    {request.status.toUpperCase()}
                  </span>
                  {request.status === "pending" && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={isLoading}
                        className="bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-green-400 border border-green-500/30 px-3 py-1 rounded-lg text-xs transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={isLoading}
                        className="bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 border border-red-500/30 px-3 py-1 rounded-lg text-xs transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-foreground dark:text-white">System Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Settings */}
        <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-foreground dark:text-white mb-6 flex items-center">
            <Clock className="w-6 h-6 text-blue-400 mr-2" />
            Attendance Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300 mb-2">
                Time Window
              </label>
              <select className="w-full px-3 py-2 bg-card/40 dark:bg-black/40 border border-white/20 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl">
                <option>09:00 - 09:10 (10 minutes)</option>
                <option>09:00 - 09:15 (15 minutes)</option>
                <option>09:00 - 09:20 (20 minutes)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300 mb-2">
                Active Days
              </label>
              <div className="flex flex-wrap gap-3">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={!["Sat", "Sun"].includes(day)}
                        className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                      />
                      <span className="ml-2 text-sm text-muted-foreground dark:text-gray-300">{day}</span>
                    </label>
                  )
                )}
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-gray-700">
              <span className="text-sm font-medium text-muted-foreground dark:text-gray-300">
                Face Recognition
              </span>
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-t border-gray-700">
              <span className="text-sm font-medium text-muted-foreground dark:text-gray-300">
                GPS Geofencing
              </span>
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-t border-gray-700">
              <span className="text-sm font-medium text-muted-foreground dark:text-gray-300">
                Enable Automated Warnings
              </span>
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-t border-gray-700">
              <span className="text-sm font-medium text-muted-foreground dark:text-gray-300">
                Low Attendance Threshold (%)
              </span>
              <input
                type="number"
                defaultValue={75}
                min={0}
                max={100}
                className="w-20 px-2 py-1 bg-card/40 dark:bg-black/40 border border-white/20 rounded-lg text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              />
            </div>
          </div>
        </div>

        {/* Institute Info */}
        <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-foreground dark:text-white mb-6 flex items-center">
            <Building className="w-6 h-6 text-blue-400 mr-2" />
            Institute Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300 mb-2">
                Institute Name
              </label>
              <input
                type="text"
                defaultValue={institute.name}
                className="w-full px-3 py-2 bg-card/40 dark:bg-black/40 border border-white/20 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300 mb-2">
                Institute Code
              </label>
              <input
                type="text"
                defaultValue={institute.code}
                className="w-full px-3 py-2 bg-card/40 dark:bg-black/40 border border-white/20 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue={institute.email}
                className="w-full px-3 py-2 bg-card/40 dark:bg-black/40 border border-white/20 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                defaultValue={institute.phone}
                className="w-full px-3 py-2 bg-card/40 dark:bg-black/40 border border-white/20 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                defaultValue={institute.website}
                className="w-full px-3 py-2 bg-card/40 dark:bg-black/40 border border-white/20 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                defaultValue={institute.address}
                rows={3}
                className="w-full px-3 py-2 bg-card/40 dark:bg-black/40 border border-white/20 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-xl resize-none"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-foreground dark:text-white py-2 px-4 rounded-xl transition-all duration-300 hover:scale-105"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (initialLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="fixed top-0 left-0 w-full z-50 shadow-xl border-b border-white/10 bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl">
          <Navbar />
        </div>
        <div className="text-center pt-20 px-4">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground dark:text-white px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Sticky Premium Navbar */}
      <div className="fixed top-0 left-0 w-full z-50 shadow-xl border-b border-white/10 bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl">
        <Navbar />
      </div>

      {/* Top Info Bar with extra spacing and gradient separation */}
      <div className="pt-20 pb-2 px-2">
        <div className="rounded-2xl overflow-hidden">
          <TopInfoBar />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 py-6">
        <div className="flex overflow-x-auto space-x-2 pb-2">
          {/* ...existing code... */}
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-foreground dark:text-white shadow-lg"
                : "bg-gray-800/50 text-muted-foreground dark:text-gray-300 hover:bg-gray-700/50 border border-gray-600/50"
            }`}
          >
            <Activity className="w-5 h-5 mr-2" />
            Overview
          </button>
          {/* ...existing code... */}
          <button
            onClick={() => setActiveTab("classes")}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center ${
              activeTab === "classes"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-foreground dark:text-white shadow-lg"
                : "bg-gray-800/50 text-muted-foreground dark:text-gray-300 hover:bg-gray-700/50 border border-gray-600/50"
            }`}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Classes
          </button>
          {/* ...existing code... */}
          <button
            onClick={() => setActiveTab("teachers")}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center ${
              activeTab === "teachers"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-foreground dark:text-white shadow-lg"
                : "bg-gray-800/50 text-muted-foreground dark:text-gray-300 hover:bg-gray-700/50 border border-gray-600/50"
            }`}
          >
            <GraduationCap className="w-5 h-5 mr-2" />
            Teachers
          </button>
          {/* ...existing code... */}
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center ${
              activeTab === "attendance"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-foreground dark:text-white shadow-lg"
                : "bg-gray-800/50 text-muted-foreground dark:text-gray-300 hover:bg-gray-700/50 border border-gray-600/50"
            }`}
          >
            <UserCheck className="w-5 h-5 mr-2" />
            Attendance
          </button>
          {/* ...existing code... */}
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center ${
              activeTab === "settings"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-foreground dark:text-white shadow-lg"
                : "bg-gray-800/50 text-muted-foreground dark:text-gray-300 hover:bg-gray-700/50 border border-gray-600/50"
            }`}
          >
            <Settings className="w-5 h-5 mr-2" />
            Settings
          </button>
          {/* ...existing code... */}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-6">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "classes" && <ClassesTab />}
        {activeTab === "teachers" && <TeachersTab />}
        {activeTab === "attendance" && <AttendanceTab />}
        {activeTab === "settings" && <SettingsTab />}
        {/* Add Class Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-foreground dark:text-white">Add New Class</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-muted-foreground dark:text-gray-400 hover:text-foreground dark:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {/* Modal Content */}
              <div className="p-6">
                <p className="text-muted-foreground dark:text-gray-400 text-center py-8">
                  Class creation form will go here
                </p>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-foreground dark:text-white px-6 py-2 rounded-lg transition-colors shadow-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Import Modal */}
        <BulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onImportComplete={() => {
            // Optionally trigger a refresh of student/class lists here
          }}
        />
      </div>
    </div>
  );
};

export default InstituteDashboard;
