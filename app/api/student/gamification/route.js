import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

export async function GET(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectDb();
    const userId = decodedToken.uid;

    // Fetch student data
    const student = await db.collection("users").findOne({ firebaseUid: userId });
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Default values if not set
    const gamificationData = {
      currentStreak: student.currentStreak || 0,
      totalXp: student.totalXp || 0,
      currentLevel: student.currentLevel || 1,
      unlockedBadges: student.unlockedBadges || [],
    };

    // If these fields don't exist, we can passively initialize them to avoid nulls on client
    if (student.totalXp === undefined) {
      await db.collection("users").updateOne(
        { firebaseUid: userId },
        { $set: gamificationData }
      );
    }

    return NextResponse.json(gamificationData, { status: 200 });
  } catch (error) {
    console.error("Gamification fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gamification data" },
      { status: 500 }
    );
  }
}
