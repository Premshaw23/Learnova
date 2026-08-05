"use client";

import React, { useState, useEffect } from "react";
import { Flame, Award, Coins, Zap, Trophy, Lock } from "lucide-react";

/**
 * DynamicGamificationHub Component
 * 
 * Implements a daily login streak system and dynamic achievements
 * rewarding users with profile badges and platform currency.
 * Leverages behavioral psychology to build daily habits.
 */
export default function DynamicGamificationHub() {
  const [streakDays, setStreakDays] = useState(14); // Mock data
  const [currency, setCurrency] = useState(1250); // Mock data
  const [showNotification, setShowNotification] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState(null);

  const badges = [
    { id: 1, title: "7-Day Streak", icon: <Flame className="text-orange-500" />, unlocked: true, reward: 100 },
    { id: 2, title: "First 5-hour Week", icon: <Zap className="text-blue-500" />, unlocked: true, reward: 250 },
    { id: 3, title: "Quiz Master", icon: <Trophy className="text-yellow-500" />, unlocked: false, reward: 500, progress: "8/10 Quizzes" },
    { id: 4, title: "Early Bird", icon: <Award className="text-purple-500" />, unlocked: false, reward: 150, progress: "Study before 8 AM" }
  ];

  // Simulate unlocking a badge after viewing the component
  useEffect(() => {
    const timer = setTimeout(() => {
      setUnlockedBadge(badges[2]); // Simulate unlocking Quiz Master
      setCurrency(prev => prev + badges[2].reward);
      setShowNotification(true);
      
      setTimeout(() => setShowNotification(false), 5000);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-3xl mx-auto my-8 relative overflow-hidden">
      
      {/* Dynamic Achievement Notification Overlay */}
      <div 
        className={`absolute top-0 left-0 w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 text-white p-4 flex items-center justify-center gap-4 transition-transform duration-500 z-10 shadow-lg ${showNotification ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <Trophy size={28} className="animate-bounce" />
        <div>
          <p className="font-bold text-lg leading-tight">Achievement Unlocked: {unlockedBadge?.title}</p>
          <p className="text-sm font-medium flex items-center gap-1"><Coins size={14} /> +{unlockedBadge?.reward} Coins earned!</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 pt-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Your Study Journey</h2>
          <p className="text-gray-500 text-sm">Build daily habits to earn badges and rewards.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
            <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={24} />
            <div>
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Day Streak</p>
              <p className="text-xl font-black text-orange-700">{streakDays}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100">
            <Coins className="text-yellow-500 fill-yellow-500" size={24} />
            <div>
              <p className="text-xs text-yellow-600 font-bold uppercase tracking-wider">Currency</p>
              <p className="text-xl font-black text-yellow-700 transition-all">{currency}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg text-gray-700 mb-4">Dynamic Badges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {badges.map((badge) => {
            const isJustUnlocked = showNotification && unlockedBadge?.id === badge.id;
            const isUnlocked = badge.unlocked || isJustUnlocked;

            return (
              <div 
                key={badge.id} 
                className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${isUnlocked ? 'bg-white border-gray-200 hover:border-gray-300' : 'bg-gray-50 border-dashed border-gray-200'} ${isJustUnlocked ? 'ring-4 ring-yellow-400 ring-opacity-50 scale-105 bg-yellow-50' : ''}`}
              >
                <div className={`p-3 rounded-full ${isUnlocked ? 'bg-gray-100' : 'bg-gray-200 grayscale opacity-50'}`}>
                  {isUnlocked ? badge.icon : <Lock className="text-gray-400" />}
                </div>
                
                <div className="flex-1">
                  <h4 className={`font-bold ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                    {badge.title}
                  </h4>
                  {!isUnlocked ? (
                    <p className="text-xs text-gray-500 mt-1 font-medium">{badge.progress}</p>
                  ) : (
                    <p className="text-xs text-green-600 font-bold mt-1">Unlocked</p>
                  )}
                </div>

                <div className="text-right">
                  <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                    <Coins size={12} /> {badge.reward}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
