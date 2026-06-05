import { NextResponse } from "next/server";
import {
  initFirebaseAdmin,
  getAdminDb,
  getUserProfile,
} from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { parseJSON } from "@/lib/error-handler";
import {
  findExistingOperation,
  markIdempotent,
} from "@/lib/transactionCoordinator";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const MAX_BULK_IMPORT_PAYLOAD_BYTES = 1024 * 1024;

export async function POST(req) {
  try {
    // Authenticate and authorize — only institute or admin can bulk-import
    const { payload: decodedToken } = await requireRole(req, [
      "institute",
      "admin",
    ]);

    const profile = await getUserProfile(decodedToken.uid);
    const instituteId = profile?.instituteId || decodedToken.uid;

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimitResult = await checkRateLimit(
      `bulk_import_${ip}_${decodedToken.uid}`
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await parseJSON(req, MAX_BULK_IMPORT_PAYLOAD_BYTES);

    const { students, idempotencyKey } = body;

    // Check idempotency — if this import was already completed, return cached result
    if (idempotencyKey && typeof idempotencyKey === "string") {
      const existing = await findExistingOperation(idempotencyKey);
      if (existing?.idempotentResult) {
        return NextResponse.json(existing.idempotentResult, { status: 200 });
      }
    }

    if (!students || !Array.isArray(students)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected an array of students." },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin
    initFirebaseAdmin();
    const firestore = getAdminDb();

    // Connect to MongoDB
    const mongoDb = await connectDb();
    const mongoUsers = mongoDb.collection("users");

    let successfulImports = 0;
    const failedImports = [];
    const createdAuthUids = [];
    const newlyCreatedUids = [];
    const firestoreWrittenUids = [];

    // Batch phase 1: Firebase Auth – look up existing users in bulk
    const authIdentifiers = students.map((s) => ({ email: s.email }));
    const existingAuthUsers = [];
    let getUsersResult;
    try {
      getUsersResult = await admin.auth().getUsers(authIdentifiers);
      existingAuthUsers.push(...getUsersResult.users.map((u) => u.email));
    } catch {}

    // Batch phase 2: Create non-existing Firebase Auth users in bulk
    const usersToCreate = students.filter(
      (s) => !existingAuthUsers.includes(s.email)
    );
    const newlyCreatedEmails = new Set(usersToCreate.map((s) => s.email));
    if (usersToCreate.length > 0) {
      const createResult = await admin.auth().createUsers(
        usersToCreate.map((s) => ({
          email: s.email,
          password: crypto.randomUUID(),
          displayName: s.name,
        }))
      );
      if (createResult.failed.length > 0) {
        for (const fail of createResult.failed) {
          failedImports.push({
            email:
              fail.index !== undefined
                ? students[fail.index]?.email
                : "unknown",
            rollNo:
              fail.index !== undefined
                ? students[fail.index]?.rollNo
                : "unknown",
            reason: fail.error?.message || "Firebase Auth creation failed",
          });
        }
      }
    }

    // Build firebaseUid map: email → uid
    const emailToUid = new Map();
    const allAuthUsers = await admin.auth().getUsers(authIdentifiers);
    for (const user of allAuthUsers.users) {
      if (user.email) {
        emailToUid.set(user.email, user.uid);
      }
    }

    // Track which UIDs were newly created (for scoped rollback)
    for (const user of allAuthUsers.users) {
      if (user.email && newlyCreatedEmails.has(user.email)) {
        newlyCreatedUids.push(user.uid);
      }
    }

    // Batch phase 3: Gather all UIDs for students that passed Auth
    const validStudents = students.filter((s) => {
      const alreadyFailed = failedImports.some((f) => f.email === s.email);
      return !alreadyFailed && emailToUid.has(s.email);
    });

    for (const s of validStudents) {
      const uid = emailToUid.get(s.email);
      if (uid) {
        createdAuthUids.push(uid);
        s._firebaseUid = uid;
      }
    }

    // Set Firebase custom claims — allSettled to handle partial failures
    const claimsResults = await Promise.allSettled(
      createdAuthUids.map((uid) =>
        admin.auth().setCustomUserClaims(uid, { role: "student", instituteId })
      )
    );
    const failedClaims = claimsResults.filter((r) => r.status === "rejected");
    if (failedClaims.length > 0) {
      const claimsSucceededUids = createdAuthUids.filter(
        (_, i) => claimsResults[i].status === "fulfilled"
      );
      await Promise.allSettled(
        claimsSucceededUids.map((uid) =>
          admin.auth().setCustomUserClaims(uid, null)
        )
      );
      if (newlyCreatedUids.length > 0) {
        await admin.auth().deleteUsers(newlyCreatedUids);
      }
      return NextResponse.json(
        {
          error: `Failed to set custom claims for ${failedClaims.length} users`,
        },
        { status: 500 }
      );
    }

    // Batch phase 4: Bulk Firestore writes
    const BATCH_LIMIT = 500;
    let firestoreBatch = firestore.batch();
    let batchCount = 0;
    for (const student of validStudents) {
      const uid = student._firebaseUid;
      if (!uid) continue;
      firestoreBatch.set(
        firestore.collection("users").doc(uid),
        {
          fullName: student.name,
          email: student.email,
          role: "student",
          rollNo: student.rollNo,
          department: student.department,
          instituteId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isBulkImported: true,
        },
        { merge: true }
      );
      firestoreWrittenUids.push(uid);
      batchCount++;
      if (batchCount >= BATCH_LIMIT) {
        await firestoreBatch.commit();
        firestoreBatch = firestore.batch();
        batchCount = 0;
      }
    }
    if (batchCount > 0) {
      await firestoreBatch.commit();
    }

    // Batch phase 5: Bulk MongoDB writes with existence pre-check
    const emails = validStudents.map((s) => s.email);
    const rollNos = validStudents.map((s) => s.rollNo).filter(Boolean);
    const existingMongo = await mongoUsers
      .find({
        $or: [{ email: { $in: emails } }, { rollNo: { $in: rollNos } }],
      })
      .project({ email: 1, rollNo: 1 })
      .toArray();
    const existingMongoEmails = new Set(existingMongo.map((u) => u.email));
    const existingMongoRollNos = new Set(
      existingMongo.map((u) => u.rollNo).filter(Boolean)
    );

    const mongoBulkOps = [];
    for (const student of validStudents) {
      if (
        existingMongoEmails.has(student.email) ||
        (student.rollNo && existingMongoRollNos.has(student.rollNo))
      ) {
        failedImports.push({
          email: student.email,
          rollNo: student.rollNo,
          reason: "Duplicate: email or roll number already exists",
        });
        continue;
      }
      mongoBulkOps.push({
        insertOne: {
          document: {
            name: student.name,
            rollNo: student.rollNo,
            email: student.email,
            department: student.department,
            firebaseUid: student._firebaseUid,
            instituteId,
            isBulkImported: true,
            createdAt: new Date(),
          },
        },
      });
    }

    if (mongoBulkOps.length > 0) {
      try {
        await mongoUsers.bulkWrite(mongoBulkOps, { ordered: false });
      } catch (mongoError) {
        // Rollback in reverse order of writes: Firestore → claims → Auth accounts

        // 1. Delete Firestore documents that were written
        if (firestoreWrittenUids.length > 0) {
          try {
            for (let i = 0; i < firestoreWrittenUids.length; i += BATCH_LIMIT) {
              const batch = firestore.batch();
              firestoreWrittenUids.slice(i, i + BATCH_LIMIT).forEach((uid) => {
                batch.delete(firestore.collection("users").doc(uid));
              });
              await batch.commit();
            }
            console.warn(
              `Rolled back ${firestoreWrittenUids.length} Firestore documents after MongoDB write failure`
            );
          } catch (fsRollbackError) {
            console.error(
              `Failed to rollback Firestore documents:`,
              fsRollbackError
            );
          }
        }

        // 2. Clear custom claims on all users that received them
        if (createdAuthUids.length > 0) {
          try {
            await Promise.allSettled(
              createdAuthUids.map((uid) =>
                admin.auth().setCustomUserClaims(uid, null)
              )
            );
            console.warn(
              `Cleared custom claims for ${createdAuthUids.length} users after MongoDB write failure`
            );
          } catch (claimsRollbackError) {
            console.error(
              `Failed to clear custom claims:`,
              claimsRollbackError
            );
          }
        }

        // 3. Delete only newly created Firebase Auth users, not pre-existing ones
        if (newlyCreatedUids.length > 0) {
          try {
            await admin.auth().deleteUsers(newlyCreatedUids);
            console.warn(
              `Rolled back ${newlyCreatedUids.length} newly created Firebase Auth users after MongoDB write failure`
            );
          } catch (authRollbackError) {
            console.error(
              `Failed to rollback Firebase Auth users:`,
              authRollbackError
            );
          }
        }

        throw mongoError;
      }
    }

    successfulImports =
      validStudents.length -
      failedImports.filter((f) =>
        validStudents.some((s) => s.email === f.email)
      ).length;

    const resultPayload = {
      success: true,
      successfulImports,
      failedImports,
      totalProcessed: students.length,
    };

    // Mark as idempotent for retry dedup
    if (idempotencyKey) {
      await markIdempotent(idempotencyKey, resultPayload);
    }

    return NextResponse.json(resultPayload, { status: 200 });
  } catch (error) {
    if (error.statusCode) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
