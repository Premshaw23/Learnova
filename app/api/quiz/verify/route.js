import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getQuizDataByTitle } from "@/constants/quizData";
import { z } from "zod";

const verifyQuizSchema = z.object({
  activityId: z.string({ required_error: "activityId is required" }).min(1, "activityId is required"),
  title: z.string({ required_error: "title is required" }).min(1, "title is required"),
  selectedAnswers: z.record(z.coerce.number(), { required_error: "selectedAnswers is required" }),
});

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const body = await parseJSON(request, 4096);

  const parsed = verifyQuizSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join("; ");
    return jsonError(message, 400);
  }

  const { activityId, title, selectedAnswers } = parsed.data;

  initFirebaseAdmin();
  const db = getFirestore();

  // 1. Fetch activity details to verify ownership
  const activityRef = db.collection("activities").doc(activityId);
  const activityDoc = await activityRef.get();

  if (!activityDoc.exists) {
    return jsonError("Activity not found", 404);
  }

  const activityData = activityDoc.data();
  if (activityData.userId !== decodedToken.uid) {
    return jsonError("Forbidden", 403);
  }

  // 2. Fetch correct answers
  const quiz = getQuizDataByTitle(title);
  if (!quiz) {
    return jsonError("Quiz data not found", 404);
  }

  // 3. Evaluate answers
  let correctCount = 0;
  quiz.questions.forEach((q, idx) => {
    if (selectedAnswers[idx] === q.answer) {
      correctCount++;
    }
  });

  const totalCount = quiz.questions.length;
  const percentage = Math.round((correctCount / totalCount) * 100);
  const passed = percentage >= 60;

  // 4. Update activity progress to 100% if passed
  if (passed) {
    await activityRef.update({ progress: 100 });

    // Also update "Assignments Done" userStat
    const statsRef = db.collection("userStats").doc(decodedToken.uid);
    const statsDoc = await statsRef.get();
    if (!statsDoc.exists) {
      await statsRef.set({
        "Courses Enrolled": 0,
        "Attendance Rate": "0%",
        "Assignments Done": 1,
        "Study Hours": 0,
      });
    } else {
      const { FieldValue } = await import("firebase-admin/firestore");
      await statsRef.update({
        "Assignments Done": FieldValue.increment(1),
      });
    }
  }

  return jsonSuccess({
    passed,
    correctCount,
    totalCount,
    percentage,
  }, 200);
});
