"use client";
import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Star,
  Zap,
  Users,
  Globe,
  Flame,
  ChevronUp,
  Minus
} from "lucide-react";
import DarkVeil from "@/components/ui-block/DarkVeil";
import { Navbar } from "@/components/Navbar";

// Reusable animation component
const Reveal = ({ children, className = "", delay = 0, y = 20 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

// Dummy Data
const LEADERBOARD_DATA = [
  { id: 1, name: "Sarah Chen", score: 9850, avatar: "👩‍🎓", rank: 1, change: "up", streak: 45, badges: 12 },
  { id: 2, name: "Alex Kumar", score: 9240, avatar: "👨‍💻", rank: 2, change: "up", streak: 32, badges: 10 },
  { id: 3, name: "Elena Rodriguez", score: 8900, avatar: "👩‍🔬", rank: 3, change: "same", streak: 28, badges: 9 },
  { id: 4, name: "David Kim", score: 8450, avatar: "👨‍🚀", rank: 4, change: "down", streak: 15, badges: 7 },
  { id: 5, name: "Maya Patel", score: 8200, avatar: "🧕", rank: 5, change: "up", streak: 21, badges: 8 },
  { id: 6, name: "James Wilson", score: 7900, avatar: "👨‍🏫", rank: 6, change: "same", streak: 12, badges: 5 },
  { id: 7, name: "Sofia Garcia", score: 7650, avatar: "👩‍💻", rank: 7, change: "up", streak: 18, badges: 6 },
  { id: 8, name: "Liam Chen", score: 7400, avatar: "🧑‍🎓", rank: 8, change: "down", streak: 5, badges: 4 },
  { id: 9, name: "Aisha Johnson", score: 7100, avatar: "👩‍🚀", rank: 9, change: "up", streak: 14, badges: 5 },
  { id: 10, name: "You (Current)", score: 6800, avatar: "👤", rank: 10, change: "up", streak: 7, badges: 3 },
];

export default function LeaderboardsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("global");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, "userStats"), orderBy("totalXp", "desc"), limit(50));
        const snapshot = await getDocs(q);
        
        const fetchedData = [];
        let currentRank = 1;
        
        for (const docSnap of snapshot.docs) {
          const stats = docSnap.data();
          const userId = docSnap.id;
          
          let userData = {};
          try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) userData = userSnap.data();
          } catch (e) {
            console.warn("Could not fetch user details for", userId);
          }
          
          fetchedData.push({
            id: userId,
            name: userData.displayName || "Unknown Learner",
            score: stats.totalXp || stats.score || 0,
            avatar: userData.photoURL ? (
              <img src={userData.photoURL} alt="avatar" className="w-full h-full rounded-full object-cover" />
            ) : "👩‍🎓",
            rank: currentRank++,
            change: "same",
            streak: stats.currentStreak || stats.streak || 0,
            badges: stats.badges || (stats.unlockedBadges ? stats.unlockedBadges.length : 0),
            isCurrentUser: user?.uid === userId
          });
        }
        
        if (fetchedData.length > 0) {
          setLeaderboardData(fetchedData);
        } else {
          // Fallback to mock data if empty
          setLeaderboardData(LEADERBOARD_DATA);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard data:", err);
        // Fallback if index missing or permission denied
        setLeaderboardData(LEADERBOARD_DATA);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [user]);

  const isDark = mounted ? theme === "dark" : true;

  const displayData = leaderboardData.length > 0 ? leaderboardData : LEADERBOARD_DATA;
  const topThree = displayData.length >= 3 ? [displayData[1], displayData[0], displayData[2]] : [];
  const restOfList = displayData.slice(3);
  
  // Find current user or default to the last one
  const currentUser = displayData.find(u => u.isCurrentUser) || displayData[displayData.length - 1] || LEADERBOARD_DATA[9];

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return { color: "text-yellow-400", bg: "from-yellow-400/20 to-yellow-600/20", border: "border-yellow-400/50", glow: "shadow-yellow-500/50" };
      case 2:
        return { color: "text-gray-300", bg: "from-gray-300/20 to-gray-500/20", border: "border-gray-300/50", glow: "shadow-gray-400/30" };
      case 3:
        return { color: "text-amber-600", bg: "from-amber-600/20 to-amber-800/20", border: "border-amber-600/50", glow: "shadow-amber-700/30" };
      default:
        return { color: "text-gray-400", bg: "bg-white/5", border: "border-white/10", glow: "" };
    }
  };

  const tabs = [
    { id: "global", label: "Global", icon: Globe },
    { id: "class", label: "My Class", icon: Users },
    { id: "friends", label: "Friends", icon: Star },
  ];

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-background overflow-hidden">
        {isDark && <DarkVeil />}
        <div className="absolute inset-0">
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-[100px] -top-20 -left-20 animate-pulse" />
          <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-pink-600/20 to-orange-600/20 rounded-full blur-[100px] bottom-0 right-0 animate-pulse" style={{ animationDelay: "2s" }} />
        </div>
      </div>

      <div className="min-h-screen relative z-10 flex flex-col">
        <Navbar />
        
        <main className="flex-1 pt-32 pb-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header section */}
            <div className="text-center mb-12">
              <Reveal delay={0.1}>
                <div className="inline-flex items-center px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm mb-6">
                  <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-foreground font-medium">Hall of Fame</span>
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Global <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Leaderboards</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Compete with peers, earn points through activities, and climb your way to the top of the ranks!
                </p>
              </Reveal>
            </div>

            {/* Tabs */}
            <Reveal delay={0.3}>
              <div className="flex justify-center mb-16">
                <div className="inline-flex p-1 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                          isActive ? "text-white" : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-pink-500/50 rounded-xl shadow-lg"
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          />
                        )}
                        <tab.icon className={`w-4 h-4 mr-2 relative z-10 ${isActive ? "text-white" : ""}`} />
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Podium Section */}
                <div className="flex justify-center items-end h-72 sm:h-80 mb-20 gap-2 sm:gap-6">
                  {topThree.map((user, index) => {
                    if (!user) return null;
                    const isFirst = index === 1;
                    const isSecond = index === 0;
                    const isThird = index === 2;
                    const style = getRankStyle(user.rank);
                    const height = isFirst ? "h-64 sm:h-72" : isSecond ? "h-48 sm:h-56" : "h-40 sm:h-48";
                    const delay = isFirst ? 0.6 : isSecond ? 0.4 : 0.5;

                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 100, damping: 15, delay }}
                        className="relative flex flex-col items-center flex-1 max-w-[120px] sm:max-w-[160px]"
                      >
                        {/* Floating Avatar & Details */}
                        <div className="absolute -top-20 flex flex-col items-center">
                          {isFirst && (
                            <motion.div 
                              animate={{ y: [-5, 5, -5] }} 
                              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                              className="absolute -top-8 text-yellow-400"
                            >
                              <Trophy className="w-8 h-8 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                            </motion.div>
                          )}
                          <div className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-3xl sm:text-4xl bg-gray-800 rounded-full border-4 ${style.border} shadow-lg mb-2 z-10 ${isFirst ? 'scale-110' : ''} overflow-hidden`}>
                            {user.avatar}
                          </div>
                          <span className="font-bold text-foreground text-xs sm:text-sm text-center truncate w-full px-2">{user.name}</span>
                          <span className={`font-black ${style.color} text-sm sm:text-base`}>{user.score} pts</span>
                        </div>

                        {/* Podium Block */}
                        <div className={`w-full ${height} bg-gradient-to-t ${style.bg} border-t-4 border-l border-r ${style.border} rounded-t-lg backdrop-blur-md flex flex-col justify-end items-center pb-6 shadow-2xl ${style.glow}`}>
                          <span className={`text-4xl sm:text-5xl font-black opacity-30 ${style.color}`}>{user.rank}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* List Section */}
                <Reveal delay={0.7}>
                  <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-8">
                    <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <div className="col-span-1 text-center">Rank</div>
                      <div className="col-span-5">Learner</div>
                      <div className="col-span-2 text-center">Score</div>
                      <div className="col-span-2 text-center">Streak</div>
                      <div className="col-span-2 text-center">Badges</div>
                    </div>

                    <div className="flex flex-col">
                      {restOfList.map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className={`group grid grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors ${(user.name && user.name.includes("You")) || user.isCurrentUser ? "bg-purple-900/20 border-l-4 border-l-purple-500" : ""}`}
                        >
                          <div className="col-span-2 sm:col-span-1 flex items-center justify-center font-bold text-gray-400">
                            #{user.rank}
                          </div>
                          
                          <div className="col-span-7 sm:col-span-5 flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center text-xl bg-gray-800 rounded-full border border-gray-600 overflow-hidden">
                              {user.avatar}
                            </div>
                            <div className="flex flex-col">
                              <span className={`font-semibold ${(user.name && user.name.includes("You")) || user.isCurrentUser ? "text-purple-400" : "text-foreground"}`}>
                                {user.name}
                              </span>
                              <span className="text-xs text-muted-foreground sm:hidden">{user.score} pts</span>
                            </div>
                          </div>

                          <div className="hidden sm:flex col-span-2 items-center justify-center font-mono font-bold text-accent">
                            {user.score?.toLocaleString()}
                          </div>

                          <div className="hidden sm:flex col-span-2 items-center justify-center gap-1 text-orange-400">
                            <Flame className="w-4 h-4" /> {user.streak}
                          </div>

                          <div className="hidden sm:flex col-span-2 items-center justify-center gap-1 text-blue-400">
                            <Award className="w-4 h-4" /> {user.badges}
                          </div>
                          
                          {/* Mobile stats shortcut */}
                          <div className="col-span-3 flex sm:hidden flex-col items-end gap-1 text-xs">
                            <div className="flex items-center gap-1 text-orange-400"><Flame className="w-3 h-3"/>{user.streak}</div>
                            <div className="flex items-center gap-1 text-blue-400"><Award className="w-3 h-3"/>{user.badges}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </>
            )}
          </div>
        </main>
        
        {/* Sticky Current User Status Bar */}
        {!loading && currentUser && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 1.5, type: "spring", damping: 20 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 flex items-center justify-center text-2xl bg-gradient-to-r from-purple-500 to-blue-500 rounded-full border-2 border-white shadow-lg overflow-hidden">
                    {currentUser.avatar}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-gray-600">
                    #{currentUser.rank}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-foreground font-bold">{currentUser.name}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    Keep it up!
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Total Score</span>
                  <span className="text-xl font-black bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
                    {currentUser.score?.toLocaleString()}
                  </span>
                </div>
                <button className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-white/10 hidden sm:block">
                  View Full Profile
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
