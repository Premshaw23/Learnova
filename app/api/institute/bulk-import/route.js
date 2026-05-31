import { NextResponse } from "next/server";
import { initFirebaseAdmin, getAdminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { executeSaga, findExistingOperation, markIdempotent } from "@/lib/transactionCoordinator";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const MAX_BULK_IMPORT_PAYLOAD_BYTES = 1024 * 1024;

export async function POST(req) {
  try {
    // Authenticate and authorize — only institute or admin can bulk-import
    const { payload: decodedToken } = await requireRole(req, ["institute", "admin"]);

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimitResult = await checkRateLimit(`bulk_import_${ip}_${decodedToken.uid}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const rawBody = await req.text();
    const byteLength = new TextEncoder().encode(rawBody).length;
    if (byteLength > MAX_BULK_IMPORT_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413 }
      );
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

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

    // Process students sequentially with per-student rollback
    for (const student of students) {
      const { name, email, rollNo, department } = student;
      const defaultPassword = crypto.randomUUID();
      let studentAuthUid = null;

      try {
        // Per-student saga: Auth → Firestore → MongoDB
        const sagaResult = await executeSaga({
          operationType: "bulk_import_student",
          uid: `bulk_${email}`,
          steps: [
            {
              name: "create_firebase_auth",
              execute: async () => {
                let userRecord;
                try {
                  userRecord = await admin.auth().getUserByEmail(email);
                } catch (error) {
                  if (error.code === 'auth/user-not-found') {
                    userRecord = await admin.auth().createUser({
                      email: email,
                      password: defaultPassword,
                      displayName: name,
                    });
                  } else {
                    throw error;
                  }
                }
                studentAuthUid = userRecord.uid;
                createdAuthUids.push(userRecord.uid);
                return userRecord;
              },
              compensate: async () => {
                if (studentAuthUid) {
                  try {
                    await admin.auth().deleteUser(studentAuthUid);
                    const idx = createdAuthUids.indexOf(studentAuthUid);
                    if (idx > -1) createdAuthUids.splice(idx, 1);
                  } catch {}
                }
              },
            },
            {
              name: "write_firestore",
              execute: async () => {
                await firestore.collection("users").doc(studentAuthUid).set({
                  fullName: name,
                  email: email,
                  role: "student",
                  rollNo: rollNo,
                  department: department,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  isBulkImported: true,
                }, { merge: true });
              },
              compensate: async () => {
                if (studentAuthUid) {
                  try {
                    await firestore.collection("users").doc(studentAuthUid).delete();
                  } catch {}
                }
              },
            },
            {
              name: "write_mongodb",
              execute: async () => {
                const existingMongoUser = await mongoUsers.findOne({
                  $or: [{ email }, { rollNo }],
                });

                if (!existingMongoUser) {
                  await mongoUsers.insertOne({
                    name,
                    rollNo,
                    email,
                    department,
                    firebaseUid: studentAuthUid,
                    isBulkImported: true,
                    createdAt: new Date(),
                  });
                }
              },
              compensate: async () => {
                if (studentAuthUid) {
                  try {
                    await mongoUsers.deleteOne({ firebaseUid: studentAuthUid });
                  } catch {}
                }
              },
            },
          ],
        });

        if (sagaResult.success) {
          successfulImports++;
        } else {
          failedImports.push({
            email,
            rollNo,
            reason: sagaResult.fullyCompensated
              ? `Failed at step "${sagaResult.failedStep}" (rolled back)`
              : `Failed at step "${sagaResult.failedStep}" — manual cleanup may be needed`,
          });
        }
      } catch (err) {
        failedImports.push({
          email,
          rollNo,
          reason: err.message,
        });
      }
    }

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
