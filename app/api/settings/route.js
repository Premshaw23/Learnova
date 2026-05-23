import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { getUserProfile } from "@/lib/firebase-admin";
import { jsonSuccess } from "@/lib/api-response";
import { z } from "zod";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { ValidationError, ForbiddenError } from "@/lib/errors";

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

  const body = await request.json();
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

  const db = await connectDb();

  await db.collection("settings").updateOne(
    { userId: targetUserId },
    { $set: updatePayload },
    { upsert: true }
  );

  // FIX: Replaced unstructured console.log with a professional Winston audit block
  console.info({
    message: "User settings profiles modified successfully",
    targetUserId,
    operatorId: decodedToken.uid,
    operatorRole: isOperatorAdmin ? "admin" : "owner"
  });

  return NextResponse.json({ message: "Settings saved successfully" });
});