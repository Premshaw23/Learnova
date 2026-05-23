"use client";

import { useState, useRef, useEffect } from "react";
import { analytics, db } from "@/lib/firebaseConfig";
import { logEvent } from "firebase/analytics";
import Image from "next/image";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Star,
  Award,
  Clock,
  Activity,
  BookOpen,
  Sparkles,
  Shield,
  Crown,
  Zap,
  TrendingUp,
  User2,
  GraduationCap,
  Users,
  Building,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "./Navbar";

export default function UniversalProfile() {
  useEffect(() => {
    if (analytics) {
      logEvent(analytics, "page_view", { page: "profile" });
    }
  }, []);

  const { user, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const fileInputRef = useRef(null);

  // Role state fetched from Firestore
  const [role, setRole] = useState("student");
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data); //to save the full profile data
          setRole(data.role || "student");
        }

        // Fetch dashboard statistics from the userStats collection
        const statsRef = doc(db, "userStats", user.uid);
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          setStats(statsSnap.data());
        }
      } catch (error) {
        // Silently handle error fetching user data / stats
      }
    };
    fetchUserData();
  }, [user]);

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    location: "",
    bio: "Passionate learner exploring the world of knowledge through Learnova.",
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
    setIsEditing(false);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

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

  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const getMemberSince = () => {
    if (!userData?.createdAt) return "Just joined";

    //converting firestore timstamp to JS Dates
    const date = userData.createdAt?.toDate
      ? userData.createdAt.toDate()
      : new Date(userData.createdAt);

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const getRoleConfig = () => {
    const configs = {
      student: {
        icon: GraduationCap,
        label: "Student",
        color: "from-blue-500 to-purple-600",
        achievements: [
          {
            icon: Crown,
            title: "Top Student",
            description: "Excellent academic performance",
            color: "from-yellow-400 to-orange-500",
          },
          {
            icon: Star,
            title: "Perfect Attendance",
            description: "Never missed a class this semester",
            color: "from-blue-400 to-purple-500",
          },
          {
            icon: Award,
            title: "Quick Learner",
            description: "Completed assignments ahead of time",
            color: "from-green-400 to-emerald-500",
          },
          {
            icon: Zap,
            title: "Active Participant",
            description: "Engaged in class discussions",
            color: "from-pink-400 to-red-500",
          },
        ],
        stats: [
          {
            label: "Courses Enrolled",
            value: "8",
            icon: BookOpen,
            change: "+2 this semester",
          },
          {
            label: "Attendance Rate",
            value: "96%",
            icon: UserCheck,
            change: "Excellent",
          },
          {
            label: "Assignments Done",
            value: "47",
            icon: Award,
            change: "+5 this week",
          },
          {
            label: "Study Hours",
            value: "127",
            icon: Clock,
            change: "+12 this week",
          },
        ],
      },
      teacher: {
        icon: Users,
        label: "Teacher",
        color: "from-green-500 to-teal-600",
        achievements: [
          {
            icon: Crown,
            title: "Master Educator",
            description: "Outstanding teaching performance",
            color: "from-yellow-400 to-orange-500",
          },
          {
            icon: Star,
            title: "Student Favorite",
            description: "Highest rated teacher this year",
            color: "from-blue-400 to-purple-500",
          },
          {
            icon: Award,
            title: "Innovation Award",
            description: "Creative teaching methods",
            color: "from-green-400 to-emerald-500",
          },
          {
            icon: Zap,
            title: "Mentor",
            description: "Guided 50+ students to success",
            color: "from-pink-400 to-red-500",
          },
        ],
        stats: [
          {
            label: "Classes Teaching",
            value: "12",
            icon: BookOpen,
            change: "+2 this semester",
          },
          { label: "Students", value: "240", icon: Users, change: "+15 new" },
          {
            label: "Avg. Rating",
            value: "4.8",
            icon: Star,
            change: "Excellent",
          },
          {
            label: "Teaching Hours",
            value: "320",
            icon: Clock,
            change: "+25 this month",
          },
        ],
      },
      admin: {
        icon: Shield,
        label: "Administrator",
        color: "from-purple-500 to-indigo-600",
        achievements: [
          {
            icon: Crown,
            title: "System Administrator",
            description: "Managing platform operations",
            color: "from-yellow-400 to-orange-500",
          },
          {
            icon: Star,
            title: "Efficiency Expert",
            description: "Streamlined administrative processes",
            color: "from-blue-400 to-purple-500",
          },
          {
            icon: Award,
            title: "Security Champion",
            description: "Maintained 99.9% uptime",
            color: "from-green-400 to-emerald-500",
          },
          {
            icon: Zap,
            title: "Problem Solver",
            description: "Resolved 500+ support tickets",
            color: "from-pink-400 to-red-500",
          },
        ],
        stats: [
          {
            label: "Users Managed",
            value: "1,240",
            icon: Users,
            change: "+50 this month",
          },
          {
            label: "System Uptime",
            value: "99.9%",
            icon: Shield,
            change: "Excellent",
          },
          {
            label: "Tickets Resolved",
            value: "523",
            icon: Award,
            change: "+45 this week",
          },
          {
            label: "Active Hours",
            value: "180",
            icon: Clock,
            change: "+20 this week",
          },
        ],
      },
      institute: {
        icon: Building,
        label: "Institute",
        color: "from-orange-500 to-red-600",
        achievements: [
          {
            icon: Crown,
            title: "Premium Institute",
            description: "Top-rated educational institution",
            color: "from-yellow-400 to-orange-500",
          },
          {
            icon: Star,
            title: "Excellence Award",
            description: "Outstanding academic results",
            color: "from-blue-400 to-purple-500",
          },
          {
            icon: Award,
            title: "Innovation Leader",
            description: "Pioneering educational technology",
            color: "from-green-400 to-emerald-500",
          },
          {
            icon: Zap,
            title: "Growth Champion",
            description: "300% enrollment increase",
            color: "from-pink-400 to-red-500",
          },
        ],
        stats: [
          {
            label: "Total Students",
            value: "2,450",
            icon: GraduationCap,
            change: "+150 this year",
          },
          {
            label: "Faculty Members",
            value: "85",
            icon: Users,
            change: "+8 new hires",
          },
          {
            label: "Courses Offered",
            value: "45",
            icon: BookOpen,
            change: "+5 new courses",
          },
          {
            label: "Success Rate",
            value: "94%",
            icon: TrendingUp,
            change: "+2% improvement",
          },
        ],
      },
      parent: {
        icon: User2,
        label: "Parent",
        color: "from-pink-500 to-rose-600",
        achievements: [
          {
            icon: Crown,
            title: "Supportive Parent",
            description: "Actively involved in child's education",
            color: "from-yellow-400 to-orange-500",
          },
          {
            icon: Star,
            title: "Engagement Champion",
            description: "Regular communication with teachers",
            color: "from-blue-400 to-purple-500",
          },
          {
            icon: Award,
            title: "Progress Tracker",
            description: "Monitors child's academic journey",
            color: "from-green-400 to-emerald-500",
          },
          {
            icon: Zap,
            title: "Motivator",
            description: "Encourages learning excellence",
            color: "from-pink-400 to-red-500",
          },
        ],
        stats: [
          {
            label: "Children",
            value: "2",
            icon: Users,
            change: "Both excelling",
          },
          {
            label: "Meetings Attended",
            value: "12",
            icon: Calendar,
            change: "100% attendance",
          },
          {
            label: "Progress Reviews",
            value: "24",
            icon: TrendingUp,
            change: "Monthly tracking",
          },
          {
            label: "Support Hours",
            value: "85",
            icon: Clock,
            change: "Dedicated parent",
          },
        ],
      },
    };
    return configs[role] || configs.student;
  };

  const roleConfig = getRoleConfig();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <div className="text-center text-foreground pt-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <div className="text-center text-foreground pt-20">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
      <Navbar />

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.1),transparent_50%)]" />

      <div className="relative max-w-[88rem] mx-auto px-2 sm:px-4 lg:px-8 py-4 md:py-8">
        {/* Profile Header */}
        <div className="bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/10 p-4 lg:p-8 mb-6 md:mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-all duration-300" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[length:60px_60px]" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-5">
            {/* Profile Image */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-all duration-300" />

              {getUserPhoto() ? (
                <Image
                  src={getUserPhoto() || "/placeholder.svg"}
                  alt="Profile"
                  width={120}
                  height={120}
                  className="relative w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-white/20 object-cover shadow-2xl group-hover:scale-105 transition-all duration-300"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : null}

              <div
                className={`relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br ${
                  roleConfig.color
                } flex items-center justify-center border-4 border-white/20 shadow-2xl group-hover:scale-105 transition-all duration-300 ${
                  getUserPhoto() ? "hidden" : "flex"
                }`}
              >
                <span className="text-2xl md:text-3xl font-bold text-white">
                  {getUserInitials(getUserDisplayName())}
                </span>
              </div>

              <div
                className={`absolute -top-2 -right-2 bg-gradient-to-r ${roleConfig.color} rounded-full p-2 border-2 border-black shadow-lg`}
              >
                <roleConfig.icon className="md:h-5 h-3 w-3 md:w-5 text-white" />
              </div>

              <button
                onClick={handleImageUpload}
                className="absolute -bottom-1 -right-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full p-3 border-2 border-white/20 shadow-lg hover:scale-110 transition-all duration-300 group"
              >
                <Camera className="md:h-4 h-3 w-3 md:w-4 text-white" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  {isEditing ? (
                    <input
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="text-xl md:text-3xl font-bold bg-transparent border-b-2 border-white/30 focus:border-blue-400 outline-none text-white mb-2"
                      placeholder="Your Name"
                    />
                  ) : (
                    <h1 className="text-xl md:text-3xl font-bold text-white mb-2 flex items-center">
                      {getUserDisplayName()}
                      <Sparkles className="ml-2 md:ml-3 h-5 md:h-6 w-5 md:w-6 text-yellow-400 animate-pulse" />
                    </h1>
                  )}

                  <div className="flex items-center space-x-4 text-white/80">
                    <div className="flex items-center">
                      <roleConfig.icon className="h-4 w-4 mr-1 text-green-400" />
                      <span className="text-sm font-medium capitalize">
                        {roleConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-400" />
                      <span className="text-sm">Active Member</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 group"
                    >
                      <Edit3 className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-blue-400 outline-none resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-white/80 text-lg leading-relaxed">
                    {formData.bio}
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10 mb-6 md:mb-2">
                {[
                  {
                    icon: Mail,
                    label: "Email",
                    value: user?.email || formData.email,
                    name: "email",
                  },
                  {
                    icon: Phone,
                    label: "Phone",
                    value: formData.phone,
                    name: "phone",
                    placeholder: "+1 (555) 123-4567",
                  },
                  {
                    icon: MapPin,
                    label: "Location",
                    value: formData.location,
                    name: "location",
                    placeholder: "City, Country",
                  },
                  {
                    icon: Calendar,
                    label: "Member Since",
                    value: getMemberSince(), //calling the function to fetch the date
                    readonly: true,
                  },
                ].map((item) => (
                  <div
                    key={item.name || item.label}
                    className="flex items-center space-x-3 text-white/80"
                  >
                    <item.icon className="h-5 w-5 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-xs text-white/60 uppercase tracking-wide">
                        {item.label}
                      </p>
                      {isEditing && !item.readonly ? (
                        <input
                          name={item.name}
                          value={item.value}
                          onChange={handleInputChange}
                          className="bg-transparent border-b border-white/20 focus:border-blue-400 outline-none text-sm py-2 w-full min-h-[2.25rem]"
                          placeholder={item.placeholder}
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {item.value || "Not provided"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {roleConfig.stats.map((stat, index) => {
            // Retrieve dynamic stat value from database if available, else default to "0"
            const realValue =
              stats && stats[stat.label] !== undefined
                ? stats[stat.label]
                : "0";
            // Retrieve dynamic change indicator if available, else show default fallback
            const realChange =
              stats && stats[`${stat.label}_change`] !== undefined
                ? stats[`${stat.label}_change`]
                : "New";

            return (
              <div
                key={stat.label}
                className="bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 md:p-6 hover:bg-black/30 transition-all duration-300 group relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                    <div className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                      {realChange}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-1">
                      {realValue}
                    </h3>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-white/10">
            <nav className="flex space-x-4 md:space-x-8 px-2 md:px-8 py-2 md:py-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 md:py-3 px-2 md:px-4 border-b-2 transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-400 text-blue-400"
                      : "border-transparent text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-8">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Achievements */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Award className="h-6 w-6 mr-2 text-yellow-400" />
                    Recent Achievements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roleConfig.achievements.map((achievement, index) => (
                      <div
                        key={achievement.title}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`p-3 rounded-xl bg-gradient-to-br ${achievement.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                          >
                            <achievement.icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">
                              {achievement.title}
                            </h4>
                            <p className="text-white/60 text-sm">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Activity className="h-6 w-6 mr-2 text-green-400" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {activity && activity.length > 0 ? (
                      activity.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="flex items-center space-x-4">
                            {/* Color-code indicator based on activity type */}
                            <div
                              className={`w-2 h-2 rounded-full ${
                                item.type === "course"
                                  ? "bg-blue-400"
                                  : item.type === "achievement"
                                    ? "bg-yellow-400"
                                    : "bg-green-400"
                              }`}
                            />
                            <div>
                              <p className="text-white font-medium">
                                {item.title || "Activity logged"}
                              </p>
                              <p className="text-white/60 text-sm">
                                {item.time || "Recently"}
                              </p>
                            </div>
                          </div>

                          {/* Render progress bar only if progress property is available */}
                          {item.progress !== undefined && (
                            <div className="flex items-center space-x-3">
                              <div className="w-16 bg-white/10 rounded-full h-2">
                                <div
                                  className={`h-full rounded-full ${
                                    item.progress === 100
                                      ? "bg-green-400"
                                      : "bg-blue-400"
                                  }`}
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <span className="text-white/60 text-sm w-12">
                                {item.progress}%
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      // Display fallback state when user has no recent activity
                      <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-white/60">
                          No recent activity yet. Start exploring courses!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Detailed Activity Coming Soon
                </h3>
                <p className="text-white/60">
                  We're working on detailed activity tracking and analytics.
                </p>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === "achievements" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roleConfig.achievements.map((achievement, index) => (
                  <div
                    key={achievement.title}
                    className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group text-center"
                  >
                    <div
                      className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${achievement.color} shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}
                    >
                      <achievement.icon className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">
                      {achievement.title}
                    </h4>
                    <p className="text-white/60 text-sm">
                      {achievement.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="text-center py-12">
                <Edit3 className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Advanced Settings
                </h3>
                <p className="text-white/60">
                  Profile settings and preferences will be available here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
