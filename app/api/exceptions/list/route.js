import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withSecurity } from "@/lib/security/middleware";

export async function GET(request) {
  try {
    // Apply rate limiting
    const securityResult = await withSecurity(request, { rateLimitType: 'default' });
    if (securityResult instanceof Response) return securityResult;

    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonError("Unauthorized", 401);
    }

    const profile = await getUserProfile(decodedToken.uid);

    if (!profile) {
      return jsonError("User profile not found", 404);
    }

    const db = await connectDb();
    const collection = db.collection("exceptions");
    const query = { status: "pending" };

    // Fetch total document count under query
    const total = await collection.countDocuments(query);

    let exceptions;

    if (profile.role === "admin" || profile.role === "teacher") {
      exceptions = await db
        .collection("exceptions")
        .find({ status: "pending" })
        .sort({ createdAt: -1 })
        .toArray();
    } else if (profile.role === "student") {
      exceptions = await db
        .collection("exceptions")
        .find({ status: "pending", studentEmail: decodedToken.email })
        .sort({ createdAt: -1 })
        .toArray();
    } else {
      return jsonError("Forbidden", 403);
    }

    const totalPages = Math.ceil(total / limit);

    return jsonSuccess({
      exceptions,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    }, 200);
  } catch (error) {
    console.error("Exception fetch error:", error);
    return jsonError("Internal server error", 500);
  }
}
