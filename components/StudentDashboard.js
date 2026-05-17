import SkeletonCard from "@/components/ui/SkeletonCard";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  MapPin,
  Camera,
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
  Wifi,
  Shield,
  Smartphone,
  Eye,
  Users,
  BarChart3,
  Download,
  Filter,
  Search,
  RefreshCw,
  Star,
  Sparkles,
} from "lucide-react";
import { Navbar } from "./Navbar";
import AttendanceHeatmap from "./AttendanceHeatmap";
import { useAuth } from "@/hooks/useAuth";

const StudentDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceStatus, setAttendanceStatus] = useState("pending");
  const [todayClasses, setTodayClasses] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 85,
    absent: 12,
    late: 8,
    percentage: 87.2,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingClass, setUpcomingClass] = useState(null);
  const [isAttendanceWindow, setIsAttendanceWindow] = useState(false);
  const { user } = useAuth();

  // Mock schedule data
  const weeklySchedule = {
    Monday: [
      {
        time: "09:00-10:30",
        subject: "Data Structures",
        teacher: "Dr. Smith",
        room: "Lab-1",
      },
      {
        time: "10:45-12:15",
        subject: "Mathematics",
        teacher: "Prof. Johnson",
        room: "Room-205",
      },
      {
        time: "14:00-15:30",
        subject: "Database Systems",
        teacher: "Dr. Brown",
        room: "Lab-2",
      },
    ],
    Tuesday: [
      {
        time: "09:00-10:30",
        subject: "Web Development",
        teacher: "Ms. Wilson",
        room: "Lab-3",
      },
      {
        time: "10:45-12:15",
        subject: "Computer Networks",
        teacher: "Dr. Davis",
        room: "Room-301",
      },
    ],
    Wednesday: [
      {
        time: "09:00-10:30",
        subject: "Machine Learning",
        teacher: "Prof. Lee",
        room: "Lab-1",
      },
      {
        time: "10:45-12:15",
        subject: "Software Engineering",
        teacher: "Dr. Miller",
        room: "Room-204",
      },
    ],
    Thursday: [
      {
        time: "09:00-10:30",
        subject: "Data Structures",
        teacher: "Dr. Smith",
        room: "Lab-1",
      },
      {
        time: "10:45-12:15",
        subject: "Mobile Development",
        teacher: "Ms. Garcia",
        room: "Lab-4",
      },
    ],
    Friday: [
      {
        time: "09:00-10:30",
        subject: "AI Ethics",
        teacher: "Prof. Chen",
        room: "Room-101",
      },
      {
        time: "10:45-12:15",
        subject: "Project Work",
        teacher: "Dr. Kumar",
        room: "Lab-2",
      },
    ],
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check if it's attendance window (9:00-9:10 AM on weekdays)
      const hour = now.getHours();
      const minute = now.getMinutes();
      const day = now.getDay();

      const isWeekday = day >= 1 && day <= 5;
      const isAttendanceTime = hour === 9 && minute <= 10;

      setIsAttendanceWindow(isWeekday && isAttendanceTime);

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

      // Find upcoming class
      if (weeklySchedule[today]) {
        const upcoming = weeklySchedule[today].find((cls) => {
          const [startTime] = cls.time.split("-");
          const [classHour, classMinute] = startTime.split(":").map(Number);
          return (
            hour < classHour || (hour === classHour && minute < classMinute)
          );
        });
        setUpcomingClass(upcoming);
      }
    }, 1000);

    // Mock recent activity
    setRecentActivity([
      {
        date: "2024-01-15",
        subject: "Data Structures",
        status: "present",
        time: "09:05",
      },
      {
        date: "2024-01-14",
        subject: "Mathematics",
        status: "present",
        time: "09:02",
      },
      {
        date: "2024-01-13",
        subject: "Database Systems",
        status: "late",
        time: "09:08",
      },
      {
        date: "2024-01-12",
        subject: "Web Development",
        status: "present",
        time: "09:01",
      },
      {
        date: "2024-01-11",
        subject: "Computer Networks",
        status: "absent",
        time: "--",
      },
    ]);

    return () => clearInterval(timer);
  }, []);

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
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

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
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <div className="flex md:flex-row space-y-1 flex-col items-center md:gap-3">
                <span className="text-sm text-gray-400">Quick Actions:</span>
                <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center md:gap-2">
                  <Download className="w-3 h-3" />
                  Export Data
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  System Status: Online
                </span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ...existing code... */}
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
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions */}
        {isAttendanceWindow && upcomingClass && (
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Mark Attendance
                  </h3>
                  <p className="text-gray-300">
                    Attendance window is open for {upcomingClass.subject}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Next Class</div>
                <div className="text-white font-semibold">
                  {upcomingClass.time}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Time Window</span>
                </div>
                <div className="text-white font-semibold">09:00 - 09:10 AM</div>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Location</span>
                </div>
                <div className="text-white font-semibold">
                  {upcomingClass.room}
                </div>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Security</span>
                </div>
                <div className="text-white font-semibold">
                  GPS + Face + Code
                </div>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
              <span className="flex items-center justify-center space-x-2">
                <Camera className="w-5 h-5" />
                <span>Start Face Recognition</span>
                <Sparkles className="w-5 h-5" />
              </span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Attendance Overview */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Attendance Overview
                </h2>
                <button className="text-accent hover:text-accent/80 transition-colors">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">
                    {attendanceStats.present}
                  </div>
                  <div className="text-green-300 text-sm">Present</div>
                </div>

                <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl p-4 border border-red-500/30">
                  <div className="text-2xl font-bold text-red-400">
                    {attendanceStats.absent}
                  </div>
                  <div className="text-red-300 text-sm">Absent</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl p-4 border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-400">
                    {attendanceStats.late}
                  </div>
                  <div className="text-yellow-300 text-sm">Late</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-400">
                    {attendanceStats.percentage}%
                  </div>
                  <div className="text-blue-300 text-sm">Overall</div>
                </div>
              </div>

              {/* Attendance Percentage Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Attendance Percentage</span>
                  <span className="text-accent font-semibold">
                    {attendanceStats.percentage}%
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${attendanceStats.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  Target: 75% minimum required
                </div>
              </div>
              <AttendanceHeatmap recentActivity={recentActivity} />
            </div>

            {/* Recent Activity */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Recent Activity
                </h2>
                <button className="text-accent hover:text-accent/80 transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          activity.status === "present"
                            ? "bg-green-400"
                            : activity.status === "absent"
                            ? "bg-red-400"
                            : "bg-yellow-400"
                        }`}
                      />
                      <div>
                        <div className="text-white font-medium">
                          {activity.subject}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {activity.date}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          activity.status
                        )}`}
                      >
                        {activity.status.toUpperCase()}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Today's Schedule */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-bold text-white">
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
                        <div className="text-white font-medium">
                          {cls.subject}
                        </div>
                        <div className="text-sm text-gray-400">{cls.time}</div>
                      </div>
                      <div className="text-sm text-gray-400">{cls.teacher}</div>
                      <div className="flex items-center space-x-1 mt-2">
                        <MapPin className="w-3 h-3 text-accent" />
                        <span className="text-xs text-accent">{cls.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    No classes scheduled for today
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Quick Stats</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300 text-sm">This Week</span>
                  </div>
                  <span className="text-white font-semibold">4/5</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">This Month</span>
                  </div>
                  <span className="text-white font-semibold">18/20</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300 text-sm">Perfect Days</span>
                  </div>
                  <span className="text-white font-semibold">12</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300 text-sm">Streak</span>
                  </div>
                  <span className="text-white font-semibold">5 days</span>
                </div>
              </div>
            </div>

            {/* Security Status */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold text-white">
                  Security Status
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">
                      Face Registered
                    </span>
                  </div>
                  <span className="text-green-400 text-sm">Active</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">
                      Device Verified
                    </span>
                  </div>
                  <span className="text-green-400 text-sm">Trusted</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">
                      Location Access
                    </span>
                  </div>
                  <span className="text-green-400 text-sm">Granted</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300 text-sm">
                      Mobile Verified
                    </span>
                  </div>
                  <span className="text-blue-400 text-sm">
                    +91 ***-***-1234
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
