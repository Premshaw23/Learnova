import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { NotFoundError } from "@/lib/errors";
export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["student", "admin"]);
  const db = await connectDb();
  const userId = decodedToken.uid;

    // Fetch student data
    const student = await db.collection("users").findOne({ firebaseUid: userId });

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    // Default values if not set
    const gamificationData = {
      currentStreak: student.currentStreak || 0,
      totalXp: student.totalXp || 0,
      currentLevel: student.currentLevel || 1,
      unlockedBadges: student.unlockedBadges || [],
    };

    // If these fields don't exist, passively initialise them to avoid nulls on client
    if (student.totalXp === undefined) {
      await db.collection("users").updateOne(
        { firebaseUid: userId },
        { $set: gamificationData }
      );
    }

    return NextResponse.json(gamificationData, { status: 200 });
});
