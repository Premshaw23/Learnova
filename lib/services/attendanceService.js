import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { awardXp } from "@/lib/gamification-service";
import { executeSaga } from "@/lib/transactionCoordinator";
import { connectDb } from "@/lib/mongodb";
import { AppError } from "@/lib/errors";
import { publishEvent } from "@/lib/ssePublisher";
import { getWeekdaysSince } from "@/lib/dateUtils";

export class AttendanceService {
  static async recordAttendance(data, decodedToken) {
    const { userId, studentName, email, normalizedConfidenceScore, 
      normalizedDate, } = data;

    const normalizedConfidence = Number(normalizedConfidenceScore);

    initFirebaseAdmin();
    const db = getFirestore();

    const targetUid = userId || decodedToken.uid;
    const userProfile = await getUserProfile(targetUid);
    const callerProfile =
      decodedToken.uid !== targetUid
        ? await getUserProfile(decodedToken.uid)
        : userProfile;
    const instituteId =
      userProfile?.instituteId || callerProfile?.instituteId || null;

    const isTeacherOrAdmin =
      decodedToken.role === "teacher" || decodedToken.role === "admin";

    // Institute boundary validation: teachers/admins can only submit attendance
    // for students within their own institute
    if (decodedToken.uid !== targetUid && isTeacherOrAdmin) {
      if (!userProfile) {
        throw new AppError("Target user not found", 404);
      }
      if (userProfile.instituteId !== callerProfile?.instituteId) {
        throw new AppError(
          "Forbidden: Cannot submit attendance for users outside your institute",
          403
        );
      }
      if (userProfile.role !== "student") {
        throw new AppError(
          "Forbidden: Attendance can only be submitted for students",
          403
        );
      }
    }

    const resolvedName =
      userProfile?.fullName ||
      (decodedToken.uid === targetUid
        ? decodedToken.name || decodedToken.displayName
        : null) ||
      studentName ||
      "Unknown User";
    const resolvedEmail =
      userProfile?.email ||
      (decodedToken.uid === targetUid ? decodedToken.email : null) ||
      email ||
      "unknown@learnova.edu";

    // Build a deterministic idempotency key from the attendance target + date.
    // This lets the saga's pending_operations check catch duplicate requests
    // even when they arrive concurrently from different API calls.
    const idempotencyKey = `attendance:${targetUid}:${normalizedDate}`;

    const sagaResult = await executeSaga({
      operationType: "attendance_record",
      uid: decodedToken.uid,
      idempotencyKey,
      steps: [
        {
          name: "write_attendance",
          execute: async (ctx) => {
            const docRef = db
              .collection("attendance_records")
              .doc(`${userId}_${normalizedDate}`);
            ctx.docRef = docRef;
            ctx._firestoreDocKey = `${userId}_${normalizedDate}`;
            await db.runTransaction(async (transaction) => {
              const existingDoc = await transaction.get(docRef);
              if (existingDoc.exists) {
                ctx._alreadyRecorded = true;
                return;
              }

              transaction.set(
                docRef,
                {
                  userId,
                  studentName: resolvedName,
                  email: resolvedEmail,
                  instituteId,
                  timestamp: FieldValue.serverTimestamp(),
                  date: normalizedDate,
                  status: "present",
                  confidenceScore: normalizedConfidence,
                  offlineSynced: false,
                },
                { merge: true }
              );
            });
          },
          compensate: async (ctx) => {
            if (ctx._alreadyRecorded || !ctx._firestoreDocKey) return;
            const ref = db
              .collection("attendance_records")
              .doc(ctx._firestoreDocKey);
            await ref.delete();
          },
        },
        {
          name: "write_mongodb_attendance",
          execute: async (ctx) => {
            if (ctx._alreadyRecorded) return;
            const mongoDB = await connectDb();
            try {
              await mongoDB.collection("attendance").updateOne(
                { userId, date: normalizedDate },
                {
                  $set: {
                    userId,
                    studentName: resolvedName,
                    email: resolvedEmail,
                    instituteId,
                    timestamp: new Date(),
                    date: normalizedDate,
                    status: "present",
                    confidenceScore: normalizedConfidence,
                    offlineSynced: false,
                  },
                },
                { upsert: true }
              );
            } catch (err) {
              // E11000 = duplicate key error — another concurrent request already
              // wrote this attendance record. Treat it as already recorded rather
              // than failing the entire saga.
              if (err?.code === 11000) {
                ctx._alreadyRecorded = true;
                return;
              }
              throw err;
            }
          },
          compensate: async (ctx) => {
            if (ctx._alreadyRecorded) return;
            const mongoDB = await connectDb();
            await mongoDB.collection("attendance").deleteOne({
              userId,
              date: normalizedDate,
            });
          },
        },
        {
          name: "award_xp",
          execute: async (ctx) => {
            if (ctx._alreadyRecorded) return;
            await awardXp(userId, "attendance_marked", {
              attendanceHour: new Date().getHours(),
            });
          },
          compensate: null,
        },
        {
          name: "write_activity",
          execute: async (ctx) => {
            if (ctx._alreadyRecorded) return;
            const hour = new Date().getHours();
            const minutes = new Date().getMinutes();
            const isLate = hour >= 9 && minutes > 10;
            await db.collection("activities").add({
              userId,
              title: "Class Attendance",
              type: "course",
              progress: isLate ? 50 : 100,
              timestamp: FieldValue.serverTimestamp(),
            });
          },
          compensate: null,
        },
        {
          name: "recalculate_stats",
          execute: async (ctx) => {
            if (ctx._alreadyRecorded) return;
            const attendanceQuery = db
              .collection("attendance_records")
              .where("userId", "==", userId);

            const snapshot = await attendanceQuery.get();
            const uniqueDates = new Set(snapshot.docs.map((doc) => doc.data().date).filter(Boolean));
            const presentDays = uniqueDates.size;

            const userDoc = await db.collection("users").doc(userId).get();
            let startDate = new Date(new Date().getFullYear(), 0, 1);
            if (userDoc.exists && userDoc.data().createdAt) {
              const createdAt = userDoc.data().createdAt;
              startDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
            }

            const totalDays = getWeekdaysSince(startDate);
            const rate = Math.min(100, Math.round((presentDays / totalDays) * 100));

            const statsRef = db.collection("userStats").doc(userId);
            await statsRef.set({}, { merge: true });
            await statsRef.update({
              "Attendance Rate": `${rate}%`,
              attendancePresentDays: presentDays,
              lastUpdated: FieldValue.serverTimestamp(),
            });
          },
          compensate: null,
        },
      ],
    });

    if (sagaResult.success && !sagaResult.context?._alreadyRecorded) {
      publishEvent("attendance", "check-in", {
        userId,
        studentName: resolvedName,
        email: resolvedEmail,
        instituteId,
        status: "present",
        confidenceScore: normalizedConfidence,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    return sagaResult;
  }
}
