import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { NotFoundError } from "@/lib/errors";

/**
 * GET /api/student/schedule
 *
 * Retrieves the authenticated user's dynamic weekly schedule from Firestore.
 */
export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireAuth(request);
  const userId = decodedToken.uid;

  const db = getAdminDb();
  
  const scheduleDoc = await db.collection("schedules").doc(userId).get();

  if (!scheduleDoc.exists) {
    // If the student doesn't have a dynamic schedule yet,
    // return an empty structure matching the mock data shape.
    return NextResponse.json({
      success: true,
      weekly: {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
      }
    });
  }

  const scheduleData = scheduleDoc.data();

  return NextResponse.json({
    success: true,
    weekly: scheduleData.weekly || {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
    }
  });
});
