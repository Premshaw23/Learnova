import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";
import { ObjectId } from "mongodb";
import { jsonError, jsonSuccess } from "@/lib/api-response";

export async function PUT(request) {
  try {
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

    const body = await request.json();
    const { exceptionId, status, comments } = body;

    if (!exceptionId) {
      return jsonError("exceptionId is required", 400);
    }

    const validStatuses = ["pending", "approved", "rejected"];
    if (status && !validStatuses.includes(status)) {
      return jsonError("Invalid status value", 400);
    }

    const db = await connectDb();

    const result = await db.collection("exceptions").updateOne(
      { _id: new ObjectId(exceptionId) },
      {
        $set: {
          status,
          comments,
          reviewedBy: decodedToken.email,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return jsonError("Exception not found", 404);
    }

    return jsonSuccess(
      {
        message: "Exception updated successfully",
      },
      200,
    );
  } catch (error) {
    console.error("Exception update error:", error);
    return jsonError("Internal server error", 500);
  }
}
