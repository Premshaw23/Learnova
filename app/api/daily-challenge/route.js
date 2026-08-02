import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { withLock } from "@/lib/lockManager";

export const dynamic = "force-dynamic";

const CHALLENGES = [
  {
    id: "challenge_1",
    title: "Flashcard Sprint",
    description: "Answer 3 quick flashcards to refresh your memory.",
    xpReward: 20,
    type: "flashcard",
    duration: "3 mins"
  },
  {
    id: "challenge_2",
    title: "Code Snippet Review",
    description: "Identify the syntax error in a simple React component.",
    xpReward: 30,
    type: "code",
    duration: "5 mins"
  },
  {
    id: "challenge_3",
    title: "Video Recap",
    description: "Watch a 2-minute video summary of yesterday's lecture.",
    xpReward: 15,
    type: "video",
    duration: "2 mins"
  }
];

// Helper to deterministically get a challenge of the day
function getChallengeOfTheDay() {
  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
  );
  return CHALLENGES[dayOfYear % CHALLENGES.length];
}

export const GET = withErrorHandler(async (req) => {
  const decodedToken = await requireAuth(req, ["student"]);
  const userId = decodedToken.uid;
  const db = await connectDb();

  const challenge = getChallengeOfTheDay();
  
  // Check if completed today
  const todayStr = new Date().toISOString().slice(0, 10);
  const completionRecord = await db.collection("daily_challenges").findOne({
    userId,
    challengeId: challenge.id,
    date: todayStr
  });

  return jsonSuccess({
    challenge,
    isCompleted: !!completionRecord
  });
});

export const POST = withErrorHandler(async (req) => {
  const decodedToken = await requireAuth(req, ["student"]);
  const userId = decodedToken.uid;
  const db = await connectDb();

  const challenge = getChallengeOfTheDay();
  const todayStr = new Date().toISOString().slice(0, 10);

  return withLock(`lock:daily_challenge:${userId}`, async () => {
    const existing = await db.collection("daily_challenges").findOne({
      userId,
      challengeId: challenge.id,
      date: todayStr
    });

    if (existing) {
      return jsonError("You have already completed today's challenge!", 400);
    }

    // Mark as completed
    await db.collection("daily_challenges").insertOne({
      userId,
      challengeId: challenge.id,
      date: todayStr,
      completedAt: new Date(),
      xpEarned: challenge.xpReward
    });

    // Add XP to user
    await db.collection("users").updateOne(
      { firebaseUid: userId },
      { $inc: { totalXp: challenge.xpReward } }
    );

    return jsonSuccess({ 
      message: "Daily challenge completed!", 
      xpEarned: challenge.xpReward 
    });
  });
});
