"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, BookOpen, Zap } from "lucide-react";

const RoomLobby = ({ onCreateRoom, rooms = [], onJoinRoom }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!roomName.trim()) return;
    onCreateRoom({ name: roomName.trim(), description: description.trim() });
    setRoomName("");
    setDescription("");
    setShowCreate(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white mb-2"
          >
            Study Rooms
          </motion.h1>
          <p className="text-slate-400">Collaborate with classmates in real-time</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="p-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl text-left hover:border-indigo-500/50 transition-colors"
          >
            <Plus className="w-8 h-8 text-indigo-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Create Room</h3>
            <p className="text-sm text-slate-400">Start a new collaborative study session</p>
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl"
          >
            <Users className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Active Rooms</h3>
            <p className="text-sm text-slate-400">{rooms.length} rooms available</p>
          </motion.div>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Create New Room</h3>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room name (e.g., Math Study Group)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!roomName.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-white font-medium transition-colors"
              >
                <Zap className="w-4 h-4 inline mr-1" />
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {rooms.map((room) => (
            <motion.div
              key={room._id}
              whileHover={{ scale: 1.01 }}
              className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-medium">{room.name}</h4>
                  <p className="text-xs text-slate-400">
                    Hosted by {room.hostName} · {room.description || "No description"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onJoinRoom(room._id)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-medium transition-colors"
              >
                Join
              </button>
            </motion.div>
          ))}

          {rooms.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No active rooms. Create one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomLobby;
