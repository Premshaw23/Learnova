import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { getUserProfile, initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { jsonSuccess } from "@/lib/api-response";
import { z } from "zod";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { ValidationError, ForbiddenError, AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const settingsSchema = z
  .object({
    userId: z.string().optional(),
    theme: z.string().optional(),
    profile: z
      .object({
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        bio: z.string().optional(),
        avatar: z.string().optional(),
      })
      .strict()
      .optional(),
    notifications: z
      .union([
        z.boolean(),
        z
          .object({
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
          })
          .strict(),
      ])
      .optional(),
    privacy: z
      .object({
        profileVisibility: z.string().optional(),
        showProgress: z.boolean().optional(),
        showAchievements: z.boolean().optional(),
        allowMessages: z.boolean().optional(),
        dataCollection: z.boolean().optional(),
      })
      .strict()
      .optional(),
    learning: z
      .object({
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
      })
      .strict()
      .optional(),
    appearance: z
      .object({
        theme: z.string().optional(),
        language: z.string().optional(),
        timezone: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const PATCH = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`settings_patch_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await parseJSON(request, 1024 * 100);
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError("Bad Request: Unrecognized or invalid fields.");
  }

  const { userId: bodyUserId, ...settings } = parsed.data;
  
  let targetUserId = decodedToken.uid;
  let isOperatorAdmin = false;

  if (bodyUserId && bodyUserId !== decodedToken.uid) {
    const profile = await getUserProfile(decodedToken.uid);
    if (!profile || profile.role !== "admin") {
      throw new ForbiddenError("Forbidden: You are not authorized to update another user's settings.");
    }
    targetUserId = bodyUserId;
    isOperatorAdmin = true;
  }

  const flattenObject = (obj, prefix = "") => {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + "." : "";
      if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flattenObject(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});
  };

  const updatePayload = flattenObject(settings);
  updatePayload.updatedAt = new Date();

  let db;
  try {
    db = await connectDb();
  } catch (error) {
    throw new AppError("Database connection timed out or failed. Please try again.", 503);
  }

  try {
    await db.collection("settings").updateOne(
      { userId: targetUserId },
      { $set: updatePayload },
      { upsert: true }
    );
  } catch (error) {
    console.error("Settings sync error:", error);
    throw new AppError("Failed to update user settings database entry.", 500);
  }

  // Sync profile updates to Firestore to prevent split-brain desync
  if (settings.profile) {
    initializeFirebase();
    const firestoreProfileUpdate = {};
    
    if (settings.profile.name !== undefined) firestoreProfileUpdate.displayName = settings.profile.name;
    if (settings.profile.bio !== undefined) firestoreProfileUpdate.bio = settings.profile.bio;
    if (settings.profile.phone !== undefined) firestoreProfileUpdate.phone = settings.profile.phone;
    if (settings.profile.avatar !== undefined) firestoreProfileUpdate.avatar = settings.profile.avatar;
    
    if (Object.keys(firestoreProfileUpdate).length > 0) {
      try {
        await admin.firestore().collection("users").doc(targetUserId).update(firestoreProfileUpdate);
      } catch (syncError) {
        console.error("Firestore profile sync failed:", syncError);
      }
    }
  }

  

  return NextResponse.json({ message: "Settings saved successfully" });
});