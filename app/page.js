"use client";

import React from "react";
import useLabels from "../components/useLabels"; // path to your hook
import FaceRecognizer from "@/components/FaceRecognizer";

export default function FaceRecognitionPage() {
  const { labels, loading, error } = useLabels();

  if (loading) return <div>Loading labels...</div>;
  if (error) return <div>Error loading labels!</div>;
    
  return <FaceRecognizer labels={labels} />;
}

