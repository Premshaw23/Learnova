import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { createAssignment } from "@/services/assignmentService";
import { z } from "zod";

const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  subject: z.string().min(1, "Subject is required"),
  dueDate: z.string().min(1, "Due date is required"),
  studentIds: z.array(z.string()).min(1, "At least one student is required"),
});

/**
 * POST /api/assignments
 * Create a new assignment and notify students
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const authResult = await verifyFirebaseToken(token);

    if (!authResult.valid) {
      return NextResponse.json(
        { error: "Invalid token", reason: authResult.reason },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validData = assignmentSchema.parse(body);

    const assignmentId = await createAssignment(validData);

    return NextResponse.json(
      { success: true, assignmentId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating assignment:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
