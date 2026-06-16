/**
 * app/api/teacher/student-achievements/route.js
 * 
 * API endpoint for teachers to view student achievements
 * Allows teachers to see which badges their students have earned
 */

import { verifyFirebaseToken, initializeFirebase } from "@/lib/firebase-admin";
import { connectDb } from "@/lib/mongodb";
import admin from "firebase-admin";

/**
 * GET /api/teacher/student-achievements?studentId={id}
 * Fetches a specific student's achievements (for the teacher to view)
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

    // Verify user is a teacher
    const teacherId = decodedToken.uid;
    const mongoDb = await connectDb();
    const usersCollection = mongoDb.collection("users");
    const teacher = await usersCollection.findOne({ uid: teacherId });

    if (!teacher || teacher.role !== "teacher") {
      return new Response(
        JSON.stringify({ error: "Only teachers can access this endpoint" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get studentId from query params
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return new Response(
        JSON.stringify({ error: "Missing studentId parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch student achievements from MongoDB
    const badgesCollection = mongoDb.collection("userAchievements");
    const studentAchievements = await badgesCollection.findOne({
      userId: studentId,
    });

    const earnedBadges = studentAchievements?.badges || [];

    // Fetch student's attendance for context using Admin SDK
    initializeFirebase();
    const firestoreDb = admin.firestore();

    const attendanceSnapshot = await firestoreDb
      .collection("attendance_records")
      .where("userId", "==", studentId)
      .get();

    const attendanceCount = attendanceSnapshot.size;

    return new Response(
      JSON.stringify({
        success: true,
        studentId,
        badges: earnedBadges,
        totalBadges: earnedBadges.length,
        attendanceCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching student achievements:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch achievements", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
