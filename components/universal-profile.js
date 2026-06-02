"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import * as faceapi from "face-api.js";

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
  Award,
  Clock,
  Activity,
  BookOpen,
  Sparkles,
  Shield,
  User2,
  GraduationCap,
  Users,
  Building,
  UserCheck,
  Bell,
  Eye,
  Smartphone,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useIsMounted } from "@/hooks/useIsMounted";
import { Navbar } from "./Navbar";
import ActivityHeatmap from "@/components/activity/ActivityHeatmap";
import { apiFetch } from "@/lib/apiClient";


export default function UniversalProfile() {
  const { user, userProfile, loading } = useAuth();

  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const isMounted = useIsMounted();

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);

  const [role, setRole] = useState(
    userProfile?.role || "student"
  );

  const [userData, setUserData] = useState(
    userProfile || null
  );

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    publicProfile: false,
  });

  const MODEL_URL = "/models";
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face-api models:", err);
      }
    };
    loadModels();
  }, []);

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
    let active = true;
    const fetchProfileData = async () => {
      if (!user?.uid) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!active) return;

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

          setSettings({
            emailNotifications: data.settings?.emailNotifications ?? true,
            pushNotifications: data.settings?.pushNotifications ?? true,
            publicProfile: data.settings?.publicProfile ?? false,
          });
        }

        const statsRef = doc(
          db,
          "userStats",
          user.uid
        );

        const statsSnap = await getDoc(statsRef);
        
        if (!active) return;

        if (statsSnap.exists()) {
          setStats(statsSnap.data());
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchProfileData();
    return () => { active = false; };
  }, [user]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleToggleSetting = async (key) => {
    if (!user) return;
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        [`settings.${key}`]: newValue,
      });
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Failed to update settings");
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
    }
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

      if (isMounted()) {
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
      }
    } catch (error) {
      toast.error(
        error.message || "Failed to save profile.",
        {
          id: loadingToast,
        }
      );
    } finally {
      if (isMounted()) setIsSaving(false);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Explicitly check for allowed image types (.jpg, .jpeg, .png, .webp)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only .jpg, .jpeg, .png, and .webp are supported.");
      e.target.value = ""; // Clear the file input registry cleanly
      return;
    }

    // 2. Reduce restriction boundary down to a strict 2MB limit
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("File too large. Maximum image size allowed is 2MB.");
      e.target.value = ""; // Clear the file input registry cleanly
      return;
    }

    // Show preview before uploading
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPendingFile(file);
    setImageError(false);
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile || !user) return;

    if (!modelsLoaded) {
      toast.error("Face models are still loading. Please wait a moment.");
      return;
    }

    const detectToast = toast.loading("Analyzing photo for face verification...");
    let faceDescriptorString = "";
    try {
      if (!faceapi.tf.getBackend()) {
        await faceapi.tf.setBackend("cpu");
      }
      const fileUrl = URL.createObjectURL(pendingFile);
      const img = await new Promise((resolve, reject) => {
        const el = document.createElement("img");
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = fileUrl;
      });
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      URL.revokeObjectURL(fileUrl);

      if (!detection) {
        toast.error("Could not detect a clear face. Please upload a clear headshot photo.", { id: detectToast });
        handleCancelPreview(); // resets fileInputRef.current.value internally
        return;
      }

      faceDescriptorString = JSON.stringify(Array.from(detection.descriptor));
      toast.success("Face successfully verified!", { id: detectToast });
    } catch (err) {
      console.error("Face detection error during profile update:", err);
      toast.error("Error analyzing image file. Please ensure it is a valid face image.", { id: detectToast });
      handleCancelPreview(); // resets fileInputRef.current.value internally
      return;
    }

    const loadingToast = toast.loading("Uploading profile picture...");
    try {
      const token = await user.getIdToken();
      const uploadFormData = new FormData();
      uploadFormData.append("file", pendingFile);
      if (faceDescriptorString) {
        uploadFormData.append("faceDescriptor", faceDescriptorString);
      }

      const res = await apiFetch("/api/images", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await res.json();
      if (data.success && data.url) {
        await updateProfile(user, { photoURL: data.url });
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { photoURL: data.url });
        if (isMounted()) {
          setAvatarUrl(data.url);
          toast.success("Profile picture updated successfully!", { id: loadingToast });
        }
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update profile picture.", { id: loadingToast });
    } finally {
      if (isMounted()) handleCancelPreview();
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    const loadingToast = toast.loading("Removing profile picture...");
    try {
      await updateProfile(user, { photoURL: null });
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { photoURL: null });
      if (isMounted()) {
        setAvatarUrl(null);
        setImageError(false);
        toast.success("Profile picture removed.", { id: loadingToast });
      }
    } catch (error) {
      toast.error(error.message || "Failed to remove profile picture.", { id: loadingToast });
    }
  };

  const getUserPhoto = () => {
    return previewUrl || avatarUrl || user?.photoURL || null;
  };

  const getUserInitials = useCallback((name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getUserDisplayName = useCallback(() => {
    if (formData.displayName) {
      return formData.displayName;
    }

    if (user?.email) {
      return user.email.split("@")[0];
    }

    return "User";
  }, [formData.displayName, user?.email]);

  const getMemberSince = useCallback(() => {
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
  }, [userData?.createdAt]);

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
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {getUserPhoto() && !imageError ? (
                  <Image
                    src={getUserPhoto()}
                    alt={`${getUserDisplayName()} profile photo`}
                    width={120}
                    height={120}
                    onError={() => setImageError(true)}
                    className="w-28 h-28 rounded-full object-cover border-4 border-white/20"
                  />
                ) : (
                  <div
                    className={`w-28 h-28 rounded-full bg-gradient-to-br ${roleConfig.color} flex items-center justify-center border-4 border-white/20`}
                  >
                    <span className="text-3xl font-bold">
                      {getUserInitials(getUserDisplayName())}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleImageUpload}
                  className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 rounded-full p-2"
                  title="Change photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                />
              </div>

              {/* Preview confirm/cancel */}
              {previewUrl && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmUpload}
                    className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full"
                  >
                    Save Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPreview}
                    className="text-xs bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded-full"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Remove photo */}
              {!previewUrl && (avatarUrl || user?.photoURL) && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Remove photo
                </button>
              )}
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

        <div className="mt-8">
          <ActivityHeatmap />
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
              <div>
                <h3 className="text-2xl font-bold mb-6">Detailed Activity</h3>
                <div className="relative border-l border-white/10 ml-4 space-y-8 pb-4">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="relative pl-8">
                      <div className="absolute -left-3 top-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-4 border-gray-900">
                        <Activity className="w-3 h-3 text-white" />
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg">{item.title}</h4>
                          <span className="text-xs text-white/50 bg-black/30 px-2 py-1 rounded-full">{item.time}</span>
                        </div>
                        <p className="text-white/70 text-sm mb-3">
                          {item.type === "course" && "Completed a module with excellent accuracy."}
                          {item.type === "achievement" && "Unlocked a new milestone in your learning journey."}
                          {item.type === "attendance" && "Successfully marked presence using GPS validation."}
                        </p>
                        <div className="w-full bg-black/40 rounded-full h-1.5">
                          <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${item.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <h3 className="text-2xl font-bold mb-6">Account Settings</h3>
                <div className="space-y-6">
                  
                  {/* Email Notifications */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-500/20 p-3 rounded-lg">
                        <Bell className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Email Notifications</h4>
                        <p className="text-sm text-white/60">Receive daily summaries and alerts via email.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleSetting("emailNotifications")}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.emailNotifications ? "bg-blue-500" : "bg-gray-600"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.emailNotifications ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                  </div>

                  {/* Push Notifications */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-500/20 p-3 rounded-lg">
                        <Smartphone className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Push Notifications</h4>
                        <p className="text-sm text-white/60">Receive real-time alerts on your devices.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleSetting("pushNotifications")}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.pushNotifications ? "bg-purple-500" : "bg-gray-600"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.pushNotifications ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                  </div>

                  {/* Public Profile */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-500/20 p-3 rounded-lg">
                        <Eye className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Public Profile</h4>
                        <p className="text-sm text-white/60">Allow others to view your profile and achievements.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleSetting("publicProfile")}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.publicProfile ? "bg-green-500" : "bg-gray-600"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.publicProfile ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
