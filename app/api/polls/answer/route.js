import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { requireAuth } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";
import { publishEvent } from "@/lib/ssePublisher";

export async function POST(request) {
  try {
    const token = await requireAuth(request);

    if (token.role !== "student") {
      return NextResponse.json(
        { success: false, error: "Only students can answer polls" },
        { status: 403 }
      );
    }

    const { pollId, answerIndex } = await request.json();

    if (!pollId || answerIndex === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const pollRef = db.collection("polls").doc(pollId);
    const answerRef = pollRef.collection("answers").doc(token.uid);
    const userRef = db.collection("users").doc(token.uid);

    let isCorrect = false;
    let xpEarned = 0;

    await db.runTransaction(async (transaction) => {
      const pollDoc = await transaction.get(pollRef);
      if (!pollDoc.exists || !pollDoc.data().isActive) {
        throw new Error("Poll is no longer active");
      }

      const answerDoc = await transaction.get(answerRef);
      if (answerDoc.exists) {
        throw new Error("You have already answered this poll");
      }

      const pollData = pollDoc.data();
      isCorrect = answerIndex === pollData.correctAnswerIndex;
      xpEarned = isCorrect ? pollData.xpReward || 10 : 0;

      // Update Poll Stats
      transaction.update(pollRef, {
        totalResponses: (pollData.totalResponses || 0) + 1,
        correctResponses:
          (pollData.correctResponses || 0) + (isCorrect ? 1 : 0),
      });

      // Record Answer
      transaction.set(answerRef, {
        answerIndex,
        isCorrect,
        timestamp: new Date(),
      });

      // Award XP
      if (xpEarned > 0) {
        const userDoc = await transaction.get(userRef);
        const currentXp = userDoc.exists ? userDoc.data().xp || 0 : 0;
        transaction.update(userRef, { xp: currentXp + xpEarned });
      }
    });

    // Broadcast vote update to active stream
    await publishEvent("polls", "POLL_VOTED", {
      pollId,
      answerIndex,
      isCorrect,
    });

    return NextResponse.json({
      success: true,
      isCorrect,
      xpEarned,
      message: "Answer submitted successfully",
    });
  } catch (error) {
    console.error("Submit Poll Answer Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
