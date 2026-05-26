"use client";

import { useParams } from "next/navigation";
import ShareButton from "@/components/ui/ShareButton";

export default function ActivityGame() {
  const params = useParams();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-4">
        <h1 className="text-5xl font-bold">
          Activity {params.id}
        </h1>

        <p className="text-gray-400 text-lg">
          Game/Quiz UI coming soon 🚀
        </p>

        <div className="mt-4">
          <ShareButton />
        </div>
      </div>
    </div>
  );
}