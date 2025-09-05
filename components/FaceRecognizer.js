"use client";

import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FaceRecognizer({ labels }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("Loading models...");
  const [finished, setFinished] = useState(false);
  const [detectedPerson, setDetectedPerson] = useState(null); // <-- add this

  const MODEL_URL = "/models"; // models folder in public

  const handleRetry = () => {
    setFinished(false);
    setMessage("Retrying detection...");
    setDetectedPerson(null); // clear previous detected person
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

      // Set the full detected person's details
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
    <div className="flex flex-col items-center justify-center mt-10 px-4">
      <Link href="/register">
        <Button
          variant="default"
          className="mb-3 px-8 sm:px-10 py-3 sm:py-4 text-lg font-semibold shadow-md cursor-pointer"
        >
          Go to Register
        </Button>
      </Link>
      <h1 className="text-5xl sm:text-4xl font-bold text-blue-500 mb-8">
        Face Recognition Attendance
      </h1>

      <div className="relative w-[90vw] max-w-[720px] max-h-[500px] aspect-video border-2 border-blue-700 rounded-2xl shadow-2xl bg-transparent backdrop-blur-2xl">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-full rounded-2xl object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full rounded-2xl"
        />
      </div>

      <div className="mt-6 text-xl sm:text-2xl font-bold text-blue-400 text-center drop-shadow-lg">
        {message}
      </div>

      {detectedPerson && (
        <div className="mt-4 text-lg sm:text-xl text-blue-600 text-center">
          <p>
            <strong>Name:</strong> {detectedPerson.name}
          </p>
          <p>
            <strong>Roll No:</strong> {detectedPerson.rollNo}
          </p>
          <p>
            <strong>Email:</strong> {detectedPerson.email}
          </p>
        </div>
      )}

      {finished && (
        <Button
          variant="default"
          className="mt-6 px-8 sm:px-10 py-3 sm:py-4 text-lg font-semibold shadow-md"
          onClick={handleRetry}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
