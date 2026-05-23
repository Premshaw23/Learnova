import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess } from "@/lib/api-response";

export async function GET(request) {
  try {
    // 1. Extract and validate pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

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
    
    // Define query based on role
    let query = { status: "pending" };
    if (profile.role === "student") {
      query.studentEmail = decodedToken.email;
    } else if (profile.role !== "admin" && profile.role !== "teacher") {
      return jsonError("Forbidden", 403);
    }

    // 2. Fetch total count and paginated data
    const total = await collection.countDocuments(query);
    
    const exceptions = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)    // Apply skip
      .limit(limit)  // Apply limit
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