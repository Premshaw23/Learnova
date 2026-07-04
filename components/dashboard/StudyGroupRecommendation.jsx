"use client";

import React, { useState, useEffect } from "react";
import { Users, UserPlus, BrainCircuit, RefreshCw, Trophy } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function StudyGroupRecommendation() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/study-groups");
      if (!res.ok) throw new Error("Failed to fetch study groups");
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground dark:text-white mb-2 flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-purple-500" />
            AI Study Group Recommendations
          </h2>
          <p className="text-muted-foreground dark:text-gray-400">
            Intelligently pair students based on performance, attendance, and
            complementary strengths.
          </p>
        </div>
        <button
          onClick={fetchGroups}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Regenerate Groups
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 h-64 animate-pulse"
            />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10">
          <Users className="w-16 h-16 text-muted-foreground dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground dark:text-white">
            No students found
          </h3>
          <p className="text-muted-foreground dark:text-gray-400 mt-2">
            Add students to your classes to generate study groups.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 p-6 shadow-xl relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground dark:text-white mb-1">
                    {group.name}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Trophy className="w-3 h-3" />
                    {group.focusArea}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              <div className="space-y-3">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-background/50 dark:bg-white/5 border border-transparent hover:border-border dark:hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {member.avatar ? (
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          width={36}
                          height={36}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-medium text-xs">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-sm text-foreground dark:text-white">
                          {member.name}
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-gray-400">
                          {member.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-green-400">
                          {Math.round(member.attendanceRate)}% Att
                        </span>
                        <div className="w-1 h-1 rounded-full bg-gray-500" />
                        <span className="text-xs font-medium text-blue-400">
                          {member.academicScore} Score
                        </span>
                      </div>
                      <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                          style={{ width: `${member.strength}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-medium py-2 rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Assign Project
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
