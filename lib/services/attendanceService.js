import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { awardXp } from "@/lib/gamification-service";
import { executeSaga } from "@/lib/transactionCoordinator";
import { connectDb } from "@/lib/mongodb";
import { AppError } from "@/lib/errors";

export class AttendanceService {
  static async recordAttendance(data, decodedToken) {
    const { userId, studentName, email, confidenceScore, normalizedDate } =
      data;

    const parsedConfidence = Number(confidenceScore);
    const normalizedConfidence = parsedConfidence / 100;

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

    const sagaResult = await executeSaga({
      operationType: "attendance_record",
      uid: decodedToken.uid,
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
      ],
    });

    return sagaResult;
  }
}
