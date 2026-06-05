import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import admin from "firebase-admin";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, [
    "institute",
    "admin",
  ]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

  const rateLimitResult = await checkRateLimit(
    `institute_reqs_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please slow down.", 429);
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const db = admin.firestore();
  const uid = decodedToken.uid;

  try {
    let query = db
      .collection("attendance_requests")
      .where("instituteId", "==", uid)
      .orderBy("createdAt", "desc");

    if (cursor) {
      const cursorDoc = await db
        .collection("attendance_requests")
        .doc(cursor)
        .get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    query = query.limit(limit);

    const reqSnap = await query.get();
    const requests = reqSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ requests });
  } catch (err) {
    console.error("Error fetching attendance requests:", err);
    throw new AppError("Failed to fetch requests", 500);
  }
});
