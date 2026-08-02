import React, { useEffect, useRef } from "react";
import { useWebRTC } from "../../hooks/useWebRTC.js";
import { useAuth } from "@/hooks/useAuth";
import LivePollWidget from "./LivePollWidget";
import ActivePollWidget from "./ActivePollWidget";

/**
 * LiveRoom Component
 * Interactive Live Video Classroom component consuming useWebRTC hook.
 * Binds video elements to streams and ensures cleanup when leaving the classroom.
 */
export function LiveRoom({
  roomId = "classroom-101",
  roomTitle = "Live Lecture",
}) {
  const { isConnected, localStream, remoteStream, error, cleanupWebRTC } =
    useWebRTC(roomId);
  const { userProfile } = useAuth();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="live-room-container p-6 bg-gray-900 text-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{roomTitle}</h1>
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-sm font-medium">
            {isConnected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-800 text-red-100 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="video-card bg-gray-800 p-4 rounded-lg flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-2 text-gray-300">
            Your Video (Local)
          </h3>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-48 bg-black rounded object-cover"
          />
        </div>

        <div className="video-card bg-gray-800 p-4 rounded-lg flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-2 text-gray-300">
            Instructor / Remote Feed
          </h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-48 bg-black rounded object-cover"
          />
        </div>
      </div>

      <div className="mt-8">
        {userProfile?.role === "teacher" || userProfile?.role === "admin" ? (
          <LivePollWidget roomId={roomId} />
        ) : (
          <ActivePollWidget />
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={cleanupWebRTC}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors"
        >
          Leave Classroom
        </button>
      </div>
    </div>
  );
}

export default LiveRoom;
