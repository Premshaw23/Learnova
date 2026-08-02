"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RoomLobby from "@/components/study-rooms/RoomLobby";
import { useAuth } from "@/hooks/useAuth";

const StudyRoomsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch("/api/study-rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRooms(data.data.rooms);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async ({ name, description }) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch("/api/study-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/study-rooms/${data.data.room._id}`);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const handleJoinRoom = (roomId) => {
    router.push(`/study-rooms/${roomId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading rooms...</div>
      </div>
    );
  }

  return (
    <RoomLobby
      rooms={rooms}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
    />
  );
};

export default StudyRoomsPage;
