import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { connectDb } from "@/lib/mongodb";
import { evaluateStudentAttendance } from "@/lib/attendanceUtils";

export const dynamic = "force-dynamic";

const STUDENT_BATCH_SIZE = 50;
const FLUSH_THRESHOLD = 500;

function getStudentUid(student) {
  return student?.uid || student?.firebaseUid;
}

function buildWarningPayload({ uid, email, name, evaluation, threshold, now }) {
  const notification = {
    userId: uid,
    title: "Low Attendance Warning",
    message: `Your current attendance is ${evaluation.percentage}%, which is below the required ${threshold}%. Please improve your attendance.`,
    type: "warning",
    read: false,
    createdAt: now,
  };

  const warningLog = {
    userId: uid,
    percentage: evaluation.percentage,
    threshold,
    createdAt: now,
  };

  const emailData = email
    ? {
        to_email: email,
        to_name: name || "Student",
        attendance_percentage: evaluation.percentage,
        threshold,
      }
    : null;

  return { notification, warningLog, emailData };
}

async function getRecentWarningUserIds(db, userIds, cooldownDate) {
  if (userIds.length === 0) {
    return new Set();
  }

  const warningLogs = db.collection("warning_logs");
  if (typeof warningLogs.find === "function") {
    const cursor = warningLogs.find({
      userId: { $in: userIds },
      createdAt: { $gte: cooldownDate },
    });
    const projectedCursor =
      typeof cursor.project === "function"
        ? cursor.project({ userId: 1 })
        : cursor;
    const recentLogs =
      typeof projectedCursor.toArray === "function"
        ? await projectedCursor.toArray()
        : null;

    if (Array.isArray(recentLogs)) {
      return new Set(recentLogs.map((log) => log.userId));
    }
  }

  const checks = await Promise.all(
    userIds.map(async (uid) => {
      if (typeof warningLogs.findOne !== "function") {
        return null;
      }

      const recentLog = await warningLogs.findOne({
        userId: uid,
        createdAt: { $gte: cooldownDate },
      });

      return recentLog ? uid : null;
    })
  );

  return new Set(checks.filter(Boolean));
}


async function sendWarningEmails(emailsToSend) {
  const hasEmailConfig =
    process.env.EMAILJS_SERVICE_ID &&
    process.env.EMAILJS_TEMPLATE_ID &&
    process.env.EMAILJS_PUBLIC_KEY;

  if (!hasEmailConfig || emailsToSend.length === 0) {
    return;
  }

  const sendEmail = async (emailData) => {
    try {
      await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          template_params: emailData,
        }),
      });
    } catch (error) {
      console.error(`Failed to send email to ${emailData.to_email}:`, error);
    }
  };

  // Process emails in parallel chunks to prevent serverless function timeouts
  const CHUNK_SIZE = 50;
  for (let i = 0; i < emailsToSend.length; i += CHUNK_SIZE) {
    const chunk = emailsToSend.slice(i, i + CHUNK_SIZE);
    await Promise.allSettled(chunk.map(sendEmail));
  }
}

export async function GET(request) {
  try {
    const cronAuth = authorizeCronRequest(request);
    if (!cronAuth.authorized) {
      return cronAuth.response;
    }

    const db = await connectDb();
    initializeFirebase();
    const firestore = admin.firestore();

    // Ensure the warning_logs collection has a compound index on (userId, createdAt)
    // so the cooldown query does not trigger a full collection scan
    try {
      await db.collection("warning_logs").createIndex(
        { userId: 1, createdAt: -1 },
        { background: true }
      );
    } catch {
      // Index may already exist
    }

    const allSettings = await db
      .collection("settings")
      .find({
        "institute.enableAttendanceAutomation": true,
      })
      .toArray();

    if (!allSettings || allSettings.length === 0) {
      return NextResponse.json({
        message:
          "Automation is not enabled for any institute or no settings found.",
      });
    }

    const now = new Date();
    const cooldownDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let notificationsToInsert = [];
    let warningLogsToInsert = [];
    const emailsToSend = [];
    let totalWarnings = 0;

    async function flushNotifications() {
      if (notificationsToInsert.length === 0) return;
      await db.collection("notifications").insertMany(notificationsToInsert);
      await db.collection("warning_logs").insertMany(warningLogsToInsert);
      notificationsToInsert = [];
      warningLogsToInsert = [];
    }

    // Fetch all students with an instituteId once
    const allStudents = await db
      .collection("users")
      .find({
        role: "student",
        instituteId: { $exists: true },
      })
      .toArray();

    // Group students by instituteId
    const studentsByInstitute = new Map();
    for (const student of allStudents) {
      const instId = student.instituteId;
      if (!instId) continue;
      if (!studentsByInstitute.has(instId)) {
        studentsByInstitute.set(instId, []);
      }
      studentsByInstitute.get(instId).push(student);
    }

    // Collect all student UIDs for batch cooldown check
    const allStudentUids = allStudents
      .map((s) => s.firebaseUid)
      .filter(Boolean);
    const recentWarningUserIds = await getRecentWarningUserIds(
      db,
      allStudentUids,
      cooldownDate
    );

    for (const settings of allSettings) {
      const threshold = settings.institute.lowAttendanceThreshold || 75;

      // Derive the institute ID from the settings document. instituteId is the
      // canonical field; fall back to _id only when instituteId is absent.
      // Reject any document whose instituteId cannot be determined as a
      // non-empty string: processing it with an undefined or empty key would
      // cause studentsByInstitute.get() to return undefined, silently matching
      // no students or incorrectly matching students from another institute if
      // two settings documents resolve to the same fallback key.
      const rawInstituteId = settings.instituteId;
      if (
        !rawInstituteId ||
        typeof rawInstituteId !== "string" ||
        rawInstituteId.trim() === ""
      ) {
        console.warn(
          "[attendance-warnings] Skipping settings document with missing or invalid instituteId",
          { settingsId: settings._id?.toString() }
        );
        continue;
      }
      const instituteId = rawInstituteId.trim();

      // Fetch students for this institute only instead of loading all students globally
      const instituteStudents = await db.collection('users').find({
        role: 'student',
        instituteId,
      }).toArray();

      if (instituteStudents.length === 0) continue;

      const instituteStudentUids = instituteStudents
        .map((s) => s.firebaseUid)
        .filter(Boolean);

      const attendanceRecords = await db
        .collection("attendance")
        .find({ userId: { $in: instituteStudentUids }, instituteId })
        .toArray();

      const attendanceByUser = new Map();
      for (const record of attendanceRecords) {
        if (!attendanceByUser.has(record.userId)) {
          attendanceByUser.set(record.userId, []);
        }
        attendanceByUser.get(record.userId).push(record);
      }

      for (const student of instituteStudents) {
        const studentUid = student.firebaseUid;
        if (!studentUid) continue;

        if (recentWarningUserIds.has(studentUid)) {
          continue;
        }

        const studentAttendance = attendanceByUser.get(studentUid) || [];
        const evaluation = evaluateStudentAttendance(studentAttendance, threshold);

        if (evaluation.isBelowThreshold) {
          const email = student.email;
          const name = student.name || student.fullName || "Student";

          notificationsToInsert.push({
            userId: studentUid,
            title: "Low Attendance Warning",
            message: `Your current attendance is ${evaluation.percentage}%, which is below the required ${threshold}%. Please improve your attendance.`,
            type: "warning",
            read: false,
            createdAt: now,
          });

          warningLogsToInsert.push({
            userId: studentUid,
            percentage: evaluation.percentage,
            threshold,
            createdAt: now,
          });

          if (email) {
            emailsToSend.push({
              to_email: email,
              to_name: name,
              attendance_percentage: evaluation.percentage,
              threshold,
            });
          }

          totalWarnings++;
        }

        if (notificationsToInsert.length >= FLUSH_THRESHOLD) {
          await flushNotifications();
        }
      }
    }

    await flushNotifications();
    await sendWarningEmails(emailsToSend);

    return NextResponse.json({
      success: true,
      warningsIssued: totalWarnings,
      message: `Issued ${totalWarnings} warnings.`,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
