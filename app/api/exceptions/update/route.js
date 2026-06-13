import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { getUserProfile, getUserProfileByEmail } from "@/lib/firebase-admin";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import {
  AppError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { ObjectId } from "mongodb";
import { z } from "zod";

// Required to prevent build-time static generation errors
export const dynamic = "force-dynamic";

const exceptionUpdateSchema = z.object({
  exceptionId: z
    .string({
      required_error: "exceptionId is required",
      invalid_type_error: "exceptionId is required",
    })
    .trim()
    .min(1, "exceptionId is required")
    .refine((val) => ObjectId.isValid(val), {
      message: "Invalid exception ID",
    }),
  status: z.enum(["approved", "rejected"], {
    required_error: "Invalid status value",
    invalid_type_error: "Invalid status value",
    message: "Invalid status value",
  }),
  comments: z.string().optional(),
});

export const PUT = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const profile = await getUserProfile(decodedToken.uid);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `exceptions_update_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
  const body = await parseJSON(request, 1024 * 10);

  const validation = exceptionUpdateSchema.safeParse(body);
  if (!validation.success) {
    let firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    const path = validation.error.issues?.[0]?.path?.[0];
    const code = validation.error.issues?.[0]?.code;

    if (
      path === "exceptionId" &&
      (code === "invalid_type" || firstError.includes("Required"))
    ) {
      firstError = "exceptionId is required";
    } else if (
      path === "status" &&
      (code === "invalid_type" ||
        code === "invalid_enum_value" ||
        firstError.includes("Required"))
    ) {
      firstError = "Invalid status value";
    }

    throw new ValidationError(firstError);
  }

  const { exceptionId, status, comments } = validation.data;

  const db = await connectDb();

  // Fetch the exception to perform ownership/relationship checks to prevent IDOR
  const exception = await db
    .collection("exceptions")
    .findOne({ _id: new ObjectId(exceptionId) });

  if (!exception) {
    throw new NotFoundError("Exception not found");
  }

  // Tenant isolation check
  const userInstituteId =
    profile?.instituteId ||
    (profile?.role === "institute" ? profile?.uid : null);
  if (userInstituteId) {
    if (exception.instituteId !== userInstituteId) {
      throw new ForbiddenError(
        "Forbidden: You are not authorized to access records from another institute."
      );
    }
  } else if (profile?.role !== "admin") {
    throw new ForbiddenError(
      "Forbidden: User profile missing institute affiliation."
    );
  }

  // Perform teacher-specific assignment validation (CWE-639 resolution)
  if (profile.role === "teacher") {
    const teacherSubjects = profile.subjects || [];
    const exceptionClass = exception.className || exception.class;
    let isAuthorized = false;

    // 1. Check if the teacher teaches the class of the exception
    if (exceptionClass && teacherSubjects.includes(exceptionClass)) {
      isAuthorized = true;
    }

    // 2. Fallback: Check student-teacher subject assignment overlap
    if (!isAuthorized && exception.studentEmail) {
      const studentProfile = await getUserProfileByEmail(
        exception.studentEmail
      );
      if (studentProfile) {
        const studentSubjects =
          studentProfile.subjects || studentProfile.classes || [];
        const hasOverlap = studentSubjects.some((subject) =>
          teacherSubjects.includes(subject)
        );
        if (hasOverlap) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenError(
        "Forbidden: You are not authorized to update exception requests for this class/student."
      );
    }
  }

  let result;
  try {
    const updateFields = {
      status: status,
      reviewedBy: decodedToken.email,
      approverId: decodedToken.uid,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    };
    if (comments !== undefined) {
      updateFields.comments = comments;
    }

    const updateQuery = { _id: new ObjectId(exceptionId) };
    if (userInstituteId) {
      updateQuery.instituteId = userInstituteId;
    }

    result = await db.collection("exceptions").updateOne(updateQuery, {
      $set: updateFields,
    });
  } catch (error) {
    throw new AppError("Internal server error", 500);
  }

  if (result.matchedCount === 0) throw new NotFoundError("Exception not found");

  await db.collection("audit_logs").insertOne({
    timestamp: new Date(),
    approverUid: decodedToken.uid,
    approverEmail: decodedToken.email,
    role: profile.role,
    exceptionId: new ObjectId(exceptionId),
    action: status,
    module: "exceptions",
    instituteId: userInstituteId || null,
  });

  return NextResponse.json({ message: "Exception updated successfully" });
});
