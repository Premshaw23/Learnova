import { toast } from "react-hot-toast";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Navbar } from "./Navbar";
import { dashboardContentOffsetClass } from "@/components/navigation";
import Image from "next/image";
import CurriculumBuilder from "./dashboard/CurriculumBuilder";
import { useAuth } from "@/hooks/useAuth";
import { useSafePolling } from "@/hooks/useSafePolling";
import { useIsMounted } from "@/hooks/useIsMounted";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  User,
  Bell,
  BookOpen,
  TrendingUp,
  Target,
  Award,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Eye,
  BarChart3,
  Download,
  Filter,
  Search,
  RefreshCw,
  Star,
  Sparkles,
  Key,
  QrCode,
  FileText,
  UserCheck,
  UserX,
  Clock3,
  GraduationCap,
  Building,
  Phone,
  Mail,
  Copy,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Send,
  Upload,
  Calendar as CalendarIcon,
  PieChart,
  Activity,
  Zap,
  Loader2,
  XCircle,
  FileText,
  Clock,
  MapPin,
  CalendarPlus,
} from "lucide-react";
import ExportDropdown from "@/components/ui/ExportDropdown";
import { exportToCSV } from "@/utils/exportUtils";
import { exportAttendancePDF } from "@/utils/pdf/attendanceReport";
import dynamic from "next/dynamic";
import ChartSkeleton from "@/components/ui/ChartSkeleton";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import AttendanceAnalytics from "@/components/dashboard/AttendanceAnalytics";

import { db } from "@/lib/firebaseConfig";

import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";

import AttendanceRiskDashboard from "@/components/dashboard/AttendanceRiskDashboard";
import ClassroomMoodWidget from "@/components/dashboard/ClassroomMoodWidget";
import DraggableDashboardLayout from "@/components/dashboard/DraggableDashboardLayout";
import { AttendancePasscodeModal } from "./dashboard/AttendancePasscodeModal";
import LiveAttendanceView from "@/components/LiveAttendanceView";
import { ExceptionRequestsList } from "./dashboard/ExceptionRequestsList";
import { useAttendance } from "@/hooks/useAttendance";
import { useCurriculum } from "@/hooks/useCurriculum";
import { apiFetch } from "@/lib/apiClient";
import {
  syncOfflineQueue,
  getPendingRecordsCount,
} from "@/services/offlineSyncQueue";
import { auth } from "@/lib/firebaseConfig";
import AbsentSummaryModal from "./dashboard/AbsentSummaryModal";

const AttendanceTrendsChart = dynamic(
  () => import("@/components/charts/AttendanceTrendsChart"),
  { ssr: false, loading: () => <ChartSkeleton variant="chart" /> }
);
const EngagementChart = dynamic(
  () => import("@/components/charts/EngagementChart"),
  { ssr: false, loading: () => <ChartSkeleton variant="doughnut" /> }
);

const TeacherAchievementPanel = dynamic(
  () => import("@/components/achievements/TeacherAchievementPanel"),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceWindow, setAttendanceWindow] = useState(false);
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [passcodeGenerated, setPasscodeGenerated] = useState(false);
  const [passcodeLoading, setPasscodeLoading] = useState(false);
  const [passcodeExpiresAt, setPasscodeExpiresAt] = useState(null);
  const { user, userProfile } = useAuth();
  const isMounted = useIsMounted();

  const { attendanceStats, studentAttendanceData } = useAttendance({
    role: "teacher",
    user,
  });
  const { curriculum } = useCurriculum({ role: "teacher", user });

  const [todayClasses, setTodayClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceRequests, setAttendanceRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifications, setNotifications] = useState([]);
  const [classSchedule, setClassSchedule] = useState({});
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllRequestsModal, setShowAllRequestsModal] = useState(false);
  const [exceptionRequests, setExceptionRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState(null);
  const [showAbsentSummaryModal, setShowAbsentSummaryModal] = useState(false);
  const pendingRequests = useMemo(() => {
    return attendanceRequests.filter((req) => req.status === "pending");
  }, [attendanceRequests]);

  // Dynamic teacher data
  const [teacher, setTeacher] = useState({
    name: "Loading...",
    id: "",
    email: "",
    department: "",
    designation: "Teacher",
    subjects: [],
    avatar: null,
  });

  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  const isInitialFetchRef = useRef(true);

  // Background Sync Effect
  useEffect(() => {
    const handleOnlineSync = async () => {
      if (!user) return;
      const count = await getPendingRecordsCount();
      if (count === 0) return;

      toast.loading(`Syncing ${count} offline attendance records...`, {
        id: "offline-sync",
      });

      const token = await user.getIdToken();
      const result = await syncOfflineQueue(async (record) => {
        try {
          const res = await fetch("/api/attendance/record", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(record),
          });
          return res.ok;
        } catch (e) {
          return false;
        }
      });

      if (result.success) {
        toast.success(`Successfully synced ${result.synced} records`, {
          id: "offline-sync",
        });
      } else {
        toast.error(`Failed to sync ${result.failed} records`, {
          id: "offline-sync",
        });
      }
    };

    window.addEventListener("online", handleOnlineSync);

    // Attempt sync on mount if online
    if (navigator.onLine && user) {
      handleOnlineSync();
    }

    return () => window.removeEventListener("online", handleOnlineSync);
  }, [user]);

  const handleExport = (format) => {
    setIsExporting(true);
    setTimeout(() => {
      if (!isMounted()) return;
      try {
        const meta = {
          className: selectedClass || "All Classes",
          dateRange: "Last 28 days",
          teacherName: teacher?.name || "N/A",
          instituteName: userProfile?.instituteName || "Learnova Institute",
        };

        // For the Analytics tab we export student roster with available metrics
        const analyticsRows = studentAttendanceData.map((student) => ({
          "Class Name": meta.className,
          "Date Range": meta.dateRange,
          Teacher: meta.teacherName,
          "Student Name": student.name || "—",
          "Roll No": student.rollNo || "—",
          "Today's Status": (student.status || "absent").toUpperCase(),
          "Check-in Time": student.time || "—",
          "Confidence Score":
            student.confidence != null ? `${student.confidence}%` : "—",
          "Attendance %": "—",
          "Report Generated": new Date().toLocaleString(),
        }));

        if (format === "csv") {
          exportToCSV(
            analyticsRows,
            `analytics-report-${meta.className.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${new Date().toISOString().slice(0, 10)}`
          );
        } else {
          const rosterRows = studentAttendanceData.map((student) => ({
            Date: student.date || new Date().toLocaleDateString(),
            studentName: student.name,
            rollNo: student.rollNo,
            status: student.status,
            time: student.time || "—",
            confidence: student.confidence != null ? student.confidence : null,
          }));
          exportAttendancePDF(rosterRows, {
            ...meta,
            logoUrl: userProfile?.logoUrl || null,
            summary: {
              totalStudents: attendanceStats.totalStudents,
              presentToday: attendanceStats.presentToday,
              absentToday: attendanceStats.absentToday,
              lateToday: attendanceStats.lateToday,
            },
          });
        }
        toast.success(`Successfully exported as ${format.toUpperCase()}`);
      } catch (error) {
        console.error("Export failed:", error);
        toast.error("Failed to export report");
      } finally {
        if (isMounted()) setIsExporting(false);
      }
    }, 500);
  };

  /**
   * Export the daily attendance roster (studentAttendanceData).
   * Uses structured CSV columns: Class Name, Date Range, Student Name,
   * Roll No, Date, Status, Check-in Time, Confidence Score.
   */
  const handleAttendanceExport = (format) => {
    setIsExporting(true);
    setTimeout(() => {
      if (!isMounted()) return;
      try {
        const meta = {
          className: selectedClass || "All Classes",
          dateRange: "Today — " + new Date().toLocaleDateString(),
          teacherName: teacher?.name || "N/A",
          instituteName: userProfile?.instituteName || "Learnova Institute",
        };

        const attendanceSummary = {
          totalStudents: attendanceStats.totalStudents,
          presentToday: attendanceStats.presentToday,
          absentToday: attendanceStats.absentToday,
          lateToday: attendanceStats.lateToday,
        };

        // Map roster to the shape exportAttendancePDF / exportAnalyticsCSV expect
        const rosterRows = studentAttendanceData.map((student) => ({
          Date: student.date || new Date().toLocaleDateString(),
          studentName: student.name,
          rollNo: student.rollNo,
          status: student.status,
          time: student.time || "—",
          confidence: student.confidence != null ? student.confidence : null,
        }));

        if (format === "csv") {
          // Build the structured CSV directly with all required columns
          const csvRows = studentAttendanceData.map((student) => ({
            "Class Name": meta.className,
            "Date Range": meta.dateRange,
            "Student Name": student.name || "—",
            "Roll No": student.rollNo || "—",
            Date: student.date || new Date().toLocaleDateString(),
            Status: (student.status || "absent").toUpperCase(),
            "Check-in Time": student.time || "—",
            "Confidence Score":
              student.confidence != null ? `${student.confidence}%` : "—",
            "Attendance %": "—",
          }));
          exportToCSV(
            csvRows,
            `attendance-report-${meta.className.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${new Date().toISOString().slice(0, 10)}`
          );
        } else {
          exportAttendancePDF(rosterRows, {
            ...meta,
            logoUrl: userProfile?.logoUrl || null,
            summary: attendanceSummary,
          });
        }
        toast.success(`Successfully exported as ${format.toUpperCase()}`);
      } catch (error) {
        console.error("Attendance export failed:", error);
        toast.error("Failed to export attendance report");
      } finally {
        if (isMounted()) setIsExporting(false);
      }
    }, 500);
  };

  // Fetch Teacher Profile & Schedule
  useEffect(() => {
    if (userProfile) {
      setTeacher({
        name:
          userProfile.displayName ||
          userProfile.name ||
          userProfile.firstName + " " + userProfile.lastName ||
          "Teacher",
        id: userProfile.uid || user?.uid || "TCH001",
        email: userProfile.email || user?.email || "",
        department: userProfile.department || "General",
        designation: userProfile.designation || "Teacher",
        subjects: userProfile.subjects || [],
        avatar: userProfile.avatar || null,
      });
    }

    const fetchSchedule = async () => {
      if (!user) return;
      try {
        const scheduleRef = collection(db, "schedules");
        const q = query(scheduleRef, where("teacherId", "==", user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          if (docData.weeklySchedule) {
            if (isMounted()) setWeeklySchedule(docData.weeklySchedule);
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching schedule, falling back to mock:", error);
        toast.error(
          "Could not load your schedule. Showing sample data instead."
        );
      }

      // Fallback Mock Schedule
      if (isMounted()) {
        setWeeklySchedule({
          Monday: [
            {
              time: "09:00-10:30",
              subject: "Data Structures",
              room: "Lab-1",
              students: 45,
              semester: "4th",
              section: "A",
            },
            {
              time: "11:00-12:30",
              subject: "Web Development",
              room: "Lab-3",
              students: 42,
              semester: "6th",
              section: "B",
            },
            {
              time: "14:00-15:30",
              subject: "Database Systems",
              room: "Lab-2",
              students: 38,
              semester: "5th",
              section: "A",
            },
          ],
          Tuesday: [
            {
              time: "09:00-10:30",
              subject: "Data Structures",
              room: "Lab-1",
              students: 45,
              semester: "4th",
              section: "A",
            },
            {
              time: "11:00-12:30",
              subject: "Database Systems",
              room: "Lab-2",
              students: 38,
              semester: "5th",
              section: "A",
            },
          ],
          Wednesday: [
            {
              time: "09:00-10:30",
              subject: "Web Development",
              room: "Lab-3",
              students: 42,
              semester: "6th",
              section: "B",
            },
            {
              time: "14:00-15:30",
              subject: "Data Structures",
              room: "Lab-1",
              students: 45,
              semester: "4th",
              section: "A",
            },
          ],
          Thursday: [
            {
              time: "09:00-10:30",
              subject: "Database Systems",
              room: "Lab-2",
              students: 38,
              semester: "5th",
              section: "A",
            },
            {
              time: "11:00-12:30",
              subject: "Web Development",
              room: "Lab-3",
              students: 42,
              semester: "6th",
              section: "B",
            },
          ],
          Friday: [
            {
              time: "09:00-10:30",
              subject: "Data Structures",
              room: "Lab-1",
              students: 45,
              semester: "4th",
              section: "A",
            },
          ],
        });
      }
    };

    fetchSchedule();
  }, [user, userProfile]);

  const fetchAllRequests = async () => {
    if (!user) return;

    setIsLoadingRequests(true);
    try {
      const token = await user.getIdToken();
      const response = await apiFetch("/api/exceptions/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const payload = data.data ?? data;

      // Normalize data structure
      const normalizedRequests = (payload.exceptions || []).map((req) => ({
        id: req._id || req.id,
        studentName: req.studentName || req.student || "Unknown Student",
        studentId: req.studentId || req.rollNo || "",
        className: req.className || req.class || "",
        reason: req.reason || "",
        details: req.details || "",
        status: req.status || "pending",
        timestamp: req.createdAt || req.timestamp,
        currentLocation: req.currentLocation,
        comments: req.comments || "",
        reviewedBy: req.reviewedBy || "",
        reviewedAt: req.reviewedAt || "",
      }));

      if (isMounted()) {
        setAllRequests(normalizedRequests);
        setShowAllRequestsModal(true);
      }
    } catch (error) {
      if (isMounted()) setRequestsError(error.message);
    } finally {
      if (isMounted()) setIsLoadingRequests(false);
    }
  };

  // Fetch exception requests using safe polling hook
  useSafePolling(
    async (signal) => {
      if (!user) return;

      if (isInitialFetchRef.current) {
        setIsLoadingRequests(true);
      }
      setRequestsError(null);

      try {
        const token = await user.getIdToken();
        const response = await apiFetch("/api/exceptions/list", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const payload = data.data ?? data;

        // Normalize data structure
        const normalizedRequests = (payload.exceptions || []).map((req) => ({
          id: req._id || req.id,
          studentName: req.studentName || req.student || "Unknown Student",
          studentId: req.studentId || req.rollNo || "",
          className: req.className || req.class || "",
          reason: req.reason || "",
          details: req.details || "",
          status: req.status || "pending",
          timestamp: req.createdAt || req.timestamp,
          currentLocation: req.currentLocation,
          comments: req.comments || "",
          reviewedBy: req.reviewedBy || "",
          reviewedAt: req.reviewedAt || "",
        }));

        setExceptionRequests(normalizedRequests);
      } catch (error) {
        if (error?.name !== "AbortError") {
          setRequestsError(error.message);
        }
        throw error;
      } finally {
        if (isInitialFetchRef.current) {
          setIsLoadingRequests(false);
          isInitialFetchRef.current = false;
        }
      }
    },
    30000,
    [user]
  );

  const handleExceptionRequest = async (id, action) => {
    try {
      const token = await user.getIdToken();
      const response = await apiFetch("/api/exceptions/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exceptionId: id,
          status: action,
          comments: `${
            action === "approved" ? "Approved" : "Rejected"
          } by teacher`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update request: ${response.status}`);
      }

      if (isMounted()) {
        // Update local state
        setExceptionRequests((prev) =>
          prev.map((req) =>
            req.id === id
              ? {
                  ...req,
                  status: action,
                  comments: `${
                    action === "approved" ? "Approved" : "Rejected"
                  } by teacher`,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: user.displayName || user.email,
                }
              : req
          )
        );
      }
    } catch (error) {
      toast.error("Failed to update request. Please try again.");
    }
  };

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (timer) {
        clearInterval(timer);
      }
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
    };
  }, []);

  useEffect(() => {
    const now = new Date();

    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay();

    const isWeekday = day >= 1 && day <= 5;
    const isAttendanceTime = hour === 9 && minute <= 10;

    setAttendanceWindow(isWeekday && isAttendanceTime);

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const today = dayNames[day];

    setTodayClasses(
      Array.isArray(weeklySchedule?.[today]) ? weeklySchedule[today] : []
    );
  }, [weeklySchedule]);

  const generatePasscode = async () => {
    setPasscodeLoading(true);
    try {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const randomValues = new Uint32Array(8);
      crypto.getRandomValues(randomValues);
      let passcode = "";
      for (let i = 0; i < 8; i++) {
        passcode += chars.charAt(randomValues[i] % chars.length);
      }

      const token = await user.getIdToken();
      const res = await apiFetch("/api/attendance/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ passcode, expiresInMinutes: 10 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save passcode");
      }

      if (isMounted()) {
        setCurrentPasscode(passcode);
        setPasscodeGenerated(true);
        setAttendanceWindow(true);
        setPasscodeExpiresAt(data.expiresAt);
        setShowPasscodeModal(true);
      }
      toast.success("Attendance passcode generated and saved");
    } catch (err) {
      toast.error(err.message || "Failed to generate passcode");
    } finally {
      if (isMounted()) setPasscodeLoading(false);
    }
  };

  const closeAttendanceWindow = async () => {
    setPasscodeLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await apiFetch("/api/attendance/settings", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to close attendance window");
      }

      if (isMounted()) {
        setAttendanceWindow(false);
        setCurrentPasscode("");
        setPasscodeGenerated(false);
        setPasscodeExpiresAt(null);
      }
      toast.success("Attendance window closed");
    } catch (err) {
      toast.error(err.message || "Failed to close attendance window");
    } finally {
      if (isMounted()) setPasscodeLoading(false);
    }
  };

  const copyPasscode = () => {
    navigator.clipboard.writeText(currentPasscode);
    setCopied(true);
    toast.success("Passcode copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      case "absent":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "late":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      default:
        return "text-muted-foreground dark:text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "T";
  };

  if (loading) {
    return <DashboardSkeleton />;
  }
  const renderDashboard = () => {
    const defaultDashboardLayout = [
      { i: "overview", x: 0, y: 0, w: 8, h: 9 },
      { i: "live", x: 0, y: 9, w: 8, h: 6 },
      { i: "exceptions", x: 0, y: 15, w: 8, h: 8 },
      { i: "schedule", x: 8, y: 0, w: 4, h: 8 },
      { i: "actions", x: 8, y: 8, w: 4, h: 6 },
      { i: "security", x: 8, y: 14, w: 4, h: 6 },
    ];

    return (
      <div className="space-y-8">
        {/* Passcode Generation Section */}
        {attendanceWindow && (
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Key className="w-6 h-6 text-foreground dark:text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground dark:text-white">
                    Attendance Window Active
                  </h3>
                  <p className="text-muted-foreground dark:text-gray-300">
                    Generate passcode to unlock student attendance
                  </p>
                </div>
              </div>
              {passcodeExpiresAt && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground dark:text-gray-400">
                    Expires at
                  </div>
                  <div className="text-foreground dark:text-white font-semibold">
                    {new Date(passcodeExpiresAt).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>

            {!passcodeGenerated ? (
              <button
                onClick={generatePasscode}
                disabled={passcodeLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-foreground dark:text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="flex items-center justify-center space-x-2">
                  {passcodeLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  <span>
                    {passcodeLoading
                      ? "Generating..."
                      : "Generate Attendance Passcode"}
                  </span>
                  {!passcodeLoading && <Sparkles className="w-5 h-5" />}
                </span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-card/40 dark:bg-card/40 dark:bg-black/40 rounded-xl p-4 border border-border dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400 mb-1">
                        Active Passcode
                      </div>
                      <div className="text-2xl font-mono text-foreground dark:text-white font-bold tracking-wider">
                        {currentPasscode}
                      </div>
                      {passcodeExpiresAt && (
                        <div className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                          Expires:{" "}
                          {new Date(passcodeExpiresAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={copyPasscode}
                      aria-label="Copy passcode"
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-foreground dark:text-white p-3 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={closeAttendanceWindow}
                  disabled={passcodeLoading}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {passcodeLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>
                    {passcodeLoading ? "Closing..." : "Close Attendance Window"}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 pb-8 px-2 md:px-6">
          <DraggableDashboardLayout
            defaultLayout={defaultDashboardLayout}
            layoutKey="teacher_main"
          >
            {/* Attendance Overview */}
            <div key="overview" className="h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground dark:text-white">
                  Today's Attendance Overview
                </h2>
                <button
                  aria-label="Refresh attendance"
                  className="text-accent hover:text-accent/80 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-400">
                    {attendanceStats.totalStudents}
                  </div>
                  <div className="text-blue-300 text-sm">Total Students</div>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">
                    {attendanceStats.presentToday}
                  </div>
                  <div className="text-green-300 text-sm">Present</div>
                </div>

                <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl p-4 border border-red-500/30">
                  <div className="text-2xl font-bold text-red-400">
                    {attendanceStats.absentToday}
                  </div>
                  <div className="text-red-300 text-sm">Absent</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl p-4 border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-400">
                    {attendanceStats.lateToday}
                  </div>
                  <div className="text-yellow-300 text-sm">Late</div>
                </div>
              </div>

              {/* Current Class Attendance */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground dark:text-white">
                  Current Class Attendance
                </h3>
                <div className="space-y-2">
                  {studentAttendanceData.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            student.status === "present"
                              ? "bg-green-400"
                              : student.status === "absent"
                                ? "bg-red-400"
                                : "bg-yellow-400"
                          }`}
                        />
                        <div>
                          <div className="text-foreground dark:text-white font-medium">
                            {student.name}
                          </div>
                          <div className="text-muted-foreground dark:text-gray-400 text-sm">
                            {student.rollNo}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            student.status
                          )}`}
                        >
                          {student.status.toUpperCase()}
                        </div>
                        <div className="text-muted-foreground dark:text-gray-400 text-sm mt-1">
                          {student.status !== "absent" && (
                            <span>
                              {student.time} ({student.confidence}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Check-Ins */}
            <div key="live" className="h-full">
              <LiveAttendanceView title="Live Check-Ins" className="h-full" />
            </div>

            {/* Exception Requests */}
            <div key="exceptions" className="h-full">
              <ExceptionRequestsList
                exceptionRequests={exceptionRequests}
                isLoadingRequests={isLoadingRequests}
                requestsError={requestsError}
                fetchAllRequests={fetchAllRequests}
                showAllRequestsModal={showAllRequestsModal}
                setShowAllRequestsModal={setShowAllRequestsModal}
                allRequests={allRequests}
                handleExceptionRequest={handleExceptionRequest}
              />
            </div>

            {/* Today's Schedule */}
            <div key="schedule" className="h-full">
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-bold text-foreground dark:text-white">
                  Today's Classes
                </h2>
              </div>

              {todayClasses.length > 0 ? (
                <div className="space-y-3">
                  {todayClasses.map((cls, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-foreground dark:text-white font-medium">
                          {cls.subject}
                        </div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400">
                          {cls.time}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400 mb-2">
                        {cls.semester} - Section {cls.section}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-accent" />
                          <span className="text-xs text-accent">
                            {cls.room}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-blue-400">
                            {cls.students}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-muted-foreground dark:text-gray-400">
                    No classes scheduled for today
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div key="actions" className="h-full">
              <h2 className="text-xl font-bold text-foreground dark:text-white mb-6">
                Quick Actions
              </h2>

              <div className="space-y-3">
                <ExportDropdown
                  onExport={handleAttendanceExport}
                  isExporting={isExporting}
                  label="Export Reports"
                  className="w-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 text-foreground dark:text-white p-3 rounded-xl transition-colors text-left flex justify-start items-center"
                >
                  <div className="flex items-center space-x-3 text-left">
                    <Download className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="font-medium text-foreground dark:text-white">
                        Export Reports
                      </div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
                        CSV / PDF formats
                      </div>
                    </div>
                  </div>
                </ExportDropdown>

                <button
                  className="w-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 text-foreground dark:text-white p-3 rounded-xl transition-colors text-left"
                  aria-label="Upload schedule"
                >
                  <div className="flex items-center space-x-3">
                    <Upload className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="font-medium">Upload Schedule</div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
                        Weekly timetable
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  className="w-full bg-gradient-to-r from-orange-600/20 to-red-600/20 hover:from-orange-600/30 hover:to-red-600/30 border border-orange-500/30 text-foreground dark:text-white p-3 rounded-xl transition-colors text-left"
                  aria-label="Send notification"
                >
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-orange-400" />
                    <div>
                      <div className="font-medium">Send Notification</div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
                        To students/parents
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Security Status */}
            <div key="security" className="h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-muted-foreground dark:text-gray-300 text-sm">
                      Face Recognition
                    </span>
                  </div>
                  <span className="text-green-400 text-sm">Active</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-muted-foreground dark:text-gray-300 text-sm">
                      GPS Geofencing
                    </span>
                  </div>
                  <span className="text-green-400 text-sm">Active</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-muted-foreground dark:text-gray-300 text-sm">
                      Time Window
                    </span>
                  </div>
                  <span className="text-green-400 text-sm">Configured</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-muted-foreground dark:text-gray-300 text-sm">
                      Live Monitoring
                    </span>
                  </div>
                  <span className="text-blue-400 text-sm">Running</span>
                  <span className="text-blue-400 text-sm">Running</span>
                </div>
              </div>
            </div>
          </DraggableDashboardLayout>
        </div>

        <AttendancePasscodeModal
          showPasscodeModal={showPasscodeModal}
          setShowPasscodeModal={setShowPasscodeModal}
          currentPasscode={currentPasscode}
          copyPasscode={copyPasscode}
          copied={copied}
        />
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground dark:text-white mb-2">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground dark:text-gray-400">
            Detailed insights and trends
          </p>
        </div>
        {/* Analytics export button */}
        <ExportDropdown
          onExport={handleExport}
          isExporting={isExporting}
          label="Export Analytics"
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 text-foreground dark:text-white px-4 py-2.5 rounded-xl transition-colors text-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Trends */}
        <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6">
          <h3 className="text-xl font-bold text-foreground dark:text-white mb-4">
            Attendance Trends
          </h3>
          <div className="w-full aspect-video min-h-[300px] overflow-hidden">
            <AttendanceTrendsChart />
          </div>
        </div>

        <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6">
          <h3 className="text-xl font-bold text-foreground dark:text-white mb-4">
            Student Engagement
          </h3>
          <div className="w-full min-h-[300px] overflow-hidden flex items-center justify-center">
            <EngagementChart />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mt-8">
        <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6">
          <AttendanceAnalytics userId={user?.uid} />
        </div>
        {/* feat: AI-powered attendance risk dashboard (issue #2183) */}
        <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6">
          <AttendanceRiskDashboard />
          <div className="mt-8">
            <ClassroomMoodWidget />
          </div>
        </div>
      </div>

      {showAbsentSummaryModal && (
        <AbsentSummaryModal
          isOpen={showAbsentSummaryModal}
          onClose={() => setShowAbsentSummaryModal(false)}
          absentStudents={studentAttendanceData.filter(s => s.status === "absent")}
        />
      )}
    </div>
  );

  const handleExportSingleClass = (cls, day) => {
    let icsString = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Learnova//Teacher Schedule//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ].join("\r\n") + "\r\n";

    const [startStr, endStr] = (cls.time || "").split("-");
    if (!startStr || !endStr) return;

    // Helper to get next weekday date
    const getNextWeekdayDate = (dayName, timeStr) => {
      const weekdays = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
      const targetDay = weekdays[dayName];
      const now = new Date();
      const currentDay = now.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd < 0) daysToAdd += 7;
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + daysToAdd);
      const [hours, minutes] = timeStr.split(":").map(Number);
      targetDate.setHours(hours || 9, minutes || 0, 0, 0);
      return targetDate;
    };

    const formatDateToICS = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      const ss = "00";
      return `${yyyy}${mm}${dd}T${hh}${min}${ss}`;
    };

    const startDate = getNextWeekdayDate(day, startStr.trim());
    const endDate = getNextWeekdayDate(day, endStr.trim());
    const byDayMap = { Sunday: "SU", Monday: "MO", Tuesday: "TU", Wednesday: "WE", Thursday: "TH", Friday: "FR", Saturday: "SA" };

    icsString += [
      "BEGIN:VEVENT",
      `UID:class-${day}-${Date.now()}@learnova`,
      `DTSTAMP:${formatDateToICS(new Date())}`,
      `SUMMARY:${cls.subject}`,
      `DESCRIPTION:Room: ${cls.room}`,
      `LOCATION:${cls.room}`,
      `DTSTART:${formatDateToICS(startDate)}`,
      `DTEND:${formatDateToICS(endDate)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${byDayMap[day]}`,
      "END:VEVENT",
    ].join("\r\n") + "\r\n";
    icsString += "END:VCALENDAR";

    const blob = new Blob([icsString], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${(cls.subject || "Class").replace(/\s+/g, '_')}_schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${cls.subject} to .ics!`);
  };

  const renderSchedule = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground dark:text-white mb-2">
          Class Schedule
        </h2>
        <p className="text-muted-foreground dark:text-gray-400">
          Weekly timetable and management
        </p>
      </div>

      <div className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {Object.entries(weeklySchedule).map(([day, classes]) => (
            <div key={day} className="space-y-3">
              <h3 className="text-lg font-bold text-foreground dark:text-white text-center">
                {day}
              </h3>
              {classes.map((cls, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 relative group"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleExportSingleClass(cls, day)}
                      className="p-1 rounded bg-black/40 text-gray-400 hover:text-green-400 transition-colors"
                      title="Add to Calendar"
                    >
                      <CalendarPlus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-sm font-medium text-foreground dark:text-white pr-5">
                    {cls.subject}
                  </div>
                  <div className="text-xs text-muted-foreground dark:text-gray-400">
                    {cls.time}
                  </div>
                  <div className="text-xs text-accent">{cls.room}</div>
                  <div className="text-xs text-blue-400">
                    {cls.students} students
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen bg-background relative overflow-hidden ${dashboardContentOffsetClass}`}
    >
      {/* Premium Navbar */}
      <Navbar />
      {/* Animated Gradient Backgrounds */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none animate-gradientMove" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.12)_0%,transparent_60%)] pointer-events-none" />

      {/* Premium Heading Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto pt-20 pb-6 px-6">
          <div className="bg-card/40 dark:bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 shadow-2xl">
            {/* Main Header Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left - Teacher Profile */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={`${user?.displayName || user?.email?.split("@")[0] || "Teacher"} profile photo`}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-xl border border-accent/30 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center border border-accent/30">
                      <span className="text-sm font-bold text-foreground dark:text-white">
                        {user?.displayName
                          ? user.displayName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : user?.email?.[0]?.toUpperCase() || "T"}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black" />
                </div>

                <div>
                  <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
                    {user?.displayName ||
                      user?.email?.split("@")[0] ||
                      "Teacher"}
                  </h1>
                  <div className="text-sm text-muted-foreground dark:text-gray-400">
                    {user?.email}
                  </div>
                </div>
              </div>

              {/* Right - Time & Status */}
              <div className="flex items-center gap-6">
                {/* Current Time */}
                <div className="text-right">
                  <div className="text-xl font-mono text-foreground dark:text-white">
                    {currentTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground dark:text-gray-400">
                    {currentTime.toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex flex-col gap-2">
                  {attendanceWindow ? (
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400 text-xs font-medium">
                        Attendance Active
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gray-500/10 border border-gray-500/30 rounded-lg px-3 py-1">
                      <Clock className="w-3 h-3 text-muted-foreground dark:text-gray-400" />
                      <span className="text-muted-foreground dark:text-gray-400 text-xs">
                        Waiting for window
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <div className="flex md:flex-row space-y-1 flex-col items-center md:gap-3">
                <span className="text-sm text-muted-foreground dark:text-gray-400">
                  Quick Actions:
                </span>
                {attendanceWindow && (
                  <button
                    onClick={generatePasscode}
                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2"
                    aria-label="Action button"
                  >
                    <Key className="w-3 h-3" />
                    Generate Passcode
                  </button>
                )}
                <button
                  onClick={() => handleAttendanceExport("csv")}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2"
                  aria-label="Export attendance data as CSV"
                >
                  <Download className="w-3 h-3" />
                  Export Data
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground dark:text-gray-400">
                  System Status: Online
                </span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Simple Navigation Tabs */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 mt-4">
        <div className="flex space-x-1 bg-card/40 dark:bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-1 border border-border dark:border-white/10">
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "curriculum", label: "Curriculum", icon: BookOpen },
            { id: "achievements", label: "Achievements", icon: Award },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
            { id: "schedule", label: "Schedule", icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center md:space-x-2 space-x-1 md:px-4 px-2 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-accent to-blue-500 text-foreground dark:text-white shadow-lg"
                  : "text-muted-foreground dark:text-gray-400 hover:text-foreground dark:text-white hover:bg-muted/50 dark:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradientMove {
          background-size: 200% 200%;
          animation: gradientMove 12s ease-in-out infinite;
        }
      `}</style>
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "curriculum" && <CurriculumBuilder />}
        {activeTab === "achievements" && <TeacherAchievementPanel />}
        {activeTab === "analytics" && renderAnalytics()}
        {activeTab === "schedule" && renderSchedule()}
      </div>
    </div>
  );
};
export default React.memo(TeacherDashboard);
