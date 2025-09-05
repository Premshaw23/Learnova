"use client";

import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";

export default function FaceRecognizer() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("Loading models...");
  const [finished, setFinished] = useState(false);

  const MODEL_URL = "/models"; // models folder in public
  const labels = ["prem", "rohit","pranav","prashant"]; // add more names here

  const handleRetry = () => {
    setFinished(false);
    setMessage("Retrying detection...");
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
    if (!videoRef.current || !canvasRef.current) return;

    const labeledFaceDescriptors = (
      await Promise.all(
        labels.map(async (label) => {
          const descriptors = [];
          for (let i = 1; i <= 2; i++) {
            try {
              const img = await faceapi.fetchImage(`/labels/${label}/${i}.jpg`);
              const detection = await faceapi
                .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
              if (detection) descriptors.push(detection.descriptor);
            } catch {
              console.warn(`Image not found: ${label}/${i}.jpg`);
            }
          }
          if (descriptors.length > 0)
            return new faceapi.LabeledFaceDescriptors(label, descriptors);
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
    } else {
      setMessage("No face detected ❌");
    }

    setFinished(true);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="text-5xl sm:text-4xl font-bold text-blue-700 mb-8">
          Face Recognition
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
    </>
  );
}
