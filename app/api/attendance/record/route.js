import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { getLocalDateKey } from "@/lib/dateUtils";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { recordAttendanceSchema, withValidation } from "@/lib/validations";
import { AttendanceService } from "@/lib/services/attendanceService";
import { emitWebhookEvent } from "@/lib/webhook/dispatcher";

export const POST = withErrorHandler(
  withValidation(
    recordAttendanceSchema,
    async (request, validatedData, context) => {
      const token = await requireAuth(request);

      // Rate-limit per IP + uid to prevent burst abuse
      const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
      const rateLimitResult = await checkRateLimit(
        `attendance_record_${ip}_${token.uid}`
      );
      if (!rateLimitResult.allowed) {
        throw new AppError("Too many attempts. Please try again later.", 429);
      }

      const { userId, studentName, email, confidenceScore, date } =
        validatedData;
      const normalizedDate = date || getLocalDateKey();

      // Ensure the caller is submitting for their own UID, or is a teacher/admin
      const isTeacherOrAdmin =
        token.role === "teacher" || token.role === "admin";
      if (token.uid !== userId && !isTeacherOrAdmin) {
        return jsonError(
          "Forbidden: Cannot submit attendance for another user",
          403
        );
      }

      // Reject requests that did not pass the frontend confidence threshold
      const parsedConfidence = Number(confidenceScore);
      if (parsedConfidence < 60) {
        return jsonError(
          "Bad Request: Invalid or spoofed confidence score",
          400
        );
      }

      // Normalize confidence score to 0-1 range for DB consistency
      const normalizedConfidence = parsedConfidence / 100;

      // Record attendance via the domain service (runs Firestore + MongoDB saga)
      const sagaResult = await AttendanceService.recordAttendance(
        {
          userId,
          studentName,
          email,
          confidenceScore: normalizedConfidence,
          normalizedDate,
        },
        token
      );

      // If the saga detected a duplicate (idempotency key or Firestore doc already
      // existed), return HTTP 409 so the client can handle it gracefully without
      // treating it as an error.
      const alreadyRecorded = !!(sagaResult.context?._alreadyRecorded);
      if (alreadyRecorded) {
        return jsonSuccess({ alreadyRecorded: true }, 200);
      }

      // Fire webhook for downstream integrations (non-blocking)
      emitWebhookEvent("attendance.recorded", {
        studentId: userId,
        studentName,
        email,
        confidence: normalizedConfidence,
        date: normalizedDate,
        recordedBy: token.uid,
      });

      return jsonSuccess({ alreadyRecorded: false }, 201);
    }
  )
);
