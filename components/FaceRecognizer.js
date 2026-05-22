"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useLabels from "@/components/useLabels"; // MongoDB hook
import { recordAttendance } from "@/services/attendanceService";
import { analytics } from "@/lib/firebaseConfig";
import { logEvent } from "firebase/analytics";

const MIN_CONFIDENCE_TO_RECORD = 60;

export default function FaceRecognizer({ authUser }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { labels: fetchedLabels, loading: labelsLoading, error } = useLabels(authUser);

  const [message, setMessage] = useState("Loading models...");
  const [finished, setFinished] = useState(false);
  const [detectedPerson, setDetectedPerson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confidence, setConfidence] = useState(0);
  const [attendanceState, setAttendanceState] = useState("idle");

  const MODEL_URL = "/models";

  // Use labels directly from MongoDB with full image URL
  const labels = fetchedLabels;

  const handleRetry = async () => {
    try {
      // Try accessing the camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsLoading(false);
          runDetection();
        };
      }
      setMessage("Camera access granted ✅");
      setFinished(false);
      setAttendanceState("idle");
    } catch (err) {
      // Handle permanent denial gracefully
      if (err.name === "NotAllowedError") {
        setMessage(
          "Camera access is blocked! To enable it:\n1. Open your browser settings.\n2. Go to 'Site Settings'.\n3. Find 'Camera' permissions.\n4. Allow access for this site."
        );
        setFinished(true);
      } else {
        setMessage("Cannot access camera ❌");
        setFinished(true);
      }
    }
  };

  useEffect(() => {
    let stream;
    let detectionInterval;

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setMessage("Models loaded ✅ Starting webcam...");
        startVideo();
      } catch (err) {
        console.error("Model load error:", err);
        setMessage(
          "Failed to load models. Please check your network connection."
        );
        setIsLoading(false);
        setFinished(true);
      }
    };

    const startVideo = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsLoading(false);
            setMessage("Camera active. Looking for faces...");
            runDetection(); // Start recognition loop
          };
        }
      } catch (err) {
        console.error("Webcam error:", err);
        if (err.name === "NotAllowedError") {
          setMessage(
            `Camera access is blocked! To enable it: \n 1. Open your browser settings.\n2. Go to 'Site Settings'.\n3. Find 'Camera' permissions.\n4. Allow access for this site.`
          );
        } else {
          setMessage("Cannot access webcam ❌. Please try again.");
        }
        setFinished(true);
        setIsLoading(false);
      }
    };

    if (!labelsLoading && !error && labels.length > 0) loadModels();

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
    // Only run when labels have loaded
  }, [labelsLoading, error]);

  const runDetection = async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !labels ||
      labels.length === 0
    )
      return;

    const labeledFaceDescriptors = (
      await Promise.all(
        labels.map(async (student) => {
          try {
            const img = await faceapi.fetchImage(student.image); // full URL from MongoDB
            const detection = await faceapi
              .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (detection) {
              return new faceapi.LabeledFaceDescriptors(student.name, [
                detection.descriptor,
              ]);
            }
          } catch {
            console.warn(`Image not found: ${student.name}`);
          }
          return null;
        })
      )
    ).filter(Boolean);

    if (!labeledFaceDescriptors.length) {
      setMessage("No labeled faces found ❌");
      setFinished(true);
      return;
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const displaySize = {
      width: video.videoWidth || 720,
      height: video.videoHeight || 500,
    };
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (resizedDetections.length > 0) {
      const face = resizedDetections[0];
      const bestMatch = faceMatcher.findBestMatch(face.descriptor);
      const label = bestMatch.label === "unknown" ? "Unknown" : bestMatch.label;
      const confidenceScore = Math.round((1 - bestMatch.distance) * 100);

      const box = face.detection.box;
      ctx.strokeStyle = label !== "Unknown" ? "#10b981" : "#ef4444";
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = label !== "Unknown" ? "#10b981" : "#ef4444";
      ctx.fillRect(box.x, box.y - 30, box.width, 30);

      ctx.fillStyle = "white";
      ctx.font = "16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `${label} (${confidenceScore}%)`,
        box.x + box.width / 2,
        box.y - 8
      );
 
      setMessage(`Detected: ${label}`);
      setConfidence(confidenceScore);

      if (label !== "Unknown") {
        const person = labels.find((l) => l.name === label);
        setDetectedPerson(person || null);
      } else {
        setDetectedPerson(null);
      }
    } else {
      setMessage("No face detected");
      setDetectedPerson(null);
      setConfidence(0);
    }

    setFinished(true);
  };

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, "page_view", { page: "attendance" });
    }
  }, []);

  useEffect(() => {
    const persistAttendance = async () => {
      if (!finished || !detectedPerson || !authUser?.uid) {
        return;
      }

      if (confidence < MIN_CONFIDENCE_TO_RECORD) {
        setAttendanceState("low-confidence");
        return;
      }

      const detectedEmail = detectedPerson.email?.trim().toLowerCase();
      const userEmail = authUser.email?.trim().toLowerCase();

      if (detectedEmail && userEmail && detectedEmail !== userEmail) {
        setAttendanceState("mismatch");
        setMessage("Face recognized but does not match your signed-in account.");
        return;
      }

      setAttendanceState("saving");

      try {
        const result = await recordAttendance({
          userId: authUser.uid,
          studentName: detectedPerson.name,
          email: detectedPerson.email || authUser.email,
          confidenceScore: confidence,
        });

        setAttendanceState(result.alreadyRecorded ? "already-recorded" : "saved");
      } catch (err) {
        console.error("Attendance save error:", err);
        setAttendanceState("error");
        setMessage(err.message || "Could not save attendance. Please try again.");
      }
    };

    persistAttendance();
  }, [authUser, confidence, detectedPerson, finished]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-start py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Header & Register Button */}
      <div className="text-center mb-12 space-y-6 relative z-10">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl">
            Face Recognition
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full shadow-lg shadow-purple-500/50"></div>
        </div>
        <p className="text-xl text-gray-300 font-light tracking-wide">
          Smart Attendance System
        </p>

        {/* <Link href="/register">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-10 py-4 rounded-2xl shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-500 transform hover:scale-105 border border-purple-400/30 backdrop-blur-sm">
            <span className="flex items-center gap-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Register New Face
            </span>
          </Button>
        </Link> */}
      </div>

      <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-xl bg-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 rounded-3xl"></div>
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-full object-cover rounded-3xl relative z-10"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none rounded-3xl z-10" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-3xl z-30">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-white font-medium">Initializing Camera...</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl mt-8 relative z-10">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse"></div>
            <p className="text-white font-semibold text-lg">{message}</p>
          </div>

          {confidence > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Confidence Level</span>
                <span className="font-bold text-purple-400">{confidence}%</span>
              </div>
              <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out shadow-lg shadow-purple-500/50"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {detectedPerson && (
        <div className="w-full max-w-lg mt-10 bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 space-y-6 relative z-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/25">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Recognition Successful!
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
              <span className="font-medium text-gray-300 uppercase tracking-wide text-sm">
                Name
              </span>
              <span className="font-bold text-white text-lg">
                {detectedPerson.name}
              </span>
            </div>

            {detectedPerson.rollNo && (
              <div className="flex justify-between items-center bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                <span className="font-medium text-gray-300 uppercase tracking-wide text-sm">
                  Roll No
                </span>
                <span className="font-bold text-white">
                  {detectedPerson.rollNo}
                </span>
              </div>
            )}

            {detectedPerson.email && (
              <div className="flex justify-between items-center bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                <span className="font-medium text-gray-300 uppercase tracking-wide text-sm">
                  Email
                </span>
                <span className="font-bold text-white break-all text-sm">
                  {detectedPerson.email}
                </span>
              </div>
            )}
          </div>

          {attendanceState === "saved" && (
            <p className="text-center text-sm font-medium text-emerald-300">
              Attendance recorded for today.
            </p>
          )}
          {attendanceState === "already-recorded" && (
            <p className="text-center text-sm font-medium text-amber-300">
              You have already checked in today.
            </p>
          )}
        </div>
      )}

      {finished && (
        <Button
          onClick={handleRetry}
          className="mt-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-12 py-4 rounded-2xl shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-500 transform hover:scale-105 border border-blue-400/30 backdrop-blur-sm relative z-10"
        >
          <span className="flex items-center gap-3">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Scan Again
          </span>
        </Button>
      )}
    </div>
  );
}
