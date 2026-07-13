/**
 * app/api/parent/child-achievements/route.js
 * 
 * API endpoint for parents to view their child's achievements
 * Validates parent-child relationship before returning data
 */

import { verifyFirebaseToken, initializeFirebase } from "@/lib/firebase-admin";
import { connectDb } from "@/lib/mongodb";
import admin from "firebase-admin";

/**
 * GET /api/parent/child-achievements?childId={id}
 * Fetches a student's achievements (parent only)
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
    const { valid, decodedToken } = await verifyFirebaseToken(token);

    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get parent ID
    const parentId = decodedToken.uid;
    const mongoDb = await connectDb();
    const usersCollection = mongoDb.collection("users");

    // Verify user is a parent
    const parent = await usersCollection.findOne({ uid: parentId });
    if (!parent || parent.role !== "parent") {
      return new Response(
        JSON.stringify({ error: "Only parents can access this endpoint" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get childId from query params
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return new Response(
        JSON.stringify({ error: "Missing childId parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify parent-child relationship
    const child = await usersCollection.findOne({ uid: childId });
    if (!child || child.parentId !== parentId) {
      return new Response(
        JSON.stringify({
          error: "You do not have permission to view this child's data",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch child's achievements from MongoDB
    const badgesCollection = mongoDb.collection("userAchievements");
    const childAchievements = await badgesCollection.findOne({
      userId: childId,
    });

    const earnedBadges = childAchievements?.badges || [];

    // Fetch attendance for statistics using Admin SDK
    initializeFirebase();
    const firestoreDb = admin.firestore();

    const attendanceSnapshot = await firestoreDb
      .collection("attendance_records")
      .where("userId", "==", childId)
      .get();

    const records = attendanceSnapshot.docs.map((doc) => doc.data());

    // Calculate attendance percentage
    const uniqueDates = new Set(records.map((r) => r.date));
    const attendancePercentage = Math.round(
      (uniqueDates.size / Math.max(1, 180)) * 100
    );

    // Determine next milestone
    let nextMilestone = "Perfect Attendance - Keep up the attendance!";
    const consecutiveDays = records.length;
    if (consecutiveDays < 30) {
      nextMilestone = `Perfect Attendance - ${30 - consecutiveDays} more days`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        childId,
        childName: child.displayName || child.firstName || "Student",
        badges: earnedBadges,
        total: 3,
        attendanceCount: records.length,
        attendancePercentage,
        nextMilestone,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching child achievements:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch achievements", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
