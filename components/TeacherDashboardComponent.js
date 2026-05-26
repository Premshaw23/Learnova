import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";
import dynamic from "next/dynamic";
import ChartSkeleton from "@/components/ui/ChartSkeleton";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import AttendanceAnalytics from "@/components/dashboard/AttendanceAnalytics";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

const AttendanceTrendsChart = dynamic(
  () => import("@/components/charts/AttendanceTrendsChart"),
  { ssr: false, loading: () => <ChartSkeleton variant="chart" /> },
);
const EngagementChart = dynamic(
  () => import("@/components/charts/EngagementChart"),
  { ssr: false, loading: () => <ChartSkeleton variant="doughnut" /> },
);

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceWindow, setAttendanceWindow] = useState(false);
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [passcodeGenerated, setPasscodeGenerated] = useState(false);
  const { user } = useAuth();
  const [attendanceStats, setAttendanceStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    averageAttendance: 0,
  });
const fetchTodayAttendanceStats = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const attendanceQuery = query(
      collection(db, "attendance_records"),
      where("date", "==", today),
    );

    const snapshot = await getDocs(attendanceQuery);

    const records = snapshot.docs.map((doc) =>
      doc.data(),
    );

    const presentToday = records.filter(
      (r) =>
        r.status === "present" ||
        !r.status,
    ).length;

    const lateToday = records.filter(
      (r) => r.status === "late",
    ).length;

    const absentToday = records.filter(
      (r) => r.status === "absent",
    ).length;

    const totalStudents = records.length;

    const averageAttendance =
      totalStudents > 0
        ? Math.round(
            ((presentToday + lateToday) /
              totalStudents) *
              1000,
          ) / 10
        : 0;

    setAttendanceStats({
      totalStudents,
      presentToday,
      absentToday,
      lateToday,
      averageAttendance,
    });
  } catch (err) {
    console.error(
      "Failed to fetch today's attendance stats:",
      err,
    );
  }
};

useEffect(() => {
  fetchTodayAttendanceStats();
}, []);
    
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

  // Mock teacher data
  const [teacher] = useState({
    name: "Dr. Sarah Wilson",
    id: "TCH001",
    email: "sarah.wilson@learnova.edu",
    department: "Computer Science",
    designation: "Associate Professor",
    subjects: ["Data Structures", "Web Development", "Database Systems"],
    avatar: null,
  });

  // Mock class schedule
  const weeklySchedule = {
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
  };

  // Mock attendance data
  const studentAttendanceData = [
    {
      id: 1,
      name: "Alex Johnson",
      rollNo: "CS21B1001",
      status: "present",
      time: "09:02",
      confidence: 98,
    },
    {
      id: 2,
      name: "Emma Davis",
      rollNo: "CS21B1002",
      status: "present",
      time: "09:01",
      confidence: 95,
    },
    {
      id: 3,
      name: "Michael Chen",
      rollNo: "CS21B1003",
      status: "late",
      time: "09:08",
      confidence: 92,
    },
    {
      id: 4,
      name: "Sarah Wilson",
      rollNo: "CS21B1004",
      status: "absent",
      time: "--",
      confidence: 0,
    },
    {
      id: 5,
      name: "David Kumar",
      rollNo: "CS21B1005",
      status: "present",
      time: "09:03",
      confidence: 97,
    },
  ];

  const fetchAllRequests = async () => {
    if (!user) return;

    setIsLoadingRequests(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/exceptions/all", {
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

      setAllRequests(normalizedRequests);
      setShowAllRequestsModal(true);
    } catch (error) {
      setRequestsError(error.message);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Fetch exception requests
  useEffect(() => {
    const fetchExceptionRequests = async () => {
      if (!user) return;

      setIsLoadingRequests(true);
      setRequestsError(null);

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/exceptions/list", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
        setRequestsError(error.message);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    fetchExceptionRequests();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchExceptionRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleExceptionRequest = async (id, action) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/exceptions/update", {
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
            : req,
        ),
      );
    } catch (error) {
      toast.error("Failed to update request. Please try again.");
    }
  };

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check if it's attendance window (9:00-9:10 AM on weekdays)
      const hour = now.getHours();
      const minute = now.getMinutes();
      const day = now.getDay();

      const isWeekday = day >= 1 && day <= 5;
      const isAttendanceTime = hour === 9 && minute <= 10;

      setAttendanceWindow(isWeekday && isAttendanceTime);

      // Get today's classes
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
      setTodayClasses(weeklySchedule[today] || []);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(loadingTimer);
    };
  }, []);

  const generatePasscode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let passcode = "";
    for (let i = 0; i < 8; i++) {
      passcode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCurrentPasscode(passcode);
    setPasscodeGenerated(true);
    setAttendanceWindow(true);
    setShowPasscodeModal(true);
  };

  const copyPasscode = () => {
    navigator.clipboard.writeText(currentPasscode);
    setCopied(true);
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
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
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
  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Passcode Generation Section */}
      {attendanceWindow && (
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Attendance Window Active
                </h3>
                <p className="text-gray-300">
                  Generate passcode to unlock student attendance
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Window closes in</div>
              <div className="text-white font-semibold">
                {10 - currentTime.getMinutes()}:
                {String(currentTime.getSeconds()).padStart(2, "0")} min
              </div>
            </div>
          </div>

          {!passcodeGenerated ? (
            <button
              onClick={generatePasscode}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <span className="flex items-center justify-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Generate Attendance Passcode</span>
                <Sparkles className="w-5 h-5" />
              </span>
            </button>
          ) : (
            <div className="bg-black/20 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    Active Passcode
                  </div>
                  <div className="text-2xl font-mono text-white font-bold tracking-wider">
                    {currentPasscode}
                  </div>
                </div>
                <button
                  onClick={copyPasscode}
                  aria-label="Copy passcode"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white p-3 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Attendance Overview */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Today's Attendance Overview
              </h2>
              <button aria-label="Refresh attendance" className="text-accent hover:text-accent/80 transition-colors">
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
              <h3 className="text-lg font-bold text-white">
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
                        <div className="text-white font-medium">
                          {student.name}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {student.rollNo}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          student.status,
                        )}`}
                      >
                        {student.status.toUpperCase()}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
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

          {/* Exception Requests */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 ms:p-6 p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="md:text-2xl text-sm font-bold text-white">
                Exception Requests
              </h2>
              <div className="flex items-center md:space-x-3 space-x-1">
                <button
                  onClick={fetchAllRequests}
                  disabled={isLoadingRequests}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 md:px-3 px-1 py-1 rounded-lg text-xs transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>View All</span>
                  {isLoadingRequests && (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  )}
                </button>
                <span className="bg-red-500/20 text-red-400 md:px-3 px-2 py-1 rounded-full text-xs">
                  {
                    exceptionRequests.filter((req) => req.status === "pending")
                      .length
                  }{" "}
                  Pending
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {isLoadingRequests ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : requestsError ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-red-400 mb-2">Failed to load requests</p>
                  <p className="text-gray-400 text-sm">{requestsError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : exceptionRequests.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    No exception requests at the moment
                  </p>
                </div>
              ) : (
                exceptionRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-white font-medium">
                          {request.studentName}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {request.studentId}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm">
                          {request.className}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {request.timestamp
                            ? new Date(request.timestamp).toLocaleString()
                            : "No date"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-300">
                        <strong>Reason:</strong> {request.reason}
                      </div>
                      {request.currentLocation && (
                        <div className="text-sm text-gray-300">
                          <strong>Current Location:</strong>{" "}
                          {typeof request.currentLocation === "object"
                            ? `${
                                request.currentLocation.distance || "Unknown"
                              }m from institution`
                            : request.currentLocation}
                        </div>
                      )}
                      {request.details && (
                        <div className="text-sm text-gray-300">
                          <strong>Details:</strong> {request.details}
                        </div>
                      )}
                    </div>

                    {request.status === "pending" ? (
                      <div className="flex space-x-3">
                        <button
                          onClick={() =>
                            handleExceptionRequest(request.id, "approved")
                          }
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() =>
                            handleExceptionRequest(request.id, "rejected")
                          }
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === "approved"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {request.status.toUpperCase()}
                        </div>
                        {request.comments && (
                          <div className="text-xs text-gray-400">
                            {request.comments}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          {/* All Requests Modal */}
          {showAllRequestsModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      All Exception Requests
                    </h3>
                    <p className="text-gray-400">
                      Complete history of student exception requests (
                      {allRequests.length} total)
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAllRequestsModal(false)}
                    className="bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 text-white p-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {allRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">
                        No exception requests found
                      </p>
                    </div>
                  ) : (
                    allRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-white font-medium">
                              {request.studentName}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {request.studentId}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white text-sm">
                              {request.className}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {request.timestamp
                                ? new Date(request.timestamp).toLocaleString()
                                : "No date"}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="text-sm text-gray-300">
                            <strong>Reason:</strong> {request.reason}
                          </div>
                          {request.currentLocation && (
                            <div className="text-sm text-gray-300">
                              <strong>Current Location:</strong>{" "}
                              {typeof request.currentLocation === "object"
                                ? `${
                                    request.currentLocation.distance ||
                                    "Unknown"
                                  }m from institution`
                                : request.currentLocation}
                            </div>
                          )}
                          {request.details && (
                            <div className="text-sm text-gray-300">
                              <strong>Details:</strong> {request.details}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              request.status === "approved"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : request.status === "rejected"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            }`}
                          >
                            {request.status?.toUpperCase() || "PENDING"}
                          </div>
                          <div className="text-right">
                            {request.reviewedBy && (
                              <div className="text-xs text-gray-400 mb-1">
                                Reviewed by: {request.reviewedBy}
                              </div>
                            )}
                            {request.reviewedAt && (
                              <div className="text-xs text-gray-400">
                                {new Date(request.reviewedAt).toLocaleString()}
                              </div>
                            )}
                            {request.comments && (
                              <div className="text-xs text-gray-300 mt-1 italic">
                                "{request.comments}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setShowAllRequestsModal(false)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Sidebar */}
        <div className="space-y-8">
          {/* Today's Schedule */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Calendar className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold text-white">Today's Classes</h2>
            </div>

            {todayClasses.length > 0 ? (
              <div className="space-y-3">
                {todayClasses.map((cls, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-medium">
                        {cls.subject}
                      </div>
                      <div className="text-sm text-gray-400">{cls.time}</div>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      {cls.semester} - Section {cls.section}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-accent" />
                        <span className="text-xs text-accent">{cls.room}</span>
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
                <p className="text-gray-400">No classes scheduled for today</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>

            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 text-white p-3 rounded-xl transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="font-medium">Export Reports</div>
                    <div className="text-sm text-gray-400">CSV/PDF formats</div>
                  </div>
                </div>
              </button>

              <button className="w-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 text-white p-3 rounded-xl transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <Upload className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="font-medium">Upload Schedule</div>
                    <div className="text-sm text-gray-400">
                      Weekly timetable
                    </div>
                  </div>
                </div>
              </button>

              <button className="w-full bg-gradient-to-r from-orange-600/20 to-red-600/20 hover:from-orange-600/30 hover:to-red-600/30 border border-orange-500/30 text-white p-3 rounded-xl transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-orange-400" />
                  <div>
                    <div className="font-medium">Send Notification</div>
                    <div className="text-sm text-gray-400">
                      To students/parents
                    </div>
                  </div>
                </div>
              </button>

              <button className="w-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 border border-blue-500/30 text-white p-3 rounded-xl transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="font-medium">View Analytics</div>
                    <div className="text-sm text-gray-400">
                      Detailed insights
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Security Status */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Shield className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">System Status</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 text-sm">
                    Face Recognition
                  </span>
                </div>
                <span className="text-green-400 text-sm">Active</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 text-sm">GPS Geofencing</span>
                </div>
                <span className="text-green-400 text-sm">Active</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 text-sm">Time Window</span>
                </div>
                <span className="text-green-400 text-sm">Configured</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 text-sm">Live Monitoring</span>
                </div>
                <span className="text-blue-400 text-sm">Running</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Passcode Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Attendance Passcode Generated
              </h3>
              <p className="text-gray-400">
                Share this code with your students
              </p>
            </div>

            <div className="bg-black/40 rounded-xl p-6 mb-6 text-center border border-white/10">
              <div className="text-sm text-gray-400 mb-2">Passcode</div>
              <div className="text-4xl font-mono text-white font-bold tracking-wider mb-4">
                {currentPasscode}
              </div>
              <button
                onClick={copyPasscode}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowPasscodeModal(false)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Analytics Dashboard
        </h2>
        <p className="text-gray-400">Detailed insights and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Trends */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            Attendance Trends
          </h3>
          <div className="w-full aspect-video min-h-[300px] overflow-hidden">
            <AttendanceTrendsChart />
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            Student Engagement
          </h3>
          <div className="w-full min-h-[300px] overflow-hidden flex items-center justify-center">
            <EngagementChart />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mt-8">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <AttendanceAnalytics userId={user?.uid} />
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Class Schedule</h2>
        <p className="text-gray-400">Weekly timetable and management</p>
      </div>

      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {Object.entries(weeklySchedule).map(([day, classes]) => (
            <div key={day} className="space-y-3">
              <h3 className="text-lg font-bold text-white text-center">
                {day}
              </h3>
              {classes.map((cls, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50"
                >
                  <div className="text-sm font-medium text-white">
                    {cls.subject}
                  </div>
                  <div className="text-xs text-gray-400">{cls.time}</div>
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Premium Navbar */}
      <Navbar />
      {/* Animated Gradient Backgrounds */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none animate-gradientMove" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.12)_0%,transparent_60%)] pointer-events-none" />

      {/* Premium Heading Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto pt-20 pb-6 px-6">
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            {/* Main Header Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left - Teacher Profile */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-xl border border-accent/30 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center border border-accent/30">
                      <span className="text-sm font-bold text-white">
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
                  <div className="text-sm text-gray-400">{user?.email}</div>
                </div>
              </div>

              {/* Right - Time & Status */}
              <div className="flex items-center gap-6">
                {/* Current Time */}
                <div className="text-right">
                  <div className="text-xl font-mono text-white">
                    {currentTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-xs text-gray-400">
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
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-400 text-xs">
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
                <span className="text-sm text-gray-400">Quick Actions:</span>
                {attendanceWindow && (
                  <button
                    onClick={generatePasscode}
                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2"
                  >
                    <Key className="w-3 h-3" />
                    Generate Passcode
                  </button>
                )}
                <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  Export Data
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
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
        <div className="flex space-x-1 bg-black/20 backdrop-blur-xl rounded-2xl p-1 border border-white/10">
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
            { id: "schedule", label: "Schedule", icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center md:space-x-2 space-x-1 md:px-4 px-2 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-accent to-blue-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
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
        {activeTab === "analytics" && renderAnalytics()}
        {activeTab === "schedule" && renderSchedule()}
      </div>
    </div>
  );
};
export default TeacherDashboard;
