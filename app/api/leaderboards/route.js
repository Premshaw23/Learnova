import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { success } from "@/lib/api-response";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  
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

  const formattedLeaderboard = await Promise.all(
    topStudentsCursor.map(async (student, index) => {
      const userId = student.firebaseUid;
      let userData = {};
      
      try {
        if (userId) {
          const userSnap = await firestoreDb.collection("users").doc(userId).get();
          if (userSnap.exists) {
            userData = userSnap.data();
          }
        }
      } catch (err) {
        console.warn(`Could not fetch Firestore details for user ${userId}`);
      }

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
    })
  );

  return success({ leaderboard: formattedLeaderboard });
});
