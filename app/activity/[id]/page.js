"use client";

import { useParams } from "next/navigation";

export default function ActivityGame() {
  const params = useParams();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">
          Activity {params.id}
        </h1>

        <p className="text-gray-400 text-lg">
          Game/Quiz UI coming soon 🚀
        </p>
      </div>
    </div>
  );
}