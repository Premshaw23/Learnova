"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FaceRecognizer({ labels }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("Loading models...");
  const [finished, setFinished] = useState(false);
  const [detectedPerson, setDetectedPerson] = useState(null);

  const MODEL_URL = "/models";

  const handleRetry = () => {
    setFinished(false);
    setMessage("Retrying detection...");
    setDetectedPerson(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    runDetection();
  };

  useEffect(() => {
    let stream;
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setMessage("Models loaded ✅ Starting webcam...");
      startVideo();
    };

    const startVideo = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            runDetection();
          };
        }
      } catch (err) {
        console.error("Webcam error:", err);
        setMessage("Cannot access webcam ❌");
        setFinished(true);
      }
    };

    loadModels();

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

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
          const descriptors = [];
          for (let i = 0; i < 1; i++) {
            try {
              const img = await faceapi.fetchImage(
                `/labels/${student.name}/${student.images[i]}`
              );
              const detection = await faceapi
                .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
              if (detection) descriptors.push(detection.descriptor);
            } catch {
              console.warn(
                `Image not found: ${student.name}/${student.images[i]}`
              );
            }
          }
          if (descriptors.length > 0)
            return new faceapi.LabeledFaceDescriptors(
              student.name,
              descriptors
            );
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

      new faceapi.draw.DrawBox(face.detection.box, {
        label: `${label} (${Math.round((1 - bestMatch.distance) * 100)}%)`,
      }).draw(canvas);

      setMessage(`Detected: ${label}`);

      if (label !== "Unknown") {
        const person = labels.find((l) => l.name === label);
        setDetectedPerson(person || null);
      } else {
        setDetectedPerson(null);
      }
    } else {
      setMessage("No face detected ❌");
      setDetectedPerson(null);
    }

    setFinished(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Link href="/register">
              <Button
                variant="default"
                className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-slate-50 text-slate-700 font-medium px-6 py-2.5 shadow-sm"
              >
                Go to Register
              </Button>
            </Link>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 mb-2 text-balance">
            Face Recognition
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 font-medium">
            Attendance System
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Video Container */}
          <div className="relative mb-8">
            <div className="relative w-full max-w-3xl mx-auto aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />

              {/* Overlay gradient for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-lg font-medium text-slate-700 dark:text-slate-200">
                {message}
              </span>
            </div>
          </div>

          {/* Detected Person Card */}
          {detectedPerson && (
            <div className="max-w-md mx-auto mb-6">
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                    Person Detected
                  </h3>

                  <div className="space-y-3 text-left">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Name
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {detectedPerson.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Roll No
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {detectedPerson.rollNo}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Email
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {detectedPerson.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Retry Button */}
          {finished && (
            <div className="text-center">
              <Button
                onClick={handleRetry}
                className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 text-lg font-medium shadow-lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
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
                Retry Detection
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
