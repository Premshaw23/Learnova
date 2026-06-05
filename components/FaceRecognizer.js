"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import useLabels from "@/components/useLabels";
import { recordAttendance } from "@/services/attendanceService";
import { analytics } from "@/lib/firebaseConfig";
import { logEvent } from "firebase/analytics";
import { syncAttendanceQueue } from "@/lib/syncService";

// ============================================================================
// ⚙️ ADVANCED CONFIGURATION & TUNING CONSTANTS
// ============================================================================
const MIN_CONFIDENCE_TO_RECORD = 60;
const EAR_THRESHOLD = 0.25;
const BLINK_COOLDOWN_MS = 300;
const WORKER_PROCESSING_INTERVAL_MS = 80; // Pushed to ~12 FPS for smoother tracking
const FPS_SAMPLE_SIZE = 30;

/**
 * ============================================================================
 * 📸 HIGH-PERFORMANCE FACE RECOGNIZER COMPONENT (v2.0)
 * ============================================================================
 * Architected to offload ML operations to a dedicated Web Worker while
 * maintaining an ultra-premium, 60fps UI with advanced diagnostics,
 * military-grade scanning overlays, and robust connection handling.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.authUser - The currently authenticated Firebase user.
 * @returns {React.ReactElement} The webcam face recognition interface.
 */
export default function FaceRecognizer({ authUser }) {
  // ============================================================================
  // 🧱 CORE REFS & SYSTEM STATE
  // ============================================================================
  const isMounted = useRef(true);
  const activeStreamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // 🧠 Web Worker Bridge Refs
  const workerRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const offscreenCtxRef = useRef(null);

  // ⏱️ Animation, Tracking, and Metrics Refs
  const animationFrameId = useRef(null);
  const lastWorkerMessageTime = useRef(0);
  const frameTimesRef = useRef([]);
  const workerLatencyRef = useRef(0);
  
  const blinkStateRef = useRef({
    isEyeClosed: false,
    blinkCount: 0,
    requiredBlinks: 2,
    lastBlinkTime: 0,
  });

  // ============================================================================
  // 🗃️ DATA & UI STATE
  // ============================================================================
  const {
    labels: fetchedLabels,
    loading: labelsLoading,
    error: labelsError,
  } = useLabels(authUser);

  const [message, setMessage] = useState("Initializing core systems...");
  const [finished, setFinished] = useState(false);
  const [detectedPerson, setDetectedPerson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confidence, setConfidence] = useState(0);
  const [attendanceState, setAttendanceState] = useState("idle");

  // Liveness State Machine: IDLE -> DETECTING_FACE -> VERIFYING_LIVENESS -> AUTHENTICATED | FAILED
  const [livenessState, setLivenessState] = useState("IDLE");
  const [blinkPrompt, setBlinkPrompt] = useState("");
  const [facingMode, setFacingMode] = useState("user");
  
  // Advanced Diagnostics State
  const [metrics, setMetrics] = useState({ fps: 0, latency: 0 });
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const [isOffline, setIsOffline] = useState(
    typeof window !== "undefined" ? !navigator.onLine : false,
  );

  const labels = fetchedLabels;

  // ============================================================================
  // 🌐 NETWORK CONNECTIVITY LISTENER
  // ============================================================================
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      if (!isMounted.current) return;
      setIsOffline(false);
      syncAttendanceQueue();
    };

    const handleOffline = () => {
      if (!isMounted.current) return;
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ============================================================================
  // 🧠 WEB WORKER INITIALIZATION & EVENT BUS
  // ============================================================================
  useEffect(() => {
    if (!labelsLoading && !labelsError && labels.length > 0) {
      initWebWorker();
    }
  }, [labelsLoading, labelsError, labels]);

  const initWebWorker = useCallback(() => {
    if (typeof window === "undefined" || workerRef.current) return;

    try {
      setMessage("Spawning ML Web Worker Thread...");
      // Initialize the worker. Ensure faceWorker.js is in the public/worker directory.
      const worker = new Worker('/worker/faceWorker.js');
      workerRef.current = worker;

      worker.onmessage = (event) => {
        if (!isMounted.current) return;
        const { type, message: workerMsg, payload, error: workerErr } = event.data;

        switch (type) {
          case 'STATUS':
            setMessage(workerMsg);
            break;
          case 'INIT_SUCCESS':
            setMessage("ML Engine Ready ✅ Synchronizing optics...");
            startVideo();
            break;
          case 'ERROR':
            console.error("Fatal Worker Error:", workerErr);
            setMessage("Background AI engine failed to initialize safely.");
            setIsLoading(false);
            setFinished(true);
            break;
          case 'DETECTION_RESULT':
            handleWorkerDetection(payload);
            break;
          default:
            console.warn("Unhandled worker message type:", type);
            break;
        }
      };

      // Dispatch the initialization payload containing the user labels
      worker.postMessage({
        type: 'INIT',
        payload: { labels: labels }
      });

    } catch (err) {
      console.error("Failed to spawn Web Worker infrastructure", err);
      setMessage("Critical failure: Cannot initialize background processing.");
      setIsLoading(false);
    }
  }, [labels]);

  // ============================================================================
  // 🧮 WORKER RESULT PROCESSING & UI UPDATES
  // ============================================================================
  const handleWorkerDetection = useCallback((result) => {
    if (!isMounted.current || finished || abortControllerRef.current?.signal.aborted) return;

    // Calculate worker latency for diagnostics
    const now = performance.now();
    workerLatencyRef.current = Math.round(now - lastWorkerMessageTime.current);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (ctx && canvas) {
      // Clear previous frame drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result.hasFace && result.box) {
        const { label, confidenceScore, box, ear } = result;

        // --- Render Advanced Bounding Box ---
        const isMatch = label !== "Unknown" && label !== "unknown";
        const strokeColor = isMatch ? "#10b981" : "#ef4444";
        const fillColor = isMatch ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)";
        
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        
        // Draw corners instead of a full box for a modern HUD look
        const cornerLength = 20;
        ctx.beginPath();
        // Top Left
        ctx.moveTo(box.x, box.y + cornerLength);
        ctx.lineTo(box.x, box.y);
        ctx.lineTo(box.x + cornerLength, box.y);
        // Top Right
        ctx.moveTo(box.x + box.width - cornerLength, box.y);
        ctx.lineTo(box.x + box.width, box.y);
        ctx.lineTo(box.x + box.width, box.y + cornerLength);
        // Bottom Right
        ctx.moveTo(box.x + box.width, box.y + box.height - cornerLength);
        ctx.lineTo(box.x + box.width, box.y + box.height);
        ctx.lineTo(box.x + box.width - cornerLength, box.y + box.height);
        // Bottom Left
        ctx.moveTo(box.x + cornerLength, box.y + box.height);
        ctx.lineTo(box.x, box.y + box.height);
        ctx.lineTo(box.x, box.y + box.height - cornerLength);
        ctx.stroke();

        // Fill subtle background
        ctx.fillStyle = fillColor;
        ctx.fillRect(box.x, box.y, box.width, box.height);

        // Draw Label Tab
        ctx.fillStyle = strokeColor;
        ctx.fillRect(box.x, box.y - 35, box.width, 35);
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          `${isMatch ? label : "Unknown"} (${confidenceScore}%)`,
          box.x + box.width / 2,
          box.y - 12,
        );

        setConfidence(confidenceScore);

        // --- Execute Liveness State Machine ---
        if (isMatch && confidenceScore >= MIN_CONFIDENCE_TO_RECORD) {
          const person = labels.find((l) => l.name === label);
          setDetectedPerson(person || null);

          setLivenessState((prevState) => {
            if (prevState === "DETECTING_FACE" || prevState === "IDLE") {
              setMessage(`Recognized: ${label}. Engaging liveness check...`);
              setBlinkPrompt(`Please blink ${blinkStateRef.current.requiredBlinks} time(s) naturally.`);
              return "VERIFYING_LIVENESS";
            }

            if (prevState === "VERIFYING_LIVENESS") {
              if (ear < EAR_THRESHOLD) {
                blinkStateRef.current.isEyeClosed = true;
              } else {
                if (blinkStateRef.current.isEyeClosed) {
                  blinkStateRef.current.isEyeClosed = false;
                  const blinkTime = Date.now();

                  if (blinkTime - blinkStateRef.current.lastBlinkTime > BLINK_COOLDOWN_MS) {
                    blinkStateRef.current.blinkCount += 1;
                    blinkStateRef.current.lastBlinkTime = blinkTime;

                    const remaining = blinkStateRef.current.requiredBlinks - blinkStateRef.current.blinkCount;
                    if (remaining > 0) {
                      setBlinkPrompt(`Blink detected! ${remaining} more to go.`);
                    } else {
                      setMessage("Liveness verified. Secure authentication successful.");
                      setBlinkPrompt("Success!");
                      setFinished(true);
                      return "AUTHENTICATED";
                    }
                  }
                }
              }
            }
            return prevState;
          });
        } else {
          setDetectedPerson(null);
          if (livenessState !== "AUTHENTICATED") {
            setMessage("Subject not recognized.");
            setLivenessState("DETECTING_FACE");
          }
        }
      } else {
        // No face detected in this frame
        if (livenessState !== "AUTHENTICATED") {
          setMessage("No face detected in frame.");
          setLivenessState("DETECTING_FACE");
        }
        setDetectedPerson(null);
        setConfidence(0);
      }
    }

    // Trigger next capture sequence
    if (isMounted.current && !finished) {
      animationFrameId.current = requestAnimationFrame(captureAndSendFrame);
    }
  }, [finished, labels, livenessState]);

  // ============================================================================
  // 🎥 CAMERA STREAM MANAGEMENT & FRAME CAPTURE
  // ============================================================================
  const startVideo = async () => {
    try {
      if (!isMounted.current || abortControllerRef.current.signal.aborted) return;
      setMessage("Requesting optic sensor permissions...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });

      if (!isMounted.current || abortControllerRef.current.signal.aborted) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      activeStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (!isMounted.current || abortControllerRef.current.signal.aborted) return;
          videoRef.current.play().catch((e) => console.warn("Video play interrupted", e));
          
          setIsLoading(false);
          setMessage("Scanning environment for faces...");
          setLivenessState("DETECTING_FACE");

          blinkStateRef.current.requiredBlinks = Math.floor(Math.random() * 2) + 1;
          
          // Setup Offscreen Canvas for background worker drawing
          const video = videoRef.current;
          const rect = video.getBoundingClientRect();
          const displaySize = {
            width: rect.width || video.videoWidth || 720,
            height: rect.height || video.videoHeight || 500,
          };

          if (canvasRef.current) {
            canvasRef.current.width = displaySize.width;
            canvasRef.current.height = displaySize.height;
          }

          // Fallback to standard canvas if OffscreenCanvas is unavailable
          if (typeof OffscreenCanvas !== 'undefined') {
            offscreenCanvasRef.current = new OffscreenCanvas(displaySize.width, displaySize.height);
          } else {
            offscreenCanvasRef.current = document.createElement('canvas');
            offscreenCanvasRef.current.width = displaySize.width;
            offscreenCanvasRef.current.height = displaySize.height;
          }
          
          offscreenCtxRef.current = offscreenCanvasRef.current.getContext('2d', { willReadFrequently: true });

          captureAndSendFrame();
          calculateMetrics(); // Start diagnostic loop
        };
      }
    } catch (err) {
      if (!isMounted.current) return;
      setIsLoading(false);
      if (err.name === "NotAllowedError" || err.message?.includes("Permission denied")) {
        setMessage("Camera access denied. Please verify browser permissions.");
      } else {
        setMessage("Critical Error: Cannot access camera hardware ❌");
      }
      setFinished(true);
    }
  };

  const captureAndSendFrame = useCallback(() => {
    if (!videoRef.current || !workerRef.current || finished || !isMounted.current) return;

    const video = videoRef.current;
    if (video.paused || video.ended || !video.videoWidth) {
      animationFrameId.current = requestAnimationFrame(captureAndSendFrame);
      return;
    }

    const now = performance.now();
    if (now - lastWorkerMessageTime.current < WORKER_PROCESSING_INTERVAL_MS) {
      animationFrameId.current = requestAnimationFrame(captureAndSendFrame);
      return;
    }

    // Track FPS metrics
    frameTimesRef.current.push(now);
    if (frameTimesRef.current.length > FPS_SAMPLE_SIZE) {
      frameTimesRef.current.shift();
    }

    lastWorkerMessageTime.current = now;

    const ctx = offscreenCtxRef.current;
    const canvas = offscreenCanvasRef.current;

    if (ctx && canvas) {
      // Paint video frame to the offscreen canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Extract raw pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Dispatch non-blocking payload to Web Worker
      workerRef.current.postMessage({
        type: 'PROCESS_FRAME',
        payload: {
          imageData: imageData,
          displaySize: { width: canvas.width, height: canvas.height }
        }
      });
    }
  }, [finished]);

  // Periodic FPS calculation for diagnostics
  const calculateMetrics = () => {
    if (!isMounted.current || finished) return;
    
    if (frameTimesRef.current.length >= 2) {
      const first = frameTimesRef.current[0];
      const last = frameTimesRef.current[frameTimesRef.current.length - 1];
      const currentFps = Math.round(1000 / ((last - first) / frameTimesRef.current.length));
      
      setMetrics({
        fps: currentFps,
        latency: workerLatencyRef.current
      });
    }

    setTimeout(calculateMetrics, 1000);
  };

  // ============================================================================
  // ♻️ LIFECYCLE & CLEANUP MANAGEMENT
  // ============================================================================
  useEffect(() => {
    isMounted.current = true;
    abortControllerRef.current = new AbortController();

    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => t.stop());
        activeStreamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [facingMode]);

  // ============================================================================
  // 💾 ATTENDANCE PERSISTENCE PROTOCOL
  // ============================================================================
  useEffect(() => {
    const persistAttendance = async () => {
      if (!finished || !detectedPerson || !authUser?.uid || livenessState !== "AUTHENTICATED") return;
      if (isSubmittingRef.current || !isMounted.current) return;

      if (confidence < MIN_CONFIDENCE_TO_RECORD) {
        setAttendanceState("low-confidence");
        return;
      }

      const detectedEmail = detectedPerson.email?.trim().toLowerCase();
      const userEmail = authUser.email?.trim().toLowerCase();

      if (detectedEmail && userEmail && detectedEmail !== userEmail) {
        setAttendanceState("mismatch");
        setMessage("Security Alert: Face does not match signed-in account credentials.");
        return;
      }
      
      isSubmittingRef.current = true;
      setAttendanceState("saving");

      try {
        const result = await recordAttendance({
          userId: authUser.uid,
          studentName: detectedPerson.name,
          email: detectedPerson.email || authUser.email,
          confidenceScore: confidence,
        });

        if (!isMounted.current) return;

        if (result.queuedOffline) {
          setAttendanceState("queued-offline");
          setMessage("Data cached offline. Awaiting network sync sequence... ✅");
        } else {
          setAttendanceState(result.alreadyRecorded ? "already-recorded" : "saved");
        }
      } catch (err) {
        if (!isMounted.current) return;
        setAttendanceState("error");
        setMessage(err.message || "Network Error: Could not save attendance record.");
      }
    };

    persistAttendance();
  }, [authUser, confidence, detectedPerson, finished, livenessState]);

  // Analytics logging
  useEffect(() => {
    if (analytics) {
      try {
        logEvent(analytics, "page_view", { page: "attendance_worker_v2" });
      } catch (err) {
        console.warn("Analytics telemetry failed:", err);
      }
    }
  }, []);

  // ============================================================================
  // 🎮 UI EVENT HANDLERS
  // ============================================================================
  const handleRetry = async () => {
    isSubmittingRef.current = false;
    setFinished(false);
    setAttendanceState("idle");
    setLivenessState("IDLE");
    startVideo();
  };

  const handleCameraToggle = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const toggleDiagnostics = () => {
    setShowDiagnostics(prev => !prev);
  };

  // ============================================================================
  // 🎨 RENDER ENGINE
  // ============================================================================
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-emerald-900/10 blur-[100px]" />
      </div>

      {/* Offline Mode Banner */}
      {isOffline && (
        <div className="w-full max-w-4xl mb-6 bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between shadow-[0_0_40px_-10px_rgba(245,158,11,0.2)] animate-in fade-in slide-in-from-top-6 duration-500 relative z-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="font-bold text-amber-400 text-base tracking-wide">Offline Protocol Engaged</h4>
              <p className="text-sm text-amber-200/70 mt-1">
                Biometric scans will be encrypted locally to IndexedDB and synchronized automatically upon network restoration.
              </p>
            </div>
          </div>
          <span className="hidden sm:flex text-[11px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-full whitespace-nowrap">
            Local DB Queue
          </span>
        </div>
      )}

      {/* Main Viewfinder Container */}
      <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-2xl bg-zinc-900/50 z-10 transition-all duration-500 group">
        
        {/* Viewfinder Corner Accents */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-white/20 rounded-tl-lg pointer-events-none z-30 transition-all duration-300 group-hover:border-indigo-500/50" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-white/20 rounded-tr-lg pointer-events-none z-30 transition-all duration-300 group-hover:border-indigo-500/50" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-white/20 rounded-bl-lg pointer-events-none z-30 transition-all duration-300 group-hover:border-indigo-500/50" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-white/20 rounded-br-lg pointer-events-none z-30 transition-all duration-300 group-hover:border-indigo-500/50" />

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-[60vh] md:h-[70vh] object-cover relative z-10 scale-[1.02]"
        />

        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 object-cover"
        />

        {/* Liveness Radar UI overlay */}
        {livenessState === "VERIFYING_LIVENESS" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[2px] transition-all duration-500">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-80 h-80 border-[1px] border-indigo-400/30 rounded-full animate-ping" />
              <div className="absolute w-64 h-64 border-2 border-dashed border-indigo-400/60 rounded-full animate-[spin_6s_linear_infinite]" />
              <div className="absolute w-48 h-48 border-[1px] border-indigo-300/40 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
              <div className="absolute w-72 h-72 bg-gradient-to-tr from-black/60 to-transparent rounded-full backdrop-blur-md" />
              
              <div className="flex flex-col items-center justify-center z-40 space-y-4 px-8 text-center drop-shadow-2xl">
                <svg className="w-12 h-12 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <p className="text-xl font-black tracking-wide text-white animate-pulse">
                  {blinkPrompt}
                </p>
                <div className="flex gap-2 mt-2">
                  {[...Array(blinkStateRef.current.requiredBlinks)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-2 w-8 rounded-full transition-colors duration-300 ${
                        i < blinkStateRef.current.blinkCount ? 'bg-indigo-400' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Loading / Initializing Screen */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-xl z-40">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
              <div className="absolute inset-2 border-4 border-emerald-500/20 rounded-full" />
              <div className="absolute inset-2 border-4 border-emerald-500 rounded-full border-b-transparent animate-[spin_2s_linear_infinite_reverse]" />
            </div>
            <p className="text-white font-medium text-lg tracking-widest uppercase animate-pulse">
              {message}
            </p>
            <p className="text-zinc-500 text-sm mt-2 font-mono">Initializing Tensor Web Worker...</p>
          </div>
        )}

        {/* 🛠️ Advanced Diagnostics Overlay (Hidden by default) */}
        {showDiagnostics && !isLoading && (
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-3 z-50 font-mono text-[10px] text-emerald-400 tracking-wider space-y-1">
            <div className="flex justify-between gap-6">
              <span className="text-zinc-400">FPS:</span>
              <span className={metrics.fps >= 10 ? "text-emerald-400" : "text-amber-400"}>{metrics.fps}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-zinc-400">Worker Ping:</span>
              <span>{metrics.latency}ms</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-zinc-400">Thread:</span>
              <span className="text-indigo-400">Offloaded</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-zinc-400">State:</span>
              <span>{livenessState}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Status Dashboard */}
      <div className="w-full max-w-4xl mt-6 relative z-10">
        <div className="bg-zinc-900/60 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex items-center justify-center w-10 h-10">
              <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20" />
              <div className="w-3 h-3 bg-indigo-400 rounded-full" />
            </div>
            <div className="flex flex-col text-left">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">System Status</p>
              <p className="text-white font-medium text-base truncate">{message}</p>
            </div>
          </div>

          {confidence > 0 && (
            <div className="w-full md:w-64 space-y-2 shrink-0">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                <span>Confidence Match</span>
                <span className={confidence >= MIN_CONFIDENCE_TO_RECORD ? "text-emerald-400" : "text-amber-400"}>
                  {confidence}%
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    confidence >= MIN_CONFIDENCE_TO_RECORD 
                    ? "bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    : "bg-gradient-to-r from-amber-500 to-orange-400"
                  }`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Success Card */}
      {detectedPerson && livenessState === "AUTHENTICATED" && (
        <div className="w-full max-w-md mt-6 bg-zinc-900/80 backdrop-blur-3xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 p-8 relative z-20 animate-in zoom-in-95 duration-500 overflow-hidden">
          {/* Card background flare */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="text-center space-y-4 relative z-10">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-full h-full bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-300/50">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-500 tracking-tight">
                Identity Verified
              </h3>
              <p className="text-zinc-400 text-sm mt-1">Biometric liveness confirmed.</p>
            </div>
          </div>

          <div className="mt-8 space-y-3 relative z-10">
            <div className="flex flex-col bg-black/40 rounded-2xl p-4 border border-white/5 transition-colors hover:bg-black/60">
              <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px] mb-1">Subject Name</span>
              <span className="font-medium text-white text-lg">{detectedPerson.name}</span>
            </div>
            
            {detectedPerson.email && (
              <div className="flex flex-col bg-black/40 rounded-2xl p-4 border border-white/5 transition-colors hover:bg-black/60">
                <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px] mb-1">Registered Email</span>
                <span className="font-medium text-zinc-300 text-sm break-all">{detectedPerson.email}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
            {attendanceState === "saved" && (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-sm">Attendance successfully recorded.</span>
              </div>
            )}
            {attendanceState === "already-recorded" && (
              <div className="flex items-center justify-center gap-2 text-amber-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-sm">Session already logged for today.</span>
              </div>
            )}
            {attendanceState === "queued-offline" && (
              <div className="flex items-center justify-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                <svg className="w-6 h-6 text-indigo-400 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <div className="text-left">
                  <p className="text-indigo-300 font-bold text-sm">Offline Cache Active</p>
                  <p className="text-xs text-indigo-200/70">Will auto-sync on reconnection.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control Buttons Footer */}
      <div className="w-full max-w-4xl mt-8 flex flex-wrap items-center justify-center gap-4 relative z-10">
        <button
          onClick={handleCameraToggle}
          aria-label="Switch camera"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-800/50 px-6 py-4 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-zinc-700/50 hover:border-white/20 active:scale-95 shadow-lg"
        >
          <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {facingMode === "user" ? "Switch to Rear Camera" : "Switch to Front Camera"}
        </button>

        <button
          onClick={toggleDiagnostics}
          aria-label="Toggle Diagnostics"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-800/50 px-6 py-4 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-zinc-700/50 hover:border-white/20 active:scale-95 shadow-lg"
        >
          <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          {showDiagnostics ? "Hide Dev Metrics" : "Show Dev Metrics"}
        </button>

        {finished && (
          <Button
            onClick={handleRetry}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-base px-10 py-7 rounded-xl shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:shadow-[0_10px_40px_rgba(79,70,229,0.6)] hover:-translate-y-1 transition-all duration-300 w-full md:w-auto"
          >
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Initiate New Scan
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}