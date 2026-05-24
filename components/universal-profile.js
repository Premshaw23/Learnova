"use client";

import { useState, useRef, useEffect } from "react";
import { analytics, db } from "@/lib/firebaseConfig";
import { logEvent } from "firebase/analytics";
import { updateProfile } from "firebase/auth";
import Image from "next/image";
import toast from "react-hot-toast";

import {
  doc,
  getDoc,
  updateDoc,
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
  const { user, userProfile, loading } = useAuth();

  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  const [role, setRole] = useState(
    userProfile?.role || "student"
  );

  const [userData, setUserData] = useState(
    userProfile || null
  );

  const [stats, setStats] = useState({});

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phone: "",
    location: "",
    bio: "Passionate learner exploring the world of knowledge through Learnova.",
    website: "",
    linkedin: "",
    twitter: "",
  });

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, "page_view", {
        page: "profile",
      });
    }
  }, []);

  useEffect(() => {
    if (user?.photoURL) {
      setAvatarUrl(user.photoURL);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      displayName: user.displayName || "",
      email: user.email || "",
    }));
  }, [user]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.uid) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setUserData(data);
          setRole(data.role || "student");

          setFormData((prev) => ({
            ...prev,
            displayName:
              data.displayName || prev.displayName,
            phone: data.phone || "",
            location: data.location || "",
            bio: data.bio || prev.bio,
            website: data.website || "",
            linkedin: data.linkedin || "",
            twitter: data.twitter || "",
          }));
        }

        const statsRef = doc(
          db,
          "userStats",
          user.uid
        );

        const statsSnap = await getDoc(statsRef);

        if (statsSnap.exists()) {
          setStats(statsSnap.data());
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    const loadingToast = toast.loading(
      "Saving profile..."
    );

    try {
      if (
        formData.displayName &&
        formData.displayName !== user.displayName
      ) {
        await updateProfile(user, {
          displayName: formData.displayName,
        });
      }

      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        displayName: formData.displayName,
        phone: formData.phone || "",
        location: formData.location || "",
        bio: formData.bio || "",
        website: formData.website || "",
        linkedin: formData.linkedin || "",
        twitter: formData.twitter || "",
      });

      setUserData((prev) => ({
        ...prev,
        ...formData,
      }));

      toast.success(
        "Profile saved successfully!",
        {
          id: loadingToast,
        }
      );

      setIsEditing(false);
    } catch (error) {
      toast.error(
        error.message || "Failed to save profile.",
        {
          id: loadingToast,
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        "Please upload a valid image file."
      );
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      toast.error(
        "File size exceeds 5MB limit."
      );

      e.target.value = "";

      return;
    }

    const loadingToast = toast.loading(
      "Uploading profile picture..."
    );

    try {
      const token = await user.getIdToken();

      const uploadFormData = new FormData();

      uploadFormData.append("file", file);

      const res = await fetch("/api/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.error ||
            "Failed to upload image"
        );
      }

      const data = await res.json();

      if (data.success && data.url) {
        await updateProfile(user, {
          photoURL: data.url,
        });

        const userRef = doc(
          db,
          "users",
          user.uid
        );

        await updateDoc(userRef, {
          photoURL: data.url,
        });

        setAvatarUrl(data.url);

        toast.success(
          "Profile picture updated successfully!",
          {
            id: loadingToast,
          }
        );
      } else {
        throw new Error(
          data.error || "Upload failed"
        );
      }
    } catch (error) {
      toast.error(
        error.message ||
          "Failed to update profile picture.",
        {
          id: loadingToast,
        }
      );
    }
  };

  const getUserPhoto = () => {
    return avatarUrl || user?.photoURL || null;
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
    if (formData.displayName) {
      return formData.displayName;
    }

    if (user?.email) {
      return user.email.split("@")[0];
    }

    return "User";
  };

  const getMemberSince = () => {
    if (!userData?.createdAt) {
      return "Just joined";
    }

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
      },

      teacher: {
        icon: Users,
        label: "Teacher",
        color: "from-green-500 to-teal-600",
      },

      admin: {
        icon: Shield,
        label: "Administrator",
        color: "from-purple-500 to-indigo-600",
      },

      institute: {
        icon: Building,
        label: "Institute",
        color: "from-orange-500 to-red-600",
      },

      parent: {
        icon: User2,
        label: "Parent",
        color: "from-pink-500 to-rose-600",
      },
    };

    return configs[role] || configs.student;
  };

  const roleConfig = getRoleConfig();

  const recentActivity = [
    {
      id: 1,
      type: "course",
      title: "Advanced React Patterns",
      time: "2 hours ago",
      progress: 85,
    },

    {
      id: 2,
      type: "achievement",
      title: "Earned 'Quick Learner' badge",
      time: "1 day ago",
      progress: 100,
    },

    {
      id: 3,
      type: "attendance",
      title: "Marked attendance",
      time: "5 days ago",
      progress: 100,
    },
  ];

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: User,
    },

    {
      id: "activity",
      label: "Activity",
      icon: Activity,
    },

    {
      id: "settings",
      label: "Settings",
      icon: Edit3,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />

        <div className="text-center text-white pt-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-400">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />

        <div className="text-center text-white pt-20">
          <div className="w-16 h-16 bg-gradient-to-r from-accent to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold mb-2">
            Please Log In
          </h2>

          <p className="text-gray-400">
            You need to be logged in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 text-white">
      <Navbar />

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        <div className="bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/10 p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Image */}
            <div className="relative group">
              {getUserPhoto() && !imageError ? (
                <Image
                  src={getUserPhoto()}
                  alt="Profile"
                  width={120}
                  height={120}
                  onError={() =>
                    setImageError(true)
                  }
                  className="w-28 h-28 rounded-full object-cover border-4 border-white/20"
                />
              ) : (
                <div
                  className={`w-28 h-28 rounded-full bg-gradient-to-br ${roleConfig.color} flex items-center justify-center border-4 border-white/20`}
                >
                  <span className="text-3xl font-bold">
                    {getUserInitials(
                      getUserDisplayName()
                    )}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleImageUpload}
                className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 rounded-full p-2"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  {isEditing ? (
                    <input
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="bg-transparent border-b border-white/20 text-3xl font-bold outline-none"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold flex items-center">
                      {getUserDisplayName()}

                      <Sparkles className="ml-3 w-6 h-6 text-yellow-400" />
                    </h1>
                  )}

                  <div className="flex items-center mt-2 text-white/70">
                    <roleConfig.icon className="w-4 h-4 mr-2 text-green-400" />

                    <span>{roleConfig.label}</span>
                  </div>
                </div>

                <div>
                  {isEditing ? (
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2" />

                        {isSaving
                          ? "Saving..."
                          : "Save"}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() =>
                          setIsEditing(false)
                        }
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() =>
                        setIsEditing(true)
                      }
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mt-6">
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-white/5 border border-white/20 rounded-xl p-4 outline-none"
                  />
                ) : (
                  <p className="text-white/70">
                    {formData.bio}
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                {[
                  {
                    icon: Mail,
                    label: "Email",
                    value:
                      user.email ||
                      "Not provided",
                  },

                  {
                    icon: Phone,
                    label: "Phone",
                    value:
                      formData.phone ||
                      "Not provided",
                  },

                  {
                    icon: MapPin,
                    label: "Location",
                    value:
                      formData.location ||
                      "Not provided",
                  },

                  {
                    icon: Calendar,
                    label: "Member Since",
                    value: getMemberSince(),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-4"
                  >
                    <item.icon className="w-5 h-5 text-blue-400" />

                    <div>
                      <p className="text-xs text-white/50 uppercase">
                        {item.label}
                      </p>

                      <p className="text-sm">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[
            {
              id: "courses",
              label: "Courses",
              icon: BookOpen,
            },

            {
              id: "attendance",
              label: "Attendance",
              icon: UserCheck,
            },

            {
              id: "hours",
              label: "Study Hours",
              icon: Clock,
            },

            {
              id: "awards",
              label: "Awards",
              icon: Award,
            },
          ].map((stat) => (
            <div
              key={stat.id}
              className="bg-black/20 border border-white/10 rounded-2xl p-6"
            >
              <stat.icon className="w-8 h-8 text-blue-400 mb-4" />

              <h3 className="text-3xl font-bold">
                {stats?.[stat.id] || "0"}
              </h3>

              <p className="text-white/60 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-black/20 border border-white/10 rounded-3xl mt-8 overflow-hidden">
          <div className="border-b border-white/10">
            <div className="flex overflow-x-auto px-6 py-4 gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab.id)
                  }
                  className={`flex items-center gap-2 pb-2 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? "border-blue-400 text-blue-400"
                      : "border-transparent text-white/60"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />

                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {activeTab === "overview" && (
              <div>
                <h3 className="text-2xl font-bold mb-6">
                  Recent Activity
                </h3>

                <div className="space-y-4">
                  {recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-medium">
                          {item.title}
                        </h4>

                        <p className="text-sm text-white/60">
                          {item.time}
                        </p>
                      </div>

                      <div className="text-sm text-blue-400">
                        {item.progress}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto text-white/40 mb-4" />

                <h3 className="text-xl font-semibold">
                  Detailed Activity Coming Soon
                </h3>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="text-center py-12">
                <Edit3 className="w-12 h-12 mx-auto text-white/40 mb-4" />

                <h3 className="text-xl font-semibold">
                  Settings Panel Coming Soon
                </h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}