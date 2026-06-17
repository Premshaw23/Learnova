/**
 * app/api/student/achievements/route.js
 * 
 * API endpoints for managing student achievements and badges.
 * Handles fetching, updating, and calculating badge progress.
 */

import { verifyFirebaseToken, initializeFirebase } from "@/lib/firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { getBadgesWithProgress, getNewlyUnlockedBadges } from "@/lib/badgeEngine";
import admin from "firebase-admin";

/**
 * GET /api/student/achievements
 * Fetches student achievements and calculates progress
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.substring(7);
    const { valid, decodedToken, reason } = await verifyFirebaseToken(token);

    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Invalid token", reason }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = decodedToken.uid;

    // Initialize Firebase Admin
    initializeFirebase();
    const firestoreDb = admin.firestore();

    // Fetch attendance records from Firestore using Admin SDK
    const attendanceSnapshot = await firestoreDb
      .collection("attendance_records")
      .where("userId", "==", userId)
      .get();

    const attendanceRecords = attendanceSnapshot.docs.map((doc) => doc.data());

    // Fetch earned badges from MongoDB
    const mongoDb = await connectDb();
    const badgesCollection = mongoDb.collection("userAchievements");
    const existingBadges = await badgesCollection.findOne({ userId });

    const earnedBadges = existingBadges?.badges || [];

    // Calculate badges with progress
    const badgesWithProgress = getBadgesWithProgress(attendanceRecords, earnedBadges);

    // Get newly unlocked badges
    const newlyUnlocked = getNewlyUnlockedBadges(attendanceRecords, earnedBadges);

    return new Response(
      JSON.stringify({
        success: true,
        badges: badgesWithProgress,
        newlyUnlocked,
        totalAttendance: attendanceRecords.length,
        stats: {
          unlocked: badgesWithProgress.filter((b) => b.unlocked).length,
          total: badgesWithProgress.length,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch achievements", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * POST /api/student/achievements
 * Saves newly unlocked badges
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.substring(7);
    const { valid, decodedToken, reason } = await verifyFirebaseToken(token);

    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Invalid token", reason }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = decodedToken.uid;
    const { badges } = await request.json();

    if (!badges || !Array.isArray(badges)) {
      return new Response(
        JSON.stringify({ error: "Invalid badges array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Save to MongoDB
    const mongoDb = await connectDb();
    const badgesCollection = mongoDb.collection("userAchievements");

    // Update or create badge record
    await badgesCollection.updateOne(
      { userId },
      {
        $set: {
          userId,
          updatedAt: new Date(),
          badges: badges.map((badge) => ({
            id: badge.id,
            name: badge.name,
            earnedDate: badge.earnedDate || new Date(),
            tier: badge.tier,
          })),
        },
      },
      { upsert: true }
    );

    return new Response(
      JSON.stringify({ success: true, message: "Badges saved successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error saving achievements:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save achievements", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
