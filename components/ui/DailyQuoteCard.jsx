"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const QUOTES = [
  { id: 1, text: "Learning never exhausts the mind.", author: "Leonardo da Vinci", category: "learning" },
  { id: 2, text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson", category: "programming" },
  { id: 3, text: "The expert in anything was once a beginner.", author: "Helen Hayes", category: "learning" },
  { id: 4, text: "Focus on being productive instead of busy.", author: "Tim Ferriss", category: "productivity" },
  { id: 5, text: "Creativity is intelligence having fun.", author: "Albert Einstein", category: "creativity" },
  { id: 6, text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House", category: "programming" },
  { id: 7, text: "Deep work is the superpower of the 21st century.", author: "Cal Newport", category: "focus" },
  { id: 8, text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi", category: "learning" },
  { id: 9, text: "Simplicity is the soul of efficiency.", author: "Austin Freeman", category: "productivity" },
  { id: 10, text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "focus" }
];

/**
 * DailyQuoteCard Component
 * Renders a randomized motivational quote that persists for 24 hours.
 */
export default function DailyQuoteCard() {
  const [dailyQuote, setDailyQuote] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const STORAGE_KEY = "learnova_daily_quote";
    const today = new Date().toDateString();

    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      let selectedQuote = null;

      if (savedData) {
        const { quote, date } = JSON.parse(savedData);
        // If the stored date is today, reuse the quote
        if (date === today) {
          selectedQuote = quote;
        }
      }

      // If no quote for today, pick a new one randomly
      if (!selectedQuote) {
        const randomIndex = Math.floor(Math.random() * QUOTES.length);
        selectedQuote = QUOTES[randomIndex];
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ quote: selectedQuote, date: today })
        );
      }

      setDailyQuote(selectedQuote);
    } catch (error) {
      console.error("Failed to load daily quote:", error);
      // Fallback to first quote if storage fails
      setDailyQuote(QUOTES[0]);
    }
  }, []);

  if (!mounted || !dailyQuote) return null;

  const categoryColors = {
    productivity: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    learning: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    programming: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    focus: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    creativity: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden group p-6 rounded-3xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm shadow-xl"
    >
      {/* Subtle Glow Effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-500" />
      
      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-indigo-400">
            <Quote className="w-5 h-5 fill-indigo-400/10" />
          </div>
          {dailyQuote.category && (
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${categoryColors[dailyQuote.category] || categoryColors.learning}`}>
              {dailyQuote.category}
            </span>
          )}
        </div>

        <blockquote className="space-y-3">
          <p className="text-lg md:text-xl font-medium text-zinc-200 leading-relaxed italic tracking-tight">
            "{dailyQuote.text}"
          </p>
          <footer className="flex items-center gap-3">
            <div className="h-px w-8 bg-zinc-800" />
            <cite className="text-sm font-semibold text-zinc-500 not-italic">
              {dailyQuote.author}
            </cite>
          </footer>
        </blockquote>
      </div>

      {/* Decorative background mark */}
      <div className="absolute bottom-[-20px] left-4 opacity-[0.03] pointer-events-none select-none">
        <span className="text-8xl font-serif font-black">"</span>
      </div>
    </motion.div>
  );
}