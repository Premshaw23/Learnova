import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const overrideSchema = z.object({
  studentId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["present", "absent", "late"]),
});

export const POST = withErrorHandler(async (request) => {
  const token = await requireAuth(request);

  // Only teachers and admins can override
  if (token.role !== "teacher" && token.role !== "admin") {
    throw new AppError("Forbidden", 403);
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rl = await checkRateLimit(`attendance_override_${ip}_${token.uid}`);
  if (!rl.allowed) throw new AppError("Too many requests", 429);

  const body = await parseJSON(request, 1024);
  const { studentId, date, status } = overrideSchema.parse(body);

  initFirebaseAdmin();
  const db = getFirestore();
  const docRef = db.collection("attendance_records").doc(`${studentId}_${date}`);

  // Use runTransaction so concurrent teacher overrides for DIFFERENT students
  // in the same class are safely merged (field-level, not full-doc overwrites)
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (snap.exists) {
      // Field-level update: only touch status + override metadata
      // This is the key fix — other concurrent writes to different fields are preserved
      tx.update(docRef, {
        status,
        overriddenBy: token.uid,
        overriddenAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Create the record if it doesn't exist (e.g. absent student)
      tx.set(docRef, {
        userId: studentId,
        date,
        status,
        overriddenBy: token.uid,
        overriddenAt: FieldValue.serverTimestamp(),
        timestamp: FieldValue.serverTimestamp(),
        offlineSynced: false,
      });
    }
  });

  return jsonSuccess({ updated: true });
});
