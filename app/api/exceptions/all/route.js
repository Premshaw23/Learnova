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

    // Fetch user profile from Firestore to get the user's role
    const profile = await getUserProfile(decodedToken.uid);

    if (!profile) {
      return jsonError("User profile not found", 404);
    }

    // Restrict access to admin and teacher roles only (return 403 Forbidden otherwise)
    if (profile.role !== "admin" && profile.role !== "teacher") {
      return jsonError("Forbidden", 403);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const db = await connectDb();
    const collection = db.collection("exceptions");

    // Fetch total document count
    const total = await collection.countDocuments({});

    const exceptions = await collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

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

