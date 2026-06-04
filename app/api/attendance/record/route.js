import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { getLocalDateKey } from "@/lib/dateUtils";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { recordAttendanceSchema } from "@/lib/validations/attendance";
import { validateRequest } from "@/lib/validations/validateRequest";
import { AttendanceService } from "@/lib/services/attendanceService";


export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`attendance_record_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  // 1. Validate request body against schema
  const validationResult = await validateRequest(request, recordAttendanceSchema);
  if (!validationResult.success) {
    return validationResult.response;
  }
  
  const { userId, studentName, email, confidenceScore, date } = validationResult.data;
  const normalizedDate = date || getLocalDateKey();

  // 2. Ensure they are only submitting attendance for their own UID, OR they are a teacher/admin!
  const isTeacherOrAdmin = decodedToken.role === "teacher" || decodedToken.role === "admin";
  if (decodedToken.uid !== userId && !isTeacherOrAdmin) {
    return jsonError("Forbidden: Cannot submit attendance for another user", 403);
  }

  // 3. Ensure they actually matched the face threshold (60 is the minimum configured in the frontend)
  const parsedConfidence = Number(confidenceScore);
  if (parsedConfidence < 60) {
    return jsonError("Bad Request: Invalid or spoofed confidence score", 400);
  }

  // Normalize confidence score to 0-1 range for consistency across the DB and dashboards
  const normalizedConfidence = parsedConfidence / 100;

  // 4. Record attendance using the domain service
  const sagaResult = await AttendanceService.recordAttendance({
    userId,
    studentName,
    email,
    confidenceScore,
    normalizedDate
  }, decodedToken);

  if (sagaResult.context._alreadyRecorded) {
    return jsonSuccess({ alreadyRecorded: true }, 200);
  }

  if (!sagaResult.success) {
    if (sagaResult.failedStep === "award_xp") {
      console.error(`[attendance] XP award failed for user ${userId}: ${sagaResult.error}`);
    } else {
      console.error(`[attendance] Saga failed at step "${sagaResult.failedStep}" for user ${userId}: ${sagaResult.error}`);
      return jsonError("Attendance recording failed", 502);
    }
  }

  return jsonSuccess({ alreadyRecorded: false }, 201);
});
