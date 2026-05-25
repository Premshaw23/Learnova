"use client";
import { useState, useEffect, useMemo, useOptimistic } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import DarkVeil from "@/components/ui-block/DarkVeil";
import {
  BookOpen,
  Brain,
  Trophy,
  Clock,
  Users,
  Star,
  Play,
  BarChart3,
  Flame,
  LineChart,
  Timer,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles,
  Target,
  Zap,
  Award,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  Gamepad2,
  Puzzle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { logActivity, getUserActivities } from "@/services/activityService";
import { updateUserStat } from "@/services/statsService";

// Reusable animation component
const Reveal = ({ children, className = "", delay = 0, y = 28 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export default function ActivityPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? theme === "dark" : true;
  const { user } = useAuth();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activities, setActivities] = useState([]);
  const [analysisRange, setAnalysisRange] = useState("7d");
  const [analysisType, setAnalysisType] = useState("all");
  
  // React 19 Optimistic Hook
  const [optimisticActivities, addOptimisticActivity] = useOptimistic(
    activities,
    (state, newActivity) => {
      // Filter out if duplicate
      if (state.some(a => a.title === newActivity.title)) return state;
      return [newActivity, ...state];
    }
  );

  useEffect(() => {
    if (user?.uid) {
      getUserActivities(user.uid).then(setActivities);
    }
  }, [user]);

  const [stats, setStats] = useState({
    games: 0,
    students: 0,
    rating: 0,
  });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (mouseMoveRaf.current) cancelAnimationFrame(mouseMoveRaf.current);
      mouseMoveRaf.current = requestAnimationFrame(() => {
        const orb = orbRef.current;
        if (orb) {
          orb.style.transform = `translate3d(${e.clientX - 192}px, ${e.clientY - 192}px, 0)`;
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (mouseMoveRaf.current) cancelAnimationFrame(mouseMoveRaf.current);
    };
  }, []);

  useEffect(() => {
    const duration = 2000;
    const frameRate = 30;
    const totalFrames = duration / frameRate;

    let frame = 0;

    const counter = setInterval(() => {
      frame++;

      const progress = frame / totalFrames;

      setStats({
        games: Math.floor(250 * progress),
        students: Math.floor(50000 * progress),
        rating: (4.7 * progress).toFixed(1),
      });

      if (frame >= totalFrames) {
        clearInterval(counter);

        setStats({
          games: 250,
          students: 50000,
          rating: "4.7",
        });
      }
    }, frameRate);

    return () => clearInterval(counter);
  }, []);

  const categories = [
    { id: "all", label: "All Activities", icon: Sparkles },
    { id: "math", label: "Mathematics", icon: Target },
    { id: "science", label: "Science", icon: Brain },
    { id: "language", label: "Language Arts", icon: BookOpen },
    { id: "history", label: "History", icon: Award },
    { id: "coding", label: "Programming", icon: Zap },
  ];

  const levels = [
    { id: "all", label: "All Levels" },
    { id: "elementary", label: "Elementary" },
    { id: "middle", label: "Middle School" },
    { id: "high", label: "High School" },
    { id: "college", label: "College" },
  ];

  const analysisRanges = [
    { id: "7d", label: "7 days" },
    { id: "30d", label: "30 days" },
    { id: "90d", label: "90 days" },
  ];

  const analysisTypes = [
    { id: "all", label: "All types" },
    { id: "quiz", label: "Quizzes" },
    { id: "game", label: "Games" },
    { id: "course", label: "Courses" },
  ];

  const featuredActivities = [
    {
      id: 1,
      title: "Quantum Physics Quiz",
      description:
        "Test your understanding of quantum mechanics and particle physics",
      category: "science",
      level: "college",
      duration: "15 min",
      participants: 2847,
      difficulty: "Advanced",
      rating: 4.8,
      icon: Brain,
      gradient: "from-purple-500 to-violet-600",
      type: "quiz",
    },
    {
      id: 2,
      title: "Algebra Challenge",
      description:
        "Master algebraic equations through interactive problem solving",
      category: "math",
      level: "high",
      duration: "20 min",
      participants: 5234,
      difficulty: "Intermediate",
      rating: 4.6,
      icon: Target,
      gradient: "from-blue-500 to-cyan-600",
      type: "game",
    },
    {
      id: 3,
      title: "World History Timeline",
      description: "Navigate through major historical events and civilizations",
      category: "history",
      level: "middle",
      duration: "25 min",
      participants: 3692,
      difficulty: "Beginner",
      rating: 4.7,
      icon: Award,
      gradient: "from-amber-500 to-orange-600",
      type: "game",
    },
  ];

  const allActivities = [
    {
      id: 4,
      title: "Python Fundamentals",
      description:
        "Learn basic programming concepts through interactive coding challenges",
      category: "coding",
      level: "high",
      duration: "30 min",
      participants: 1892,
      difficulty: "Beginner",
      rating: 4.9,
      icon: Zap,
      gradient: "from-emerald-500 to-teal-600",
      type: "quiz",
    },
    {
      id: 5,
      title: "Shakespeare Explorer",
      description:
        "Dive into the works of William Shakespeare with interactive analysis",
      category: "language",
      level: "high",
      duration: "18 min",
      participants: 2156,
      difficulty: "Intermediate",
      rating: 4.5,
      icon: BookOpen,
      gradient: "from-rose-500 to-pink-600",
      type: "game",
    },
    {
      id: 6,
      title: "Chemistry Lab Simulator",
      description:
        "Conduct virtual chemistry experiments safely and effectively",
      category: "science",
      level: "college",
      duration: "35 min",
      participants: 1743,
      difficulty: "Advanced",
      rating: 4.8,
      icon: Brain,
      gradient: "from-indigo-500 to-purple-600",
      type: "game",
    },
    {
      id: 7,
      title: "Geometry Puzzle Master",
      description:
        "Solve complex geometric puzzles and spatial reasoning challenges",
      category: "math",
      level: "middle",
      duration: "12 min",
      participants: 4567,
      difficulty: "Intermediate",
      rating: 4.4,
      icon: Target,
      gradient: "from-cyan-500 to-blue-600",
      type: "quiz",
    },
    {
      id: 8,
      title: "Ancient Civilizations",
      description:
        "Explore the rise and fall of ancient empires through interactive storytelling",
      category: "history",
      level: "elementary",
      duration: "22 min",
      participants: 3821,
      difficulty: "Beginner",
      rating: 4.6,
      icon: Award,
      gradient: "from-yellow-500 to-amber-600",
      type: "game",
    },
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredActivities = allActivities.filter((activity) => {
    const categoryMatch =
      selectedCategory === "all" || activity.category === selectedCategory;
    const levelMatch =
      selectedLevel === "all" || activity.level === selectedLevel;
    const searchMatch =
      !normalizedQuery ||
      activity.title.toLowerCase().includes(normalizedQuery) ||
      activity.description.toLowerCase().includes(normalizedQuery);
    return categoryMatch && levelMatch && searchMatch;
  });

  const analysisRangeDays = useMemo(() => {
    switch (analysisRange) {
      case "30d":
        return 30;
      case "90d":
        return 90;
      default:
        return 7;
    }
  }, [analysisRange]);

  const analysisActivities = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (analysisRangeDays - 1));

    return optimisticActivities.filter((activity) => {
      const activityDate = activity?.timestamp ? new Date(activity.timestamp) : null;
      if (!activityDate) return false;
      const inRange = activityDate >= start && activityDate <= now;
      const matchesType =
        analysisType === "all" ||
        (activity?.type || "course").toLowerCase() === analysisType;
      return inRange && matchesType;
    });
  }, [analysisRangeDays, analysisType, optimisticActivities]);

  const analysisData = useMemo(() => {
    const now = new Date();
    const dayKey = (date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
      ).padStart(2, "0")}`;

    const activityDates = analysisActivities
      .map((activity) => (activity?.timestamp ? new Date(activity.timestamp) : null))
      .filter(Boolean);

    const activityDays = new Set(activityDates.map(dayKey));

    const days = Array.from({ length: analysisRangeDays }, (_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (analysisRangeDays - 1 - index));
      const key = dayKey(day);
      const count = activityDates.filter((date) => dayKey(date) === key).length;

      return {
        key,
        count,
        label: day.toLocaleDateString("en-US", { weekday: "short" }),
        short: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    });

    const maxDayCount = Math.max(
      1,
      ...days.map((day) => day.count),
    );

    const rangeTotal = days.reduce((sum, day) => sum + day.count, 0);

    const previousRange = Array.from({ length: analysisRangeDays }, (_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - analysisRangeDays - index);
      return dayKey(day);
    });

    const previousTotal = optimisticActivities.filter((activity) => {
      const activityDate = activity?.timestamp ? new Date(activity.timestamp) : null;
      if (!activityDate) return false;
      const matchesType =
        analysisType === "all" ||
        (activity?.type || "course").toLowerCase() === analysisType;
      return matchesType && previousRange.includes(dayKey(activityDate));
    }).length;

    const change = rangeTotal - previousTotal;
    const changePercent =
      previousTotal > 0 ? Math.round((change / previousTotal) * 100) : rangeTotal > 0 ? 100 : 0;

    const last14Days = Array.from({ length: 14 }, (_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - index);
      return dayKey(day);
    });

    const activeDays = last14Days.filter((key) => activityDays.has(key)).length;
    const consistency = Math.round((activeDays / last14Days.length) * 100);

    const currentStreak = (() => {
      let streak = 0;
      for (let i = 0; i < 30; i += 1) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        if (activityDays.has(dayKey(day))) {
          streak += 1;
        } else {
          break;
        }
      }
      return streak;
    })();

    const longestStreak = (() => {
      const sortedDays = Array.from(activityDays)
        .map((key) => {
          const [year, month, day] = key.split("-").map(Number);
          return new Date(year, month - 1, day);
        })
        .sort((a, b) => a - b);

      let longest = 0;
      let current = 0;

      for (let i = 0; i < sortedDays.length; i += 1) {
        if (i === 0) {
          current = 1;
          longest = 1;
          continue;
        }

        const diff = Math.round(
          (sortedDays[i] - sortedDays[i - 1]) / (1000 * 60 * 60 * 24),
        );

        if (diff === 1) {
          current += 1;
        } else {
          current = 1;
        }

        if (current > longest) {
          longest = current;
        }
      }

      return longest;
    })();

    const typeCounts = analysisActivities.reduce((acc, activity) => {
      const key = (activity?.type || "course").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const totalMinutes = analysisActivities.reduce((sum, activity) => {
      return sum + (activity?.durationMinutes || 0);
    }, 0);

    const averageMinutes =
      analysisActivities.length > 0
        ? Math.round(totalMinutes / analysisActivities.length)
        : 0;

    const completedCount = analysisActivities.filter(
      (activity) => activity?.completed || (activity?.progress || 0) >= 100,
    ).length;

    const completionRate =
      analysisActivities.length > 0
        ? Math.round((completedCount / analysisActivities.length) * 100)
        : 0;

    const scores = analysisActivities
      .map((activity) => activity?.score)
      .filter((score) => typeof score === "number");

    const averageScore =
      scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;

    const averagePerDay =
      analysisRangeDays > 0 ? Number((rangeTotal / analysisRangeDays).toFixed(1)) : 0;

    const bestDay = days.reduce(
      (best, day) => (day.count > best.count ? day : best),
      days[0] || { count: 0, short: "-" },
    );

    const sparkline = (() => {
      const width = 240;
      const height = 80;
      const padding = 6;
      const counts = days.map((day) => day.count);
      const maxValue = Math.max(1, ...counts);
      const points = counts.map((value, index) => {
        const x = padding + (index / Math.max(1, counts.length - 1)) * (width - padding * 2);
        const y = height - padding - (value / maxValue) * (height - padding * 2);
        return { x, y };
      });

      const linePath = points
        .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
        .join(" ");

      const areaPath = `${linePath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

      return { width, height, linePath, areaPath };
    })();

    const heatmapDays = Array.from({ length: 28 }, (_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (27 - index));
      const key = dayKey(day);
      const count = activityDates.filter((date) => dayKey(date) === key).length;
      return {
        key,
        count,
        label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    });

    const heatMax = Math.max(1, ...heatmapDays.map((day) => day.count));

    const goalPerWeek = 10;
    const goalTarget = Math.max(5, Math.round((analysisRangeDays / 7) * goalPerWeek));
    const goalProgress = Math.min(100, Math.round((rangeTotal / goalTarget) * 100));

    const insights = [];
    if (rangeTotal === 0) {
      insights.push("No activity logged yet. Start a quick quiz to build momentum.");
    } else if (consistency < 40) {
      insights.push("Try a 10-minute habit: one activity per day to boost consistency.");
    } else if (consistency >= 70) {
      insights.push("Great streak! Keep your pace to lock in your weekly goal.");
    }

    if (completionRate < 50 && analysisActivities.length > 0) {
      insights.push("Finish a few in-progress activities to raise completion rate.");
    }

    if (totalMinutes >= 120) {
      insights.push("Strong focus time! Consider mixing in a challenge quiz.");
    }

    return {
      days,
      maxDayCount,
      rangeTotal,
      change,
      changePercent,
      activeDays,
      consistency,
      currentStreak,
      longestStreak,
      typeCounts,
      total: analysisActivities.length,
      totalMinutes,
      averageMinutes,
      completionRate,
      averageScore,
      averagePerDay,
      bestDay,
      sparkline,
      heatmapDays,
      heatMax,
      goalTarget,
      goalProgress,
      insights,
    };
  }, [analysisActivities, analysisRangeDays, analysisType, optimisticActivities]);

  const parseDurationMinutes = (duration) => {
    if (!duration) return 0;
    const match = String(duration).match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  const formatMinutes = (minutes) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return hours > 0 ? `${hours}h ${remaining}m` : `${remaining}m`;
  };

  const typeTotal = Object.values(analysisData.typeCounts).reduce(
    (sum, value) => sum + value,
    0,
  );

  const isSignedIn = Boolean(user);
  const hasActivityData = optimisticActivities.length > 0;

  const handleEnrollActivity = async (activity) => {
    if (!user) {
      toast.error("Please login to enroll.");
      return;
    }

    if (activities.some(a => a.title === activity.title)) {
      toast("You are already enrolled in this activity", { icon: "ℹ️" });
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const newActivity = {
      id: tempId,
      title: activity.title,
      type: activity.type || "course",
      progress: 0,
      durationMinutes: parseDurationMinutes(activity.duration),
      score: null,
      completed: false,
      completedAt: null,
      timestamp: new Date(),
      saving: true // Optimistic flag
    };

    // 1. Instant Optimistic Insertion
    addOptimisticActivity(newActivity);

    try {
      // 2. Asynchronous Persistence
      const dbId = await logActivity(user.uid, newActivity);
      await updateUserStat(user.uid, "Courses Enrolled", 1);
      
      // 3. Seamless Reconciliation
      setActivities(prev => [{ ...newActivity, id: dbId, saving: false }, ...prev]);
      toast.success(`Enrolled in ${newActivity.title}`);
    } catch (error) {
      // 4. Automatic Rollback (Because setActivities wasn't called, the UI automatically reverts after the transition finishes)
      toast.error("Failed to enroll. Please try again.");
      console.error("Optimistic rollback:", error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "text-green-400";
      case "Intermediate":
        return "text-yellow-400";
      case "Advanced":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <>
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-background">
        {isDark && <DarkVeil />}

        {/* Mouse-following gradient orb */}
        <div
          ref={orbRef}
          className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none"
          style={{
            transform: "translate3d(-192px, -192px, 0)",
            willChange: "transform",
          }}
        />

        {/* Animated background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl top-20 left-10 animate-pulse" />
          <div
            className="absolute w-72 h-72 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl bottom-20 right-10 animate-pulse"
            style={{ animationDelay: "2s" }}
          />

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-accent/30 rounded-full animate-float"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + i * 10}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="min-h-screen relative z-50">
        <Navbar />
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal delay={0.1}>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-accent/10 to-purple-500/10 dark:from-accent/20 dark:to-purple-500/20 rounded-full border border-accent/20 dark:border-accent/30 backdrop-blur-sm mb-6">
                <Gamepad2 className="w-5 h-5 text-accent dark:text-accent-foreground mr-2" />
                <span className="text-accent dark:text-accent-foreground font-medium">
                  Interactive Learning
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                Learn Through{" "}
                <span className="bg-gradient-to-r from-accent via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Play
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.3}>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
                Discover engaging educational games and quizzes designed to make
                learning{" "}
                <span className="text-accent font-semibold">
                  fun and effective
                </span>{" "}
                for students of all levels.
              </p>
            </Reveal>

            {/* Quick Stats */}
            <Reveal delay={0.4}>
              <div className="flex flex-wrap justify-center gap-6">
                {[
                  {
                    label: "Active Games",
                    value: `${stats.games}+`,
                    icon: Gamepad2,
                  },
                  {
                    label: "Students Playing",
                    value: `${(stats.students / 1000).toFixed(0)}K+`,
                    icon: Users,
                  },
                  {
                    label: "Avg Rating",
                    value: stats.rating,
                    icon: Star,
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-card backdrop-blur-sm rounded-full px-4 py-2 border border-border"
                  >
                    <stat.icon className="w-5 h-5 text-accent" />
                    <span className="text-foreground font-semibold">
                      {stat.value}
                    </span>
                    <span className="text-muted-foreground text-sm">{stat.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* My Recent Activities (Optimistic UI feed) */}
        {user && optimisticActivities.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 mb-20">
            <div className="max-w-7xl mx-auto">
              <Reveal delay={0.1}>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
                  My Learning Journey
                </h2>
              </Reveal>
              
              <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
                <AnimatePresence mode="popLayout">
                  {optimisticActivities.map((activity) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8, x: -50 }}
                      animate={{ 
                        opacity: activity.saving ? 0.6 : 1, 
                        scale: 1, x: 0 
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      key={activity.id}
                      className="snap-start shrink-0 w-[300px]"
                    >
                      <Card className={`relative bg-card backdrop-blur-xl border border-border h-full overflow-hidden ${activity.saving ? "animate-pulse shadow-none border-dashed border-accent/50" : "shadow-lg shadow-accent/10"}`}>
                        {/* Optimistic saving indicator */}
                        {activity.saving && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-accent/20 text-accent text-xs px-2 py-1 rounded-full backdrop-blur-md">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Saving...</span>
                          </div>
                        )}
                        <CardHeader className="pb-4">
                          <CardTitle className="text-foreground text-lg">{activity.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-600 text-white capitalize">{activity.type}</span>
                            <span className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleDateString()}</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full" style={{ width: `${activity.progress}%` }} />
                          </div>
                          <Button 
                            disabled={activity.saving}
                            onClick={() => router.push(`/activity/${activity.id}`)}
                            className="w-full bg-accent/10 hover:bg-accent/20 text-accent transition-colors duration-300"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {activity.progress > 0 ? "Continue" : "Start Now"}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </section>
        )}

        {/* Featured Activities */}
        <section className="px-4 sm:px-6 lg:px-8 mb-20">
          <div className="max-w-7xl mx-auto">
            <Reveal delay={0.1}>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                    Featured Activities
                  </h2>
                  <p className="text-gray-400">
                    Trending games and quizzes this week
                  </p>
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <span className="text-accent font-medium">Most Popular</span>
                </div>
              </div>
            </Reveal>

            <div className="grid lg:grid-cols-3 gap-8">
              {featuredActivities.map((activity, index) => (
                <Reveal key={activity.id} delay={0.1 + index * 0.1}>
                  <Card className="group bg-card backdrop-blur-xl border-border hover:border-accent/50 transition-transform duration-700 hover:shadow-2xl hover:shadow-accent/25 overflow-hidden">
                    <div
                      className={`h-2 bg-gradient-to-r ${activity.gradient}`}
                    />

                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`p-3 bg-gradient-to-br ${activity.gradient} rounded-xl`}
                        >
                          <activity.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center space-x-1 bg-muted px-2 py-1 rounded-full">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-foreground font-medium text-sm">
                            {activity.rating}
                          </span>
                        </div>
                      </div>

                      <CardTitle className="text-foreground text-xl group-hover:text-accent transition-colors duration-300">
                        {activity.title}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {activity.description}
                      </p>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-4 text-sm">
                        <div className="flex items-center space-x-4 text-gray-400">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {activity.duration}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {activity.participants.toLocaleString()}
                          </div>
                        </div>
                        <span
                          className={`text-sm font-medium ${getDifficultyColor(
                            activity.difficulty,
                          )}`}
                        >
                          {activity.difficulty}
                        </span>
                      </div>

                      <Button
                        onClick={() => handleEnrollActivity(activity)}
                        className={`w-full bg-gradient-to-r ${activity.gradient} hover:shadow-lg hover:shadow-accent/25 transition-transform duration-300 group-hover:scale-[1.02]`}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Enroll Now
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="px-4 sm:px-6 lg:px-8 mb-16">
          <div className="max-w-7xl mx-auto">
            <Reveal delay={0.1}>
              <div className="bg-card backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-border hover:border-accent/20 transition-border duration-300">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-semibold text-foreground flex items-center">
                      <Filter className="w-5 h-5 mr-3 text-accent" />
                      Filter Activities
                    </h3>
                    {(selectedCategory !== "all" || selectedLevel !== "all" || searchQuery !== "") && (
                      <button
                        onClick={() => {
                          setSelectedCategory("all");
                          setSelectedLevel("all");
                          setSearchQuery("");
                        }}
                        className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="w-full sm:w-auto flex items-center space-x-2 bg-background rounded-full px-4 py-2 border border-border">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search activities..."
                      className="bg-transparent text-foreground placeholder-muted-foreground outline-none w-full text-sm"
                      aria-label="Search activities"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-4 block">
                      Subject Category
                    </label>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`flex items-center justify-center px-3 py-2 min-h-[42px] text-xs sm:text-sm rounded-full whitespace-nowrap transition-colors duration-300 ${
                            selectedCategory === category.id
                              ? "bg-gradient-to-r from-accent to-purple-500 text-white shadow-lg shadow-accent/25"
                              : "bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-black/50 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
                          }`}
                        >
                          <category.icon className="w-4 h-4 mr-2" />
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Level Filter */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-4 block">
                      Education Level
                    </label>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      {levels.map((level) => (
                        <button
                          key={level.id}
                          onClick={() => setSelectedLevel(level.id)}
                          className={`px-4 py-2 rounded-full transition-colors duration-300 text-sm ${
                            selectedLevel === level.id
                              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                              : "bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-black/50 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* All Activities Grid */}
        <section className="px-4 sm:px-6 lg:px-8 mb-20">
          <div className="max-w-7xl mx-auto">
            <Reveal delay={0.1}>
              <div className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  All Activities
                </h2>
                <p className="text-gray-400">
                  {filteredActivities.length} activities found
                  {selectedCategory !== "all" &&
                    ` in ${
                      categories.find((c) => c.id === selectedCategory)?.label
                    }`}
                  {selectedLevel !== "all" &&
                    ` for ${levels.find((l) => l.id === selectedLevel)?.label}`}
                </p>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredActivities.map((activity, index) => (
                <Reveal key={activity.id} delay={0.05 + index * 0.05}>
                  <Card className="group bg-card backdrop-blur-xl border-border hover:border-accent/30 transition-transform duration-500 hover:shadow-xl hover:shadow-accent/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`p-2 bg-gradient-to-br ${activity.gradient} rounded-lg`}
                        >
                          <activity.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center space-x-2 gap-2">
                          <div className="flex items-center space-x-1 bg-muted px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-foreground text-xs font-medium">
                              {activity.rating}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              activity.type === "quiz"
                                ? "bg-blue-600 text-white"
                                : "bg-green-600 text-white"
                          }`}
                          >
                            {activity.type}
                          </span>
                        </div>
                      </div>

                      <CardTitle className="text-foreground text-lg group-hover:text-accent transition-colors duration-300">
                        {activity.title}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {activity.description}
                      </p>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {activity.duration}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {activity.participants.toLocaleString()}
                          </div>
                        </div>
                        <span
                          className={`font-medium ${getDifficultyColor(
                            activity.difficulty,
                          )}`}
                        >
                          {activity.difficulty}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleEnrollActivity(activity)}
                        className={`w-full bg-gradient-to-r ${activity.gradient} hover:shadow-md transition-transform duration-300 text-xs sm:text-sm`}
                      >
                        <Sparkles className="w-3 h-3 mr-2" />
                        Enroll Now
                      </Button>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>

            {filteredActivities.length === 0 && (
              <Reveal>
                <div className="text-center py-16">
                  <Puzzle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No Activities Found
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Try adjusting your filters to see more activities.
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedLevel("all");
                      setSearchQuery("");
                    }}
                    className="bg-gradient-to-r from-accent to-purple-500"
                  >
                    Reset Filters
                  </Button>
                </div>
              </Reveal>
            )}
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 mb-20">
          <div className="max-w-7xl mx-auto">
            <Reveal delay={0.1}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    Activity Analysis
                  </h2>
                  <p className="text-muted-foreground">
                    Weekly momentum, consistency, and progress signals
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-full">
                  <BarChart3 className="w-4 h-4 text-accent" />
                  <span className="text-sm text-foreground font-semibold">
                    {analysisData.rangeTotal} in last {analysisRangeDays} days
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
                      analysisData.change >= 0
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {analysisData.change >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {analysisData.change >= 0 ? "+" : ""}
                    {analysisData.changePercent}%
                  </span>
                </div>
              </div>
            </Reveal>

            {!isSignedIn && (
              <Reveal delay={0.12}>
                <div className="mb-6 rounded-2xl border border-border bg-card/70 px-5 py-4 text-sm text-muted-foreground">
                  Sign in to see your personalized activity insights.
                </div>
              </Reveal>
            )}

            {isSignedIn && !hasActivityData && (
              <Reveal delay={0.12}>
                <div className="mb-6 rounded-2xl border border-border bg-card/70 px-5 py-4 text-sm text-muted-foreground">
                  No activity data yet. Enroll in a quiz or game to start tracking your progress.
                </div>
              </Reveal>
            )}

            <Reveal delay={0.12}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div className="flex flex-wrap gap-2">
                  {analysisRanges.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setAnalysisRange(range.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                        analysisRange === range.id
                          ? "bg-gradient-to-r from-accent to-purple-500 text-white border-transparent shadow-lg shadow-accent/20"
                          : "bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-white/10 hover:text-foreground"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysisTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setAnalysisType(type.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                        analysisType === type.id
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent shadow-lg shadow-blue-500/20"
                          : "bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-white/10 hover:text-foreground"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>

            <div className="grid lg:grid-cols-3 gap-6">
              <Reveal delay={0.15} className="lg:col-span-2">
                <Card className="bg-card backdrop-blur-xl border-border h-full">
                  <CardHeader>
                    <CardTitle className="text-foreground text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-accent" />
                      Weekly activity trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div className="rounded-xl border border-border bg-background/60 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Total activities
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">
                            {analysisData.total}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background/60 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Avg per day
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">
                            {analysisData.averagePerDay}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background/60 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Focus time
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">
                            {formatMinutes(analysisData.totalMinutes)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {analysisData.averageMinutes}m avg / activity
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background/60 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Completion rate
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">
                            {analysisData.completionRate}%
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background/60 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Best day
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">
                            {analysisData.bestDay.short}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {analysisData.bestDay.count} activities
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background/60 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Avg score
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">
                            {analysisData.averageScore ?? "--"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {analysisData.averageScore ? "Points" : "No graded items"}
                          </p>
                        </div>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-border bg-background/60 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-muted-foreground">Daily trend</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <LineChart className="w-4 h-4 text-accent" />
                              {analysisRangeDays} day view
                            </div>
                          </div>
                          <svg
                            width={analysisData.sparkline.width}
                            height={analysisData.sparkline.height}
                            viewBox={`0 0 ${analysisData.sparkline.width} ${analysisData.sparkline.height}`}
                            className="w-full"
                            aria-hidden
                          >
                            <path
                              d={analysisData.sparkline.areaPath}
                              fill="url(#activityArea)"
                              opacity="0.35"
                            />
                            <path
                              d={analysisData.sparkline.linePath}
                              fill="none"
                              stroke="#8b5cf6"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="activityArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>{analysisData.days[0]?.short}</span>
                            <span>{analysisData.days[analysisData.days.length - 1]?.short}</span>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-background/60 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-muted-foreground">Activity mix</p>
                            <span className="text-xs text-muted-foreground">
                              {typeTotal} total
                            </span>
                          </div>
                          <div className="h-3 w-full rounded-full overflow-hidden bg-white/5 border border-border">
                            {typeTotal === 0 && <div className="h-full w-full bg-white/10" />}
                            {typeTotal > 0 && (
                              <div className="h-full flex">
                                {Object.entries(analysisData.typeCounts).map(([type, count]) => (
                                  <div
                                    key={type}
                                    className={`h-full ${
                                      type === "quiz"
                                        ? "bg-blue-500"
                                        : type === "game"
                                          ? "bg-emerald-500"
                                          : "bg-amber-500"
                                    }`}
                                    style={{ width: `${Math.round((count / typeTotal) * 100)}%` }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {Object.keys(analysisData.typeCounts).length === 0 && (
                              <span className="text-xs text-muted-foreground">No activity yet</span>
                            )}
                            {Object.entries(analysisData.typeCounts).map(([type, count]) => (
                              <span
                                key={type}
                                className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20"
                              >
                                {type}: {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                  </CardContent>
                </Card>
              </Reveal>

              <Reveal delay={0.2}>
                <Card className="bg-card backdrop-blur-xl border-border h-full">
                  <CardHeader>
                    <CardTitle className="text-foreground text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-accent" />
                      Consistency insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Consistency score</span>
                        <span className="text-foreground font-semibold">
                          {analysisData.consistency}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                          style={{ width: `${analysisData.consistency}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-border bg-background/60 p-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.18em]">
                          <Flame className="w-4 h-4 text-orange-400" />
                          Current streak
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {analysisData.currentStreak} days
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-background/60 p-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.18em]">
                          <Award className="w-4 h-4 text-yellow-400" />
                          Longest streak
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {analysisData.longestStreak} days
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Goal tracker
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Target {analysisData.goalTarget} activities
                          </p>
                        </div>
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold text-foreground"
                          style={{
                            background: `conic-gradient(#34d399 ${analysisData.goalProgress * 3.6}deg, rgba(148, 163, 184, 0.2) 0deg)`,
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                            {analysisData.goalProgress}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {analysisData.rangeTotal} logged so far
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Consistency heatmap
                        </p>
                        <span className="text-xs text-muted-foreground">Last 4 weeks</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {analysisData.heatmapDays.map((day) => (
                          <div
                            key={day.key}
                            title={`${day.label}: ${day.count} activities`}
                            className="w-full aspect-square rounded"
                            style={{
                              backgroundColor: `rgba(139, 92, 246, ${
                                0.1 + (day.count / analysisData.heatMax) * 0.7
                              })`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Timer className="w-4 h-4 text-accent" />
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Coach tips
                        </p>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {analysisData.insights.slice(0, 3).map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                            <span>{tip}</span>
                          </li>
                        ))}
                        {analysisData.insights.length === 0 && (
                          <li>Log a few activities to unlock personalized tips.</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <div className="bg-card rounded-3xl p-12 border border-accent/30 backdrop-blur-xl hover:border-accent/50 transition-border duration-700">
                <Trophy className="w-16 h-16 text-accent mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-center">
                  Ready to Level Up Your Learning?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-center">
                  Join thousands of students who are making learning fun and
                  engaging through our interactive platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-gradient-to-r from-accent to-purple-500 hover:shadow-xl hover:shadow-accent/25 transition-transform duration-300 hover:scale-105 text-white font-semibold">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Playing Now
                  </Button>
                  <Button
                    onClick={() => router.push('/leaderboards')}
                    variant="outline"
                    className="border-border text-foreground bg-muted hover:bg-muted/80 transition-colors duration-300"
                  >
                    View Leaderboards
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </div>

      {/* Floating Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.8;
          }
        }

        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
