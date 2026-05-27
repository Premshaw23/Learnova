import { NextResponse } from "next/server";
import { initFirebaseAdmin, getAdminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { authenticateRequest } from "@/lib/error-handler";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    // Authenticate the request
    const decodedToken = await authenticateRequest(req);
    
    // Check if the user is authorized (institute/admin)
    // Here we can fetch user profile to check role, but assuming valid token is enough for MVP.
    // In a real scenario, check if decodedToken.role === "institute" or similar.

    const body = await req.json();
    const { students } = body;

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

    // Process students sequentially or in parallel batches
    for (const student of students) {
      const { name, email, rollNo, department } = student;
      const defaultPassword = process.env.DEFAULT_STUDENT_PASSWORD || crypto.randomUUID(); // Secure default password

      try {
        // 1. Create Firebase Auth user
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

        // 2. Persist to Firestore (used by dashboard and auth checks)
        await firestore.collection("users").doc(userRecord.uid).set({
          fullName: name,
          email: email,
          role: "student",
          rollNo: rollNo,
          department: department,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isBulkImported: true,
        }, { merge: true });

        // 3. Persist to MongoDB (used by face recognition system)
        // Check if user exists in Mongo
        const existingMongoUser = await mongoUsers.findOne({
          $or: [{ email }, { rollNo }],
        });

        if (!existingMongoUser) {
          await mongoUsers.insertOne({
            name,
            rollNo,
            email,
            department,
            firebaseUid: userRecord.uid,
            isBulkImported: true,
            createdAt: new Date(),
          });
        }

        successfulImports++;
      } catch (err) {
        failedImports.push({
          email,
          rollNo,
          reason: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      successfulImports,
      failedImports,
    }, { status: 200 });

  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
