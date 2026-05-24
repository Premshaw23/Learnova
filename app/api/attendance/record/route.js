import { connectDb } from "@/lib/mongodb";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, authenticateRequest } from "@/lib/error-handler";

export const POST = withErrorHandler(async (request) => {
  // 1. Secure token validation ensures only logged-in users can ping this route
  const decodedToken = await authenticateRequest(request);

  const body = await request.json();
  const { userId, studentName, email, confidenceScore, date } = body;

  // 2. Ensure they are only submitting attendance for their own UID!
  if (decodedToken.uid !== userId) {
    return jsonError("Forbidden: Cannot submit attendance for another user", 403);
  }

  // 3. Ensure they actually matched the face threshold (60 is the minimum configured in the frontend)
  if (confidenceScore < 60) {
    return jsonError("Bad Request: Confidence score too low", 400);
  }

  const db = await connectDb();
  
  // 4. Secure server-side database insertion (Uses Upsert to prevent duplicates just like setDoc did)
  await db.collection("attendance_records").updateOne(
    { userId, date },
    {
      $set: {
        userId,
        studentName,
        email,
        timestamp: new Date(),
        date: date || new Date().toISOString().slice(0, 10),
        status: "present",
        confidenceScore
      }
    },
    { upsert: true }
  );

  return jsonSuccess({ alreadyRecorded: false }, 201);
});