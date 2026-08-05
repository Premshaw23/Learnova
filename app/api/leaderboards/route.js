import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import {
  checkRateLimit,
  extractClientIp,
  RATE_LIMIT_IP_FALLBACK,
} from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { success } from "@/lib/api-response";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const ip = extractClientIp(request) || RATE_LIMIT_IP_FALLBACK;
  
  const rateLimitResult = await checkRateLimit(
    `leaderboards_get_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const db = await connectDb();

  // Fetch the top 50 students based on totalXp descending.
  const topStudentsCursor = await db
    .collection("users")
    .find({ totalXp: { $exists: true } })
    .sort({ totalXp: -1 })
    .limit(50)
    .toArray();

  if (!topStudentsCursor || topStudentsCursor.length === 0) {
    return success({ leaderboard: [] });
  }

  const firestoreDb = getAdminDb();

  const validUserIds = topStudentsCursor
    .map((student) => student.firebaseUid)
    .filter(Boolean);

  const userDataMap = new Map();

  if (validUserIds.length > 0) {
    try {
      const docRefs = validUserIds.map((id) =>
        firestoreDb.collection("users").doc(id)
      );
      const userSnaps = await firestoreDb.getAll(...docRefs);
      userSnaps.forEach((snap) => {
        if (snap.exists) {
          userDataMap.set(snap.id, snap.data());
        }
      });
    } catch (err) {
      console.warn("Could not batch fetch Firestore user details:", err.message);
    }
  }

  const formattedLeaderboard = topStudentsCursor.map((student, index) => {
    const userId = student.firebaseUid;
    const userData = userDataMap.get(userId) || {};

    return {
      id: userId || student._id.toString(),
      name: userData.displayName || userData.fullName || "Unknown Learner",
      score: student.totalXp || 0,
      avatar: userData.photoURL || "👩‍🎓",
      rank: index + 1,
      change: "same",
      streak: student.currentStreak || 0,
      badges: student.unlockedBadges ? student.unlockedBadges.length : 0,
      isCurrentUser: decodedToken.uid === userId,
    };
  });

  return success({ leaderboard: formattedLeaderboard });
});
