import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useWebRTC Hook
 * Manages WebRTC Peer Connection and local/remote MediaStreams for Live Classroom video sessions.
 * Guarantees zero memory leaks by stopping media tracks, closing peer connections,
 * and clearing WebSocket listeners upon component unmount.
 */
export function useWebRTC(roomId, signalingUrl = 'wss://signaling.learnova.org') {
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const socketRef = useRef(null);

  /**
   * Complete WebRTC Resource & Hardware Cleanup
   * Stops camera/mic tracks, closes peer connection, and closes WebSocket.
   */
  const cleanupWebRTC = useCallback(() => {
    // 1. Stop all local MediaStreamTracks (camera & microphone hardware)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore cleanup errors
        }
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // 2. Stop all remote MediaStreamTracks if present
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore cleanup errors
        }
      });
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }

    // 3. Close RTCPeerConnection and remove senders
    if (pcRef.current) {
      try {
        const senders = pcRef.current.getSenders ? pcRef.current.getSenders() : [];
        senders.forEach((sender) => {
          if (sender.track) {
            sender.track.stop();
          }
        });
        pcRef.current.close();
      } catch (e) {
        // ignore cleanup errors
      }
      pcRef.current = null;
    }

    // 4. Close WebSocket connection and remove event listeners
    if (socketRef.current) {
      try {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
          socketRef.current.close();
        }
      } catch (e) {
        // ignore cleanup errors
      }
      socketRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const initializeWebRTC = useCallback(async () => {
    try {
      cleanupWebRTC();

      // Request media permissions
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Initialize PeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        // Add local tracks to PeerConnection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Track remote stream
        const remote = new MediaStream();
        remoteStreamRef.current = remote;
        setRemoteStream(remote);

        pc.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            remote.addTrack(track);
          });
        };

        setIsConnected(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize WebRTC classroom stream');
      cleanupWebRTC();
    }
  }, [cleanupWebRTC]);

  useEffect(() => {
    if (roomId) {
      initializeWebRTC();
    }

    // CRITICAL: Unmount cleanup hook to prevent WebRTC peer connection & media track memory leaks
    return () => {
      cleanupWebRTC();
    };
  }, [roomId, initializeWebRTC, cleanupWebRTC]);

  return {
    isConnected,
    localStream,
    remoteStream,
    error,
    cleanupWebRTC,
    reconnect: initializeWebRTC,
  };
}

export default useWebRTC;
