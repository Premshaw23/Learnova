import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const TEACHER_ROLES = new Set(["teacher", "admin", "institute"]);

export async function GET(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    if (!token) {
      return jsonError("Unauthorized: No token provided", 401);
    }

    const authResult = await verifyFirebaseToken(token);

    if (!authResult.valid) {
      return jsonError({ message: "Unauthorized", reason: authResult.reason }, 401);
    }

    const db = await connectDb();
    const notices = await db
      .collection("notices")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return jsonSuccess(notices, 200);
  } catch (error) {
    console.error("Error fetching notices:", error);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    if (!token) {
      return jsonError("Unauthorized: No token provided", 401);
    }

    const authResult = await verifyFirebaseToken(token);

    if (!authResult.valid) {
      return jsonError({ message: "Unauthorized", reason: authResult.reason }, 401);
    }

    const { uid } = authResult.decodedToken;

    // Role must be fetched from Firestore — it is not in the Firebase JWT
    const profile = await getUserProfile(uid);

    if (!profile || !TEACHER_ROLES.has(profile.role)) {
      return jsonError("Forbidden: Only teachers or admins can publish notices", 403);
    }

    const body = await request.json();
    const { title, content, category } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return jsonError("title is required", 400);
    }
    if (!content || typeof content !== "string" || !content.trim()) {
      return jsonError("content is required", 400);
    }

    const db = await connectDb();

    const notice = {
      title: title.trim(),
      content: content.trim(),
      category: typeof category === "string" ? category.trim() : "general",
      authorUid: uid,
      authorEmail: authResult.decodedToken.email,
      authorRole: profile.role,
      createdAt: new Date(),
    };

    const result = await db.collection("notices").insertOne(notice);

    return jsonSuccess({ id: result.insertedId, message: "Notice published" }, 201);
  } catch (error) {
    console.error("Error publishing notice:", error);
    return jsonError("Internal server error", 500);
  }
}
