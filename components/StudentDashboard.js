import SkeletonCard from "@/components/ui/SkeletonCard";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
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
import dynamic from "next/dynamic";
import ChartSkeleton from "@/components/ui/ChartSkeleton";

const AttendanceHeatmap = dynamic(
  () => import("./AttendanceHeatmap"),
  { ssr: false, loading: () => <ChartSkeleton variant="heatmap" /> }
);

import { useAuth } from "@/hooks/useAuth";
import AttendanceAnalytics from "./dashboard/AttendanceAnalytics";

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceStatus, setAttendanceStatus] = useState("pending");
  const [todayClasses, setTodayClasses] = useState([]);

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
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const timer = setInterval(() => {
      try {
        const now = new Date();
        setCurrentTime(now);

        const hour = now.getHours();
        const minute = now.getMinutes();
        const day = now.getDay();

        const isWeekday = day >= 1 && day <= 5;
        const isAttendanceTime = hour === 9 && minute <= 10;

        setIsAttendanceWindow(isWeekday && isAttendanceTime);

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

        if (weeklySchedule[today]) {
          const upcoming = weeklySchedule[today].find((cls) => {
            const [startTime] = cls.time.split("-");
            const [classHour, classMinute] = startTime.split(":").map(Number);

            return (
              hour < classHour ||
              (hour === classHour && minute < classMinute)
            );
          });

          setUpcomingClass(upcoming);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Dashboard error:", err);
      }
    }, 1000);

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
    ]);

    return () => {
      clearInterval(timer);
      clearTimeout(loadingTimer);
    };
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500/20 text-red-400 px-6 py-3 rounded-xl hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
    <div>
      {user && user.uid && <AttendanceAnalytics userId={user.uid} />}
      {/* KEEP YOUR ENTIRE EXISTING JSX HERE EXACTLY SAME */}
    </div>
  );
};

export default StudentDashboard;