import { withErrorHandler, authenticateRequest } from "@/lib/error-handler";
import { ForbiddenError } from "@/lib/errors";
import { getFirestore } from "firebase-admin/firestore";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { fail, success } from "@/lib/api-response";

export const GET = withErrorHandler(async (request) => {
  initFirebaseAdmin();
  const decodedToken = await authenticateRequest(request);

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const month = searchParams.get("month");

  if (!userId || !month) {
    return success({ attendance: [] });
  }

  // 2. Ensure they are only querying attendance data for their own UID!
  if (decodedToken.uid !== userId) {
    throw new ForbiddenError("Forbidden: Cannot query attendance for another user");
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`attendance_heatmap_${ip}_${userId}`);
  if (!rateLimitResult.allowed) {
    return fail(429, "TOO_MANY_REQUESTS", "Too many requests. Please slow down.");
  }

  const [year, monthNum] = month.split("-").map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  const firstDayStr = `${year}-${pad(monthNum)}-01`;
  const lastDayDate = new Date(year, monthNum, 0);
  const lastDayStr = `${year}-${pad(monthNum)}-${pad(lastDayDate.getDate())}`;

  const firestoreDb = getFirestore();
  const snapshot = await firestoreDb
    .collection("attendance_records")
    .where("userId", "==", userId)
    .where("date", ">=", firstDayStr)
    .where("date", "<=", lastDayStr)
    .get();

  const attendance = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    attendance.push({
      date: data.date,
      status: data.status || "present",
      subject: data.subject || "",
      markedAt: data.timestamp ? data.timestamp.toDate().toISOString() : null,
      _id: doc.id,
    });
  });

  // Sort by date ascending to match the original API contract
  attendance.sort((a, b) => a.date.localeCompare(b.date));

  return success({ attendance });
});
