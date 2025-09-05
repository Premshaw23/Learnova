"use client";

import React from "react";
import Link from "next/link"; // Import Link
import useLabels from "../components/useLabels"; // path to your hook
import FaceRecognizer from "@/components/FaceRecognizer";
import { Button } from "@/components/ui/button";

export default function FaceRecognitionPage() {
  const { labels, loading, error } = useLabels();

  if (loading) return <div>Loading labels...</div>;
  if (error) return <div>Error loading labels!</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      {/* Register Button */}
      <Link href="/register">
        <Button
          variant="default"
          className="mb-3 px-8 sm:px-10 py-3 sm:py-4 text-lg font-semibold shadow-md cursor-pointer"
        >
          Go to Register
        </Button>
      </Link>
      <FaceRecognizer labels={labels} />

    </div>
  );
}
