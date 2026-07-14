"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { RefreshCw, Camera, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

export default function CameraSnapshot({ baselineDescriptor, onVerified, onVerificationFailed }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const activeStreamRef = useRef(null);
  const animationFrameId = useRef(null);
  const faceapiRef = useRef(null);
  const isMounted = useRef(true);

  const [message, setMessage] = useState("Initializing camera...");
  const [status, setStatus] = useState("initializing"); // initializing, active, matching, verified, failed
  const [attempts, setAttempts] = useState(0);

  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = async () => {
    setStatus("initializing");
    setMessage("Accessing camera...");
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      activeStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStatus("active");
        setMessage("Camera active. Align your face in the center.");
      }
    } catch (err) {
      console.error(err);
      setStatus("failed");
      setMessage("Camera access denied or unavailable. Please enable permissions.");
      onVerificationFailed?.("Camera access denied.");
    }
  };

  useEffect(() => {
    isMounted.current = true;
    startCamera();
    return () => {
      isMounted.current = false;
      stopCamera();
    };
  }, []);

  // Run the Face API comparison loop
  const performFaceVerification = async () => {
    if (!videoRef.current || !canvasRef.current || status === "verified") return;

    try {
      const faceapi = await import("face-api.js");
      faceapiRef.current = faceapi;

      // Load models if not already loaded
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

      setStatus("matching");
      setMessage("Scanning facial features...");

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
      faceapi.matchDimensions(canvas, displaySize);

      let matched = false;
      let checkCount = 0;

      const runCheck = async () => {
        if (!isMounted.current || matched || checkCount > 20) {
          if (checkCount > 20 && !matched) {
            setStatus("failed");
            setMessage("Biometric matching failed. Identity could not be verified.");
            onVerificationFailed?.("No matching face found.");
          }
          return;
        }

        checkCount++;
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const descriptor = detection.descriptor;

          if (baselineDescriptor && baselineDescriptor.length > 0) {
            // Compare 128-D descriptors using Euclidean distance
            const floatBaseline = new Float32Array(baselineDescriptor);
            const distance = faceapi.euclideanDistance(descriptor, floatBaseline);

            // Distance threshold (typically 0.6 is a standard match, smaller means more similar)
            const confidence = Math.max(0, Math.round((1 - distance) * 100));

            if (distance < 0.6) {
              matched = true;
              setStatus("verified");
              setMessage(`Verified! Identity Match: ${confidence}%`);
              onVerified?.(confidence);
              stopCamera();
              return;
            }
          }
        }

        // Run next check frame
        if (isMounted.current && !matched) {
          setTimeout(runCheck, 500);
        }
      };

      runCheck();
    } catch (err) {
      console.error(err);
      setStatus("failed");
      setMessage("Verification models failed to load. Please try again.");
      onVerificationFailed?.(err.message || "Model load failure.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl flex items-center justify-center">
        {status !== "verified" && (
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

        {/* Status Overlays */}
        {status === "initializing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm gap-2">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-sm font-semibold text-zinc-300">Initializing...</span>
          </div>
        )}

        {status === "verified" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/80 backdrop-blur-md gap-3 border border-emerald-500/50">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="text-lg font-bold text-emerald-400">Biometrics Verified</span>
          </div>
        )}
      </div>

      <div className="w-full text-center px-4">
        <p className={`text-sm font-semibold mb-4 transition-all duration-200 ${
          status === "verified"
            ? "text-emerald-400"
            : status === "failed"
            ? "text-red-400"
            : "text-zinc-400"
        }`}>
          {message}
        </p>

        <div className="flex justify-center gap-3">
          {status === "active" && (
            <button
              onClick={performFaceVerification}
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              Scan Face & Verify
            </button>
          )}

          {status === "failed" && (
            <button
              onClick={startCamera}
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition-all border border-zinc-700 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Verification
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
