"use client";

import { useState, useRef, useEffect } from "react";
import { analytics } from "@/lib/firebaseConfig";
import { logEvent } from "firebase/analytics";
import {
  User,
  Edit3,
  Star,
  Award,
  Clock,
  Activity,
  BookOpen,
  Crown,
  Zap,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "./Navbar";
import UniversalProfile from "@/components/universal-profile";

export default function ProfilePage() {
  useEffect(() => {
    if (analytics) {
      logEvent(analytics, "page_view", { page: "profile" });
    }
  }, []);
  const { user ,loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    location: "",
    bio: "Passionate learner exploring the world of knowledge through Learnova Premium.",
    website: "",
    linkedin: "",
    twitter: "",
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    // Handle save logic here
    setIsEditing(false);
    // You would typically make an API call here
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  // Fixed image handling function
  const getUserPhoto = () => {
    return user?.photoURL || null;
  };

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get user display name safely
  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  // Mock data for achievements and activity
  const achievements = [
    {
      icon: Crown,
      title: "Premium Member",
      description: "Exclusive access to all features",
      color: "from-yellow-400 to-orange-500",
    },
    {
      icon: Star,
      title: "Learning Streak",
      description: "30 days consecutive learning",
      color: "from-blue-400 to-purple-500",
    },
    {
      icon: Award,
      title: "Top Performer",
      description: "95% completion rate",
      color: "from-green-400 to-emerald-500",
    },
    {
      icon: Zap,
      title: "Quick Learner",
      description: "Completed 50+ courses",
      color: "from-pink-400 to-red-500",
    },
  ];

  const stats = [
    {
      label: "Courses Completed",
      value: "47",
      icon: BookOpen,
      change: "+5 this month",
    },
    {
      label: "Learning Hours",
      value: "127",
      icon: Clock,
      change: "+12 this week",
    },
    { label: "Achievements", value: "23", icon: Award, change: "+3 new" },
    {
      label: "Streak Days",
      value: "30",
      icon: TrendingUp,
      change: "Personal best!",
    },
  ];

  const recentActivity = [
    {
      type: "course",
      title: "Advanced React Patterns",
      time: "2 hours ago",
      progress: 85,
    },
    {
      type: "achievement",
      title: "Earned 'Quick Learner' badge",
      time: "1 day ago",
      progress: 100,
    },
    {
      type: "course",
      title: "UI/UX Design Fundamentals",
      time: "3 days ago",
      progress: 60,
    },
    {
      type: "attendance",
      title: "Marked attendance",
      time: "5 days ago",
      progress: 100,
    },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "settings", label: "Settings", icon: Edit3 },
  ];

  // Show loading or login prompt if no user
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex items-center justify-center">
        <Navbar />
        <div className="text-center text-white pt-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex items-center justify-center">
        <Navbar />
        <div className="text-center text-white pt-20 px-4">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Profile</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-accent to-purple-500 hover:from-accent/80 hover:to-purple-500/80 text-white px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex items-center justify-center">
        <Navbar />
        <div className="text-center text-white pt-20">
          <div className="w-16 h-16 bg-gradient-to-r from-accent to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
          <p className="text-gray-400">
            You need to be logged in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 pt-20">
      <Navbar />
      <UniversalProfile />
    </div>
  );
}
