"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  BookOpen,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  Moon,
  Sun,
  Monitor,
  Mail,
  Key,
  Database,
  FileText,
  HelpCircle,
  LogOut,
  Save,
  X,
  AlertTriangle,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "./Navbar";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";

const SettingCard = ({ children, title, description }) => (
  <div className="bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 hover:bg-black/30 transition-all duration-300">
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && (
        <p className="text-white/60 text-sm mt-1">{description}</p>
      )}
    </div>
    {children}
  </div>
);

const ToggleSwitch = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex-1">
      <p className="text-white font-medium">{label}</p>
      {description && <p className="text-white/60 text-sm">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        enabled
          ? "bg-gradient-to-r from-blue-500 to-purple-600"
          : "bg-white/20"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

export default function UniversalSettings() {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pushPermission, setPushPermission] = useState("default");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("Notification" in window)) {
        setPushPermission("unsupported");
      } else {
        setPushPermission(Notification.permission);
      }
    }
  }, []);

  const handleTogglePush = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (pushPermission === "granted") {
      updateSetting("notifications", "pushNotifications", false);
      toast.success("Push notifications muted in setting profile!");
      setPushPermission("default");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        updateSetting("notifications", "pushNotifications", true);
        toast.success("Timetable push notifications activated! Reminders will trigger 10m before class.");
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.register("/sw.js")
            .then((reg) => console.log("Service Worker registered:", reg.scope))
            .catch((err) => console.error("SW Registration failed:", err));
        }
      } else if (permission === "denied") {
        toast.error("Notifications blocked! Allow permission in site settings.");
      }
    } catch (err) {
      console.error("Error setting notification permission:", err);
    }
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

  const getUserPhoto = useCallback(() => {
    return user?.photoURL || user?.avatar || null;
  }, [user]);

  const getUserDisplayName = useCallback(() => {
    if (user?.displayName) return user.displayName;
    if (user?.name) return user.name;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  }, [user]);

  const getUserEmail = useCallback(() => {
    return user?.email || "";
  }, [user]);

  const getRoleSpecificSettings = () => {
    const role = user?.role || "student";

    const roleSettings = {
      student: {
        learning: {
          dailyGoal: 2,
          weeklyGoal: 10,
          preferredLanguage: "en",
          difficulty: "intermediate",
          autoplay: true,
          subtitles: true,
          studyReminders: true,
          assignmentAlerts: true,
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          courseReminders: true,
          achievementAlerts: true,
          weeklyReports: false,
          marketingEmails: false,
          attendanceAlerts: true,
          gradeUpdates: true,
        },
      },
      teacher: {
        learning: {
          dailyGoal: 4,
          weeklyGoal: 20,
          preferredLanguage: "en",
          difficulty: "advanced",
          autoplay: false,
          subtitles: true,
          classReminders: true,
          gradingAlerts: true,
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          courseReminders: true,
          achievementAlerts: false,
          weeklyReports: true,
          marketingEmails: false,
          studentSubmissions: true,
          parentMessages: true,
        },
      },
      admin: {
        learning: {
          dailyGoal: 1,
          weeklyGoal: 5,
          preferredLanguage: "en",
          difficulty: "expert",
          autoplay: false,
          subtitles: false,
          systemAlerts: true,
          maintenanceReminders: true,
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          courseReminders: false,
          achievementAlerts: false,
          weeklyReports: true,
          marketingEmails: false,
          systemAlerts: true,
          securityAlerts: true,
        },
      },
      institute: {
        learning: {
          dailyGoal: 2,
          weeklyGoal: 10,
          preferredLanguage: "en",
          difficulty: "advanced",
          autoplay: false,
          subtitles: true,
          reportReminders: true,
          performanceAlerts: true,
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          courseReminders: false,
          achievementAlerts: false,
          weeklyReports: true,
          marketingEmails: true,
          enrollmentAlerts: true,
          performanceReports: true,
        },
      },
      parent: {
        learning: {
          dailyGoal: 1,
          weeklyGoal: 5,
          preferredLanguage: "en",
          difficulty: "beginner",
          autoplay: true,
          subtitles: true,
          childProgressAlerts: true,
          meetingReminders: true,
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          courseReminders: false,
          achievementAlerts: true,
          weeklyReports: true,
          marketingEmails: false,
          childProgress: true,
          schoolUpdates: true,
        },
      },
    };

    return roleSettings[role] || roleSettings.student;
  };

  const roleSpecificSettings = getRoleSpecificSettings();

  const [settings, setSettings] = useState({
    profile: {
      name: getUserDisplayName(),
      email: getUserEmail(),
      phone: user?.phone || "",
      bio:
        user?.bio ||
        "Passionate learner exploring new technologies and skills.",
      avatar: getUserPhoto() || "/user-avatar.jpg",
    },
    notifications: roleSpecificSettings.notifications,
    privacy: {
      profileVisibility: "public",
      showProgress: true,
      showAchievements: true,
      allowMessages: true,
      dataCollection: true,
    },
    learning: roleSpecificSettings.learning,
    appearance: {
      theme: "dark",
      language: "en",
      timezone: "UTC-8",
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsInitialLoading(true);
        setError(null);
        
        if (user) {
          setSettings((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              name: getUserDisplayName(),
              email: getUserEmail(),
              phone: user.phone || prev.profile.phone,
              bio: user.bio || prev.profile.bio,
              avatar: getUserPhoto() || prev.profile.avatar,
            },
          }));
        }
      } catch (err) {
        setError("Failed to load settings. Please try again.");
        console.error("Error loading settings:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);

  const updateSetting = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, userId: user?.uid }),
      });
      if (!response.ok) throw new Error("Failed to save settings");
      setHasChanges(false);
      toast.success("Settings updated successfully!");
    } catch (error) {
      setError("Failed to save settings. Please try again.");
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      profile: {
        name: getUserDisplayName(),
        email: getUserEmail(),
        phone: user?.phone || "",
        bio:
          user?.bio ||
          "Passionate learner exploring new technologies and skills.",
        avatar: getUserPhoto() || "/user-avatar.jpg",
      },
      notifications: roleSpecificSettings.notifications,
      privacy: {
        profileVisibility: "public",
        showProgress: true,
        showAchievements: true,
        allowMessages: true,
        dataCollection: true,
      },
      learning: roleSpecificSettings.learning,
      appearance: {
        theme: "dark",
        language: "en",
        timezone: "UTC-8",
      },
    });
    setHasChanges(false);
  };

  const handleResetToDefaults = () => {
    try {
      // 1. Clear settings-related keys in localStorage safely
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("theme");
        window.localStorage.removeItem("settings");
        window.localStorage.removeItem("learnova_settings");
      }

      // 2. Revert theme in next-themes provider to default 'dark'
      setTheme("dark");

      // 3. Reset settings state to initial default values
      setSettings({
        profile: {
          name: getUserDisplayName(),
          email: getUserEmail(),
          phone: user?.phone || "",
          bio:
            user?.bio ||
            "Passionate learner exploring new technologies and skills.",
          avatar: getUserPhoto() || "/user-avatar.jpg",
        },
        notifications: roleSpecificSettings.notifications,
        privacy: {
          profileVisibility: "public",
          showProgress: true,
          showAchievements: true,
          allowMessages: true,
          dataCollection: true,
        },
        learning: roleSpecificSettings.learning,
        appearance: {
          theme: "dark",
          language: "en",
          timezone: "UTC-8",
        },
      });

      // 4. Mark change indicators as false
      setHasChanges(false);

      // 5. Show beautiful success notification
      toast.success("Settings restored to system defaults!", {
        icon: "🔄",
        style: {
          borderRadius: "16px",
          background: "#1e293b",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      });
    } catch (err) {
      console.error("Failed to reset settings to defaults:", err);
      toast.error("Failed to reset settings. Please try again.");
    }
  };

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "learning", label: "Preferences", icon: BookOpen },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "data", label: "Data & Storage", icon: Database },
    { id: "help", label: "Help & Support", icon: HelpCircle },
  ];

  if (isInitialLoading) {
    return (
      <div className="min-h-screen relative rounded-2xl bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative rounded-2xl bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Settings</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative rounded-2xl bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(34,197,94,0.08),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Settings className="h-8 w-8 mr-3 text-blue-400" />
              {t("settings")}
              <Sparkles className="ml-3 h-6 w-6 text-yellow-400 animate-pulse" />
            </h1>
            <p className="text-white/60">
              Customize your experience and account preferences
            </p>
          </div>

          {hasChanges && (
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <Button
                onClick={resetSettings}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={saveSettings}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 sticky top-24">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeSection === section.id
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <section.icon className="h-5 w-5" />
                    <span>{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeSection === "profile" && (
              <>
                <SettingCard
                  title="Personal Information"
                  description="Update your profile details and contact information"
                >
                  <div className="space-y-4">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        {getUserPhoto() ? (
                          <Image
                            src={getUserPhoto() || "/placeholder.svg"}
                            alt={`${getUserDisplayName()} profile photo`}
                            width={200}
                            height={200}
                            className="w-20 h-20 rounded-full border-2 border-white/20 object-cover"
                            onError={(e) => {
                              const target = e.target;
                              target.style.display = "none";
                              const fallback = target.nextElementSibling;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-20 h-20 rounded-full border-2 border-white/20 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl ${
                            getUserPhoto() ? "hidden" : "flex"
                          }`}
                        >
                          {getUserInitials(getUserDisplayName())}
                        </div>
                        <button className="absolute -bottom-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors">
                          <User className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                        >
                          Change Avatar
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={settings.profile.name}
                          onChange={(e) =>
                            updateSetting("profile", "name", e.target.value)
                          }
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={settings.profile.email}
                          onChange={(e) =>
                            updateSetting("profile", "email", e.target.value)
                          }
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={settings.profile.phone}
                          onChange={(e) =>
                            updateSetting("profile", "phone", e.target.value)
                          }
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Bio
                      </label>
                      <textarea
                        value={settings.profile.bio}
                        onChange={(e) =>
                          updateSetting("profile", "bio", e.target.value)
                        }
                        rows={3}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </SettingCard>

                <SettingCard
                  title="Account Security"
                  description="Manage your password and security settings"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-12 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                </SettingCard>
              </>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-6">
                {/* Timetable Class Reminder Card */}
                <SettingCard
                  title="Timetable & Class Reminders"
                  description="Get dynamic push notifications 10 minutes before your next class starts."
                >
                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          pushPermission === "granted" ? "bg-green-400 animate-pulse" :
                          pushPermission === "denied" ? "bg-red-500" : "bg-yellow-400 animate-bounce"
                        }`} />
                        <span className="text-sm font-semibold text-white">
                          Status: {
                            pushPermission === "granted" ? "Notifications Enabled" :
                            pushPermission === "denied" ? "Notifications Blocked" :
                            pushPermission === "unsupported" ? "Browser Unsupported" : "Permission Required"
                          }
                        </span>
                      </div>
                      <p className="text-white/60 text-xs mt-1">
                        {pushPermission === "granted" 
                          ? "You are all set! Learnova will proactively notify you 10 minutes before classes."
                          : pushPermission === "denied"
                          ? "Please reset browser permissions in your URL bar to enable notifications."
                          : pushPermission === "unsupported"
                          ? "Push notifications are not supported in this browser."
                          : "Enable browser push notifications to receive proactive class alerts."
                        }
                      </p>
                    </div>
                    
                    {pushPermission !== "unsupported" && (
                      <button
                        onClick={handleTogglePush}
                        disabled={pushPermission === "denied"}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ${
                          pushPermission === "granted"
                            ? "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 cursor-pointer"
                            : "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-purple-500/20 hover:scale-105 active:scale-95 cursor-pointer"
                        }`}
                      >
                        {pushPermission === "granted" ? "Mute Reminders" : "Enable Reminders"}
                      </button>
                    )}
                  </div>
                </SettingCard>

                <SettingCard
                  title="Notification Preferences"
                  description="Choose how you want to be notified"
                >
                  <div className="space-y-2">
                    {Object.entries(settings.notifications).map(
                      ([key, value]) => (
                        <ToggleSwitch
                          key={key}
                          enabled={value}
                          onChange={(newValue) =>
                            updateSetting("notifications", key, newValue)
                          }
                          label={key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                          description={`Receive ${key
                            .replace(/([A-Z])/g, " $1")
                            .toLowerCase()}`}
                        />
                      ),
                    )}
                  </div>
                </SettingCard>
              </div>
            )}

            {/* ... existing code for other sections ... */}

            {activeSection === "privacy" && (
              <SettingCard
                title="Privacy Settings"
                description="Control your privacy and data sharing preferences"
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-3">
                      Profile Visibility
                    </label>
                    <div className="space-y-2">
                      {[
                        {
                          value: "public",
                          label: "Public",
                          desc: "Anyone can view your profile",
                        },
                        {
                          value: "friends",
                          label: "Friends Only",
                          desc: "Only your connections can see your profile",
                        },
                        {
                          value: "private",
                          label: "Private",
                          desc: "Only you can see your profile",
                        },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center space-x-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="profileVisibility"
                            value={option.value}
                            checked={
                              settings.privacy.profileVisibility ===
                              option.value
                            }
                            onChange={(e) =>
                              updateSetting(
                                "privacy",
                                "profileVisibility",
                                e.target.value,
                              )
                            }
                            className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 focus:ring-blue-500"
                          />
                          <div>
                            <p className="text-white font-medium">
                              {option.label}
                            </p>
                            <p className="text-white/60 text-sm">
                              {option.desc}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <ToggleSwitch
                      enabled={settings.privacy.showProgress}
                      onChange={(value) =>
                        updateSetting("privacy", "showProgress", value)
                      }
                      label="Show Learning Progress"
                      description="Allow others to see your learning statistics"
                    />
                    <ToggleSwitch
                      enabled={settings.privacy.showAchievements}
                      onChange={(value) =>
                        updateSetting("privacy", "showAchievements", value)
                      }
                      label="Show Achievements"
                      description="Display your badges and achievements publicly"
                    />
                    <ToggleSwitch
                      enabled={settings.privacy.allowMessages}
                      onChange={(value) =>
                        updateSetting("privacy", "allowMessages", value)
                      }
                      label="Allow Messages"
                      description="Let other users send you messages"
                    />
                    <ToggleSwitch
                      enabled={settings.privacy.dataCollection}
                      onChange={(value) =>
                        updateSetting("privacy", "dataCollection", value)
                      }
                      label="Analytics & Improvement"
                      description="Help us improve by sharing anonymous usage data"
                    />
                  </div>
                </div>
              </SettingCard>
            )}

            {activeSection === "learning" && (
              <>
                <SettingCard
                  title="Learning Goals"
                  description="Set your daily and weekly learning targets"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Daily Goal (hours)
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        max="12"
                        step="0.5"
                        value={settings.learning.dailyGoal}
                        onChange={(e) =>
                          updateSetting(
                            "learning",
                            "dailyGoal",
                            Number.parseFloat(e.target.value),
                          )
                        }
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Weekly Goal (hours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={settings.learning.weeklyGoal}
                        onChange={(e) =>
                          updateSetting(
                            "learning",
                            "weeklyGoal",
                            Number.parseInt(e.target.value),
                          )
                        }
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </SettingCard>

                <SettingCard
                  title="Learning Preferences"
                  description="Customize your learning experience"
                >
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Difficulty Level
                      </label>
                      <select
                        value={settings.learning.difficulty}
                        onChange={(e) =>
                          updateSetting(
                            "learning",
                            "difficulty",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      >
                        <option value="beginner" className="bg-slate-950 text-white">Beginner</option>
                        <option value="intermediate" className="bg-slate-950 text-white">Intermediate</option>
                        <option value="advanced" className="bg-slate-950 text-white">Advanced</option>
                        <option value="expert" className="bg-slate-950 text-white">Expert</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <ToggleSwitch
                        enabled={settings.learning.autoplay}
                        onChange={(value) =>
                          updateSetting("learning", "autoplay", value)
                        }
                        label="Autoplay Videos"
                        description="Automatically play the next video in a course"
                      />
                      <ToggleSwitch
                        enabled={settings.learning.subtitles}
                        onChange={(value) =>
                          updateSetting("learning", "subtitles", value)
                        }
                        label="Show Subtitles"
                        description="Display subtitles by default in video content"
                      />
                    </div>
                  </div>
                </SettingCard>
              </>
            )}

            {activeSection === "appearance" && (
              <SettingCard
                title="Appearance & Language"
                description="Customize the look and feel of your environment"
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: "light", label: "Light", icon: Sun, color: "text-amber-400 group-hover:text-amber-300" },
                        { value: "dark", label: "Dark", icon: Moon, color: "text-violet-400 group-hover:text-violet-300" },
                        { value: "system", label: "System", icon: Monitor, color: "text-blue-400 group-hover:text-blue-300" },
                      ].map((themeOpt) => {
                        const isSelected = settings.appearance.theme === themeOpt.value;
                        return (
                          <motion.button
                            key={themeOpt.value}
                            onClick={() => {
                              updateSetting("appearance", "theme", themeOpt.value);
                              setTheme(themeOpt.value);
                            }}
                            className={`group flex flex-col items-center space-y-3 p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-center relative overflow-hidden ${
                              isSelected
                                ? "border-blue-500/80 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                                : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                            }`}
                            whileHover="hover"
                            whileTap="tap"
                            animate={isSelected ? "selected" : "unselected"}
                            variants={{
                              hover: { scale: 1.04, y: -2 },
                              tap: { scale: 0.96 }
                            }}
                          >
                            {/* Glow spot */}
                            {isSelected && (
                              <span className="absolute -inset-px rounded-2xl bg-gradient-to-tr from-blue-500/10 to-purple-500/10 opacity-100 pointer-events-none" />
                            )}
                            <motion.div
                              variants={{
                                hover: { scale: 1.15, rotate: themeOpt.value === "light" ? 45 : themeOpt.value === "dark" ? -15 : 0 }
                              }}
                              transition={{ type: "spring", stiffness: 200, damping: 12 }}
                              className={`p-2.5 rounded-xl ${
                                isSelected 
                                  ? "bg-blue-500/20" 
                                  : "bg-white/5 group-hover:bg-white/10"
                              } transition-colors duration-300`}
                            >
                              <themeOpt.icon className={`h-6 w-6 transition-colors duration-300 ${isSelected ? "text-white" : themeOpt.color}`} />
                            </motion.div>
                            <span className="text-sm font-semibold tracking-wide block">
                              {themeOpt.label}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Language
                      </label>
                      <select
                        value={settings.appearance.language}
                        onChange={(e) => {
                          updateSetting("appearance", "language", e.target.value);
                          i18n.changeLanguage(e.target.value);
                        }}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      >
                        <option value="en" className="bg-slate-950 text-white">English</option>
                        <option value="es" className="bg-slate-950 text-white">Español</option>
                        <option value="fr" className="bg-slate-950 text-white">Français</option>
                        <option value="de" className="bg-slate-950 text-white">Deutsch</option>
                        <option value="zh" className="bg-slate-950 text-white">中文</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.appearance.timezone}
                        onChange={(e) =>
                          updateSetting(
                            "appearance",
                            "timezone",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      >
                        <option value="UTC-8" className="bg-slate-950 text-white">Pacific Time (UTC-8)</option>
                        <option value="UTC-5" className="bg-slate-950 text-white">Eastern Time (UTC-5)</option>
                        <option value="UTC+0" className="bg-slate-950 text-white">
                          Greenwich Mean Time (UTC+0)
                        </option>
                        <option value="UTC+1" className="bg-slate-950 text-white">
                          Central European Time (UTC+1)
                        </option>
                        <option value="UTC+8" className="bg-slate-950 text-white">
                          China Standard Time (UTC+8)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </SettingCard>
            )}

            {activeSection === "data" && (
              <>
                <SettingCard
                  title="Data Management"
                  description="Manage your learning data and storage"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <p className="text-white font-medium">
                          Export Learning Data
                        </p>
                        <p className="text-white/60 text-sm">
                          Download all your progress, courses, and achievements
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <p className="text-white font-medium">Clear Cache</p>
                        <p className="text-white/60 text-sm">
                          Clear stored data to free up space (2.3 GB)
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </SettingCard>

                <SettingCard
                  title="Preference Reset"
                  description="Restore all settings, appearance parameters, and notification choices to system defaults"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <p className="text-white font-medium">Reset Settings</p>
                        <p className="text-white/60 text-sm">
                          Revert all configurations back to system default values
                        </p>
                      </div>
                      <Button
                        onClick={handleResetToDefaults}
                        variant="outline"
                        className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 bg-transparent"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset to Defaults
                      </Button>
                    </div>
                  </div>
                </SettingCard>

                <SettingCard
                  title="Account Actions"
                  description="Manage your account and data"
                >
                  <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-red-400 font-medium">
                            Danger Zone
                          </p>
                          <p className="text-white/60 text-sm mt-1">
                            These actions cannot be undone. Please proceed with
                            caution.
                          </p>
                          <div className="flex space-x-3 mt-4">
                            <Button
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete All Data
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SettingCard>
              </>
            )}

            {activeSection === "help" && (
              <SettingCard
                title="Help & Support"
                description="Get help and contact our support team"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200 text-left">
                      <FileText className="h-6 w-6 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">Documentation</p>
                        <p className="text-white/60 text-sm">
                          Browse our comprehensive guides
                        </p>
                      </div>
                    </button>

                    <button className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200 text-left">
                      <Mail className="h-6 w-6 text-green-400" />
                      <div>
                        <p className="text-white font-medium">
                          Contact Support
                        </p>
                        <p className="text-white/60 text-sm">
                          Get help from our support team
                        </p>
                      </div>
                    </button>

                    <button className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200 text-left">
                      <HelpCircle className="h-6 w-6 text-purple-400" />
                      <div>
                        <p className="text-white font-medium">FAQ</p>
                        <p className="text-white/60 text-sm">
                          Find answers to common questions
                        </p>
                      </div>
                    </button>

                    <button className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200 text-left">
                      <Globe className="h-6 w-6 text-orange-400" />
                      <div>
                        <p className="text-white font-medium">Community</p>
                        <p className="text-white/60 text-sm">
                          Join our learning community
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Sparkles className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-blue-400 font-medium">
                          Learnova v2.1.0
                        </p>
                        <p className="text-white/60 text-sm mt-1">
                          You're using the latest version of Learnova. Check
                          back regularly for updates and new features.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SettingCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
