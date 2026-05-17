import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess, jsonUnauthorized } from "@/lib/api-response";

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonUnauthorized();
    }

    const body = await request.json();
    const db = await connectDb();

    const exceptionData = {
      ...body,
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
