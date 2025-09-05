"use client";
import { Navbar } from "@/components/Navbar";
import FaceRecognizer from "@/components/FaceRecognizer";
import useLabels from "@/components/useLabels";

const AttendancePage = () => {
  const { labels, loading, error } = useLabels();

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center mt-20">
          <div className="text-blue-500 text-xl">Loading labels...</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center mt-20">
          <div className="text-red-500 text-xl">Error loading labels!</div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <FaceRecognizer labels={labels} />
    </div>
  );
};

export default AttendancePage;
