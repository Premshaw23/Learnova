import { NextResponse } from "next/server";
import { calculateSRS } from "@/app/courses/[id]/engine";

export async function POST(req) {
  try {
    const { cardId, quality, currentStats } = await req.json();

    // currentStats would contain: repetitions, interval, easeFactor
    const updatedStats = calculateSRS(
      quality,
      currentStats.repetitions || 0,
      currentStats.interval || 0,
      currentStats.easeFactor || 2.5
    );

    return NextResponse.json({
      success: true,
      message: "Card scheduled for: " + updatedStats.nextReviewDate,
      ...updatedStats,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process review" },
      { status: 500 }
    );
  }
}
