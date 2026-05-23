import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import admin from "firebase-admin";

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

    const body = await request.json();
    const { passcode } = body;

    if (!passcode || typeof passcode !== "string") {
      return jsonError("Passcode is required", 400);
    }

    const settingsDoc = await admin
      .firestore()
      .collection("attendance_settings")
      .doc("current_settings")
      .get();

    if (!settingsDoc.exists) {
      return jsonError("Attendance settings not found", 404);
    }

    const settings = settingsDoc.data();

    if (passcode.trim() !== settings.passcode) {
      return jsonSuccess({ valid: false }, 200);
    }

    return jsonSuccess({ valid: true }, 200);
  } catch (error) {
    console.error("Passcode validation error:", error);
    return jsonError("Internal server error", 500);
  }
}
