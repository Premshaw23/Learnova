"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import StudyRoom from "@/components/study-rooms/StudyRoom";
import { useAuth } from "@/hooks/useAuth";

const StudyRoomPage = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { roomId } = params;

  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const heartbeatRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!user || !roomId) return;
    joinAndLoad();
    return () => cleanup();
  }, [user, roomId]);

  const joinAndLoad = async () => {
    try {
      const token = await user.getIdToken();

      // Join the room
      await fetch(`/api/study-rooms/${roomId}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Load room details
      const roomRes = await fetch(`/api/study-rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const roomData = await roomRes.json();
      if (roomData.success) {
        setRoom(roomData.data.room);
        setParticipants(roomData.data.participants);
      } else {
        setError("Room not found");
        return;
      }

      // Load messages
      const msgRes = await fetch(`/api/study-rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const msgData = await msgRes.json();
      if (msgData.success) {
        setMessages(msgData.data.messages);
      }

      // Start heartbeat
      heartbeatRef.current = setInterval(async () => {
        try {
          const t = await user.getIdToken();
          await fetch(`/api/study-rooms/${roomId}/participants`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${t}`,
            },
            body: JSON.stringify({ action: "heartbeat" }),
          });
        } catch {}
      }, 30000);

      // Start polling for updates
      pollRef.current = setInterval(async () => {
        try {
          const t = await user.getIdToken();
          const [partRes, msgRes] = await Promise.all([
            fetch(`/api/study-rooms/${roomId}/participants`, {
              headers: { Authorization: `Bearer ${t}` },
            }),
            fetch(`/api/study-rooms/${roomId}/messages?limit=50`, {
              headers: { Authorization: `Bearer ${t}` },
            }),
          ]);
          const partData = await partRes.json();
          const msgData2 = await msgRes.json();
          if (partData.success) setParticipants(partData.data.participants);
          if (msgData2.success) setMessages(msgData2.data.messages);
        } catch {}
      }, 3000);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const cleanup = async () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      if (user && roomId) {
        const token = await user.getIdToken();
        await fetch(`/api/study-rooms/${roomId}/participants`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
  };

  const handleSendMessage = async (content) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/study-rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data.message]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleLeave = () => {
    router.push("/study-rooms");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Joining room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/study-rooms")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <StudyRoom
      room={room}
      currentUserId={user.uid}
      onLeave={handleLeave}
      onSendMessage={handleSendMessage}
      messages={messages}
      participants={participants}
    />
  );
};

export default StudyRoomPage;
