"use client";

import React from "react";
import FaceRecognizer from "../components/BlinkFaceDetector";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      
      <FaceRecognizer />
    </div>
  );
}
