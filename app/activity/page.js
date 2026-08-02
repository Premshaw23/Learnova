"use client";
import { useState, useEffect, useRef, useOptimistic } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import DarkVeil from "@/components/ui-block/DarkVeil";
import CardListSkeleton from "@/components/ui/CardListSkeleton";
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
  TrendingUp, // removed user, calendar as they are not used
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
import {
  logActivity,
  getUserActivities, // removed removeActivity as it's not used
} from "@/services/activityService";
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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const orbRef = useRef(null);
  const mouseMoveRaf = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // React 19 Optimistic Hook
  const [optimisticActivities, addOptimisticActivity] = useOptimistic(
    activities,
    (state, newActivity) => {
      // Filter out if duplicate
      if (state.some((a) => a.title === newActivity.title)) return state;
      return [newActivity, ...state];
    }
  );

  useEffect(() => {
    if (user?.uid) {
      getUserActivities(user.uid).then((data) => {
      .catch(err => console.error(err))