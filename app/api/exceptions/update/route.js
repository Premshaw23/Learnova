import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { getUserProfileByEmail } from "@/lib/firebase-admin";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { AppError, ValidationError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { ObjectId } from "mongodb";

// Required to prevent build-time static generation errors
export const dynamic = "force-dynamic";

export const PUT = withErrorHandler(async (request) => {
  const { payload: decodedToken, profile } = await requireRole(request, ["admin", "teacher"]);

  const body = await request.json();
  const { exceptionId, status, comments } = body;

  if (!exceptionId) {
    throw new ValidationError("exceptionId is required");
  }

  if (!ObjectId.isValid(exceptionId)) {
    throw new ValidationError("Invalid exception ID");
  }

  const trimmedStatus = typeof status === "string" ? status.trim() : "";
  if (!["approved", "rejected"].includes(trimmedStatus)) {
    throw new ValidationError("Invalid status value");
  }

  const db = await connectDb();

    // Fetch the exception to perform ownership/relationship checks to prevent IDOR
    const exception = await db.collection("exceptions").findOne({ _id: new ObjectId(exceptionId) });

    if (!exception) {
      throw new NotFoundError("Exception not found");
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
        const studentProfile = await getUserProfileByEmail(exception.studentEmail);
        if (studentProfile) {
          const studentSubjects = studentProfile.subjects || studentProfile.classes || [];
          const hasOverlap = studentSubjects.some((subject) => teacherSubjects.includes(subject));
          if (hasOverlap) {
            isAuthorized = true;
          }
        }
      }

      if (!isAuthorized) {
        throw new ForbiddenError("Forbidden: You are not authorized to update exception requests for this class/student.");
      }
    }

     let result;
  try {
    result = await db.collection("exceptions").updateOne(
      { _id: new ObjectId(exceptionId) },
      {
        $set: {
          status: trimmedStatus,
          comments,
          reviewedBy: decodedToken.email,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );
  } catch (error) {
    throw new AppError("Internal server error", 500);
  }

  if (result.matchedCount === 0) throw new NotFoundError("Exception not found");

  return NextResponse.json({ message: "Exception updated successfully" });
});