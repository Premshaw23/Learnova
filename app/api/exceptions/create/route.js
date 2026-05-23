import { connectDb } from "@/lib/mongodb";
import { requireStudent } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { NextResponse } from "next/server";
import { ValidationError } from "@/lib/errors";

export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireStudent(request);
    const body = await request.json();
    const { reason, details, date } = body;

    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      throw new ValidationError("Reason is required and must be a string");
    }
    if (!details || typeof details !== "string" || details.trim() === "") {
      throw new ValidationError("Details are required and must be a string");
    }
    if (!date || typeof date !== "string" || date.trim() === "") {
      throw new ValidationError("Date is required and must be a string");
    }

    const db = await connectDb();

    const exceptionData = {
      reason: reason.trim(),
      details: details.trim(),
      date: date.trim(),
      studentEmail: decodedToken.email,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("exceptions").insertOne(exceptionData);

    return jsonSuccess(
      {
        id: result.insertedId,
        message: "Exception request created successfully",
      },
      201,
    );
});
