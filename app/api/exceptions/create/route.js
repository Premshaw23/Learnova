import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withSecurity } from "@/lib/security/middleware";
import { exceptionCreateSchema } from "@/lib/security/validation-schemas";

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonError("Unauthorized", 401);
    }

    const securityResult = await withSecurity(request, {
      rateLimitType: 'default',
      requireCSRF: true,
      schema: exceptionCreateSchema
    });
    if (securityResult instanceof Response) return securityResult;

    const { data } = securityResult;
    const { reason, details, date } = data;

    const db = await connectDb();

    const exceptionData = {
      reason,
      details,
      date,
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
  } catch (error) {
    console.error("Exception creation error:", error);
    return jsonError("Internal server error", 500);
  }
}
