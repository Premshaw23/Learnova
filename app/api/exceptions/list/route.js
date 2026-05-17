import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess, jsonUnauthorized } from "@/lib/api-response";

export async function GET(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonUnauthorized();
    }

    const db = await connectDb();

    const exceptions = await db
      .collection("exceptions")
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .toArray();

    return jsonSuccess(exceptions);
  } catch (error) {
    console.error("Exception fetch error:", error);
    return jsonError("Internal server error", 500);
  }
}
