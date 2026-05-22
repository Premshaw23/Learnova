import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";
import { z } from "zod";

const settingsSchema = z.object({
  userId: z.string().optional(),
  theme: z.string().optional(),
  profile: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
  }).strict().optional(),
  notifications: z.union([
    z.boolean(),
    z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      courseReminders: z.boolean().optional(),
      achievementAlerts: z.boolean().optional(),
      weeklyReports: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
      attendanceAlerts: z.boolean().optional(),
      gradeUpdates: z.boolean().optional(),
      classReminders: z.boolean().optional(),
      gradingAlerts: z.boolean().optional(),
      studentSubmissions: z.boolean().optional(),
      parentMessages: z.boolean().optional(),
      systemAlerts: z.boolean().optional(),
      maintenanceReminders: z.boolean().optional(),
      securityAlerts: z.boolean().optional(),
      reportReminders: z.boolean().optional(),
      performanceAlerts: z.boolean().optional(),
      enrollmentAlerts: z.boolean().optional(),
      performanceReports: z.boolean().optional(),
      childProgressAlerts: z.boolean().optional(),
      meetingReminders: z.boolean().optional(),
      childProgress: z.boolean().optional(),
      schoolUpdates: z.boolean().optional(),
    }).strict(),
  ]).optional(),
  privacy: z.object({
    profileVisibility: z.string().optional(),
    showProgress: z.boolean().optional(),
    showAchievements: z.boolean().optional(),
    allowMessages: z.boolean().optional(),
    dataCollection: z.boolean().optional(),
  }).strict().optional(),
  learning: z.object({
    dailyGoal: z.number().optional(),
    weeklyGoal: z.number().optional(),
    preferredLanguage: z.string().optional(),
    difficulty: z.string().optional(),
    autoplay: z.boolean().optional(),
    subtitles: z.boolean().optional(),
    studyReminders: z.boolean().optional(),
    assignmentAlerts: z.boolean().optional(),
    classReminders: z.boolean().optional(),
    gradingAlerts: z.boolean().optional(),
    systemAlerts: z.boolean().optional(),
    maintenanceReminders: z.boolean().optional(),
    reportReminders: z.boolean().optional(),
    performanceAlerts: z.boolean().optional(),
    childProgressAlerts: z.boolean().optional(),
    meetingReminders: z.boolean().optional(),
  }).strict().optional(),
  appearance: z.object({
    theme: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
  }).strict().optional(),
}).strict();

export async function PATCH(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad Request: Unrecognized or invalid fields." },
        { status: 400 }
      );
    }

    const { userId: bodyUserId, ...settings } = parsed.data;
    
    let targetUserId = decodedToken.uid;
    let isOperatorAdmin = false;

    if (bodyUserId && bodyUserId !== decodedToken.uid) {
      const profile = await getUserProfile(decodedToken.uid);
      if (!profile || profile.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to update another user's settings." },
          { status: 403 }
        );
      }
      targetUserId = bodyUserId;
      isOperatorAdmin = true;
    }

    const db = await connectDb();

    await db.collection("settings").updateOne(
      { userId: targetUserId },
      { $set: { ...settings, updatedAt: new Date() } },
      { upsert: true }
    );

    console.log(
      `[Audit Log] Settings updated successfully for target user: ${targetUserId} by operator: ${decodedToken.uid} (Role: ${isOperatorAdmin ? "admin" : "owner"})`
    );

    return NextResponse.json(
      { message: "Settings saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}