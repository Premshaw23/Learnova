import { withErrorHandler } from "@/lib/error-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { getFirestore } from "firebase-admin/firestore";
import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/rbac";
import { fail, success } from "@/lib/api-response";

export const GET = withErrorHandler(async (request) => {
  initFirebaseAdmin();
  const decodedToken = await requireAuth(request);
  const profile = await getUserProfile(decodedToken.uid);

  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get("userId");
  const month = searchParams.get("month");

  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    throw new ValidationError("Invalid month format. Expected YYYY-MM.");
  }

  // Derive target user from token; allow explicit userId for admin, teacher, institute, and parent roles
  let targetUserId;
  if (requestedUserId && requestedUserId !== decodedToken.uid) {
    const role = decodedToken.role;
    const ALLOWED_ROLES = new Set(["admin", "teacher", "institute", "parent"]);
    if (!ALLOWED_ROLES.has(role)) {
      throw new ForbiddenError(
        "Forbidden: Cannot query attendance for another user"
      );
    }

    // Verify institute/family relationship
    const requesterProfile = await getUserProfile(decodedToken.uid);
    const targetProfile = await getUserProfile(requestedUserId);

    if (!requesterProfile || !targetProfile) {
      throw new ForbiddenError("Forbidden: User profile not found");
    }

    if (role === "parent") {
      const isChildMatch =
        targetProfile.parentId === decodedToken.uid ||
        targetProfile.parentId === requesterProfile?.firebaseUid ||
        (targetProfile.parentEmail &&
          requesterProfile?.email &&
          targetProfile.parentEmail === requesterProfile.email);

      if (!isChildMatch) {
        throw new ForbiddenError(
          "Forbidden: Cannot query attendance for users outside your family"
        );
      }
    } else if (role !== "admin") {
      const requesterInstituteId =
        requesterProfile?.instituteId || (role === "institute" ? decodedToken.uid : null);
      const targetInstituteId = targetProfile?.instituteId || null;

      if (
        !requesterInstituteId ||
        !targetInstituteId ||
        requesterInstituteId !== targetInstituteId
      ) {
        throw new ForbiddenError(
          "Forbidden: Cannot query attendance for users outside your institute"
        );
      }
    }

    targetUserId = requestedUserId;

    // Enforce teacher authorization boundary to prevent BOLA leaks (CWE-285)
    if (role === "teacher") {
      const targetProfile = await getUserProfile(targetUserId);
      if (!targetProfile || targetProfile.role !== "student") {
        throw new ForbiddenError(
          "Forbidden: You are not authorized to view this user's attendance heatmap"
        );
      }
      const teacherSubjects = profile?.subjects || [];
      const studentSubjects =
        targetProfile.subjects || targetProfile.classes || [];
      const studentClass = targetProfile.class || targetProfile.className;
      const hasOverlap =
        studentSubjects.some((subj) => teacherSubjects.includes(subj)) ||
        (studentClass && teacherSubjects.includes(studentClass));
      if (!hasOverlap) {
        throw new ForbiddenError(
          "Forbidden: You are not authorized to view this student's attendance heatmap"
        );
      }
    }
  } else {
    targetUserId = decodedToken.uid;
  }

  if (!month) {
    return success({ attendance: [] });
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `attendance_heatmap_${ip}_${targetUserId}`
  );
  if (!rateLimitResult.allowed) {
    return fail(
      429,
      "TOO_MANY_REQUESTS",
      "Too many requests. Please slow down."
    );
  }

  const [year, monthNum] = month.split("-").map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  const firstDayStr = `${year}-${pad(monthNum)}-01`;
  const lastDayDate = new Date(year, monthNum, 0);
  const lastDayStr = `${year}-${pad(monthNum)}-${pad(lastDayDate.getDate())}`;

  const firestoreDb = getFirestore();
  const snapshot = await firestoreDb
    .collection("attendance_records")
    .where("userId", "==", targetUserId)
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
