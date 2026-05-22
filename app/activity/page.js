"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DarkVeil from "@/components/ui-block/DarkVeil";
import {
  BookOpen,
  Brain,
  Trophy,
  Clock,
  Users,
  Star,
  Play,
  ChevronRight,
  Sparkles,
  Target,
  Zap,
  Award,
  TrendingUp,
  User,
  Calendar,
  Filter,
  Search,
  Gamepad2,
  Puzzle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/services/activityService";
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
  const { user } = useAuth();
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
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

  const handleStartActivity = async (activity) => {
  try {
    // Only log if user exists
    if (user) {
      await logActivity(user.uid, {
        title: activity.title,
        type: activity.type || "course",
        progress: 0,
      });

      // Increment statistic
      await updateUserStat(user.uid, "Courses Enrolled", 1);
    }

    // Open activity page
    router.push(`/activity/${activity.id}`);
  } catch (error) {
    console.error("Error starting activity:", error);

    // Still open page even if logging fails
    router.push(`/activity/${activity.id}`);
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
      <div className="fixed inset-0 -z-10">
        <DarkVeil />

        {/* Mouse-following gradient orb */}
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
            transition: "all 1.2s ease-out",
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
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-full border border-accent/30 backdrop-blur-sm mb-6">
                <Gamepad2 className="w-5 h-5 text-accent-foreground mr-2" />
                <span className="text-accent-foreground font-medium">
                  Interactive Learning
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Learn Through{" "}
                <span className="bg-gradient-to-r from-accent via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Play
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.3}>
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-8">
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
                  { label: "Active Games", value: "250+", icon: Gamepad2 },
                  { label: "Students Playing", value: "50K+", icon: Users },
                  { label: "Avg Rating", value: "4.7", icon: Star },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
                  >
                    <stat.icon className="w-5 h-5 text-accent" />
                    <span className="text-white font-semibold">
                      {stat.value}
                    </span>
                    <span className="text-gray-400 text-sm">{stat.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Featured Activities */}
        <section className="px-4 sm:px-6 lg:px-8 mb-20">
          <div className="max-w-7xl mx-auto">
            <Reveal delay={0.1}>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
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
                  <Card className="group bg-black/40 backdrop-blur-xl border-white/10 hover:border-accent/50 transition-all duration-700 hover:shadow-2xl hover:shadow-accent/25 overflow-hidden">
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
                        <div className="flex items-center space-x-1 bg-black/50 px-2 py-1 rounded-full">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-white font-medium text-sm">
                            {activity.rating}
                          </span>
                        </div>
                      </div>

                      <CardTitle className="text-white text-xl group-hover:text-accent transition-colors duration-300">
                        {activity.title}
                      </CardTitle>
                      <p className="text-gray-400 text-sm line-clamp-2">
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
                            activity.difficulty
                          )}`}
                        >
                          {activity.difficulty}
                        </span>
                      </div>

                      <Button
                        onClick={() => handleStartActivity(activity)}
                        className={`w-full bg-gradient-to-r ${activity.gradient} hover:shadow-lg hover:shadow-accent/25 transition-all duration-300 group-hover:scale-[1.02]`}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start {activity.type === "quiz" ? "Quiz" : "Game"}
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
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 hover:border-accent/20 transition-all duration-300">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <Filter className="w-5 h-5 mr-3 text-accent" />
                    Filter Activities
                  </h3>
                  <div className="w-full sm:w-auto flex items-center space-x-2 bg-black/30 rounded-full px-4 py-2 border border-white/10">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search activities..."
                      className="bg-transparent text-white placeholder-gray-500 outline-none w-full text-sm"
                      aria-label="Search activities"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-semibold text-white mb-4 block">
                      Subject Category
                    </label>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`flex items-center justify-center px-3 py-2 min-h-[42px] text-xs sm:text-sm rounded-full whitespace-nowrap transition-all duration-300 ${selectedCategory === category.id
                            ? "bg-gradient-to-r from-accent to-purple-500 text-white shadow-lg shadow-accent/25"
                            : "bg-black/30 text-gray-300 hover:bg-black/50 hover:text-white border border-white/10"
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
                    <label className="text-sm font-semibold text-white mb-4 block">
                      Education Level
                    </label>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      {levels.map((level) => (
                        <button
                          key={level.id}
                          onClick={() => setSelectedLevel(level.id)}
                          className={`px-4 py-2 rounded-full transition-all duration-300 text-sm ${selectedLevel === level.id
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                            : "bg-black/30 text-gray-300 hover:bg-black/50 hover:text-white border border-white/10"
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
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  All Activities
                </h2>
                <p className="text-gray-400">
                  {filteredActivities.length} activities found
                  {selectedCategory !== "all" &&
                    ` in ${categories.find((c) => c.id === selectedCategory)?.label
                    }`}
                  {selectedLevel !== "all" &&
                    ` for ${levels.find((l) => l.id === selectedLevel)?.label}`}
                </p>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredActivities.map((activity, index) => (
                <Reveal key={activity.id} delay={0.05 + index * 0.05}>
                  <Card className="group bg-black/40 backdrop-blur-xl border-white/10 hover:border-accent/30 transition-all duration-500 hover:shadow-xl hover:shadow-accent/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`p-2 bg-gradient-to-br ${activity.gradient} rounded-lg`}
                        >
                          <activity.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center space-x-2 gap-2">
                          <div className="flex items-center space-x-1 bg-black/50 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-white text-xs font-medium">
                              {activity.rating}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${activity.type === "quiz"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-green-500/20 text-green-300"
                              }`}
                          >
                            {activity.type}
                          </span>
                        </div>
                      </div>

                      <CardTitle className="text-white text-lg group-hover:text-accent transition-colors duration-300">
                        {activity.title}
                      </CardTitle>
                      <p className="text-gray-400 text-sm line-clamp-2">
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
                            activity.difficulty
                          )}`}
                        >
                          {activity.difficulty}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleStartActivity(activity)}
                        className={`w-full bg-gradient-to-r ${activity.gradient} hover:shadow-md transition-all duration-300 text-xs sm:text-sm`}
                      >
                        <Play className="w-3 h-3 mr-2" />
                        Play Now
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
                  <h3 className="text-xl font-semibold text-white mb-2">
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

        {/* CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <div className="bg-gradient-to-br from-black/50 to-purple-900/30 rounded-3xl p-12 border border-accent/30 backdrop-blur-xl hover:border-accent/50 transition-all duration-700">
                <Trophy className="w-16 h-16 text-accent mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
                  Ready to Level Up Your Learning?
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto text-center">
                  Join thousands of students who are making learning fun and
                  engaging through our interactive platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-gradient-to-r from-accent to-purple-500 hover:shadow-xl hover:shadow-accent/25 transition-all duration-300 hover:scale-105 text-white font-semibold">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Playing Now
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white bg-black/30 hover:bg-black/50 transition-all duration-300"
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
