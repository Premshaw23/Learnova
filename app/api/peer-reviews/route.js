import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess, jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req) => {
  const { payload: decodedToken } = await requireRole(req, ["student"]);
  const userId = decodedToken.uid;
  const db = await connectDb();

  // Fetch assignments assigned to this student for review
  const reviewsToComplete = await db
    .collection("peer_reviews")
    .find({
      reviewerId: userId,
      status: "pending",
    })
    .toArray();

  const completedReviews = await db
    .collection("peer_reviews")
    .find({
      reviewerId: userId,
      status: "completed",
    })
    .toArray();

  const receivedReviews = await db
    .collection("peer_reviews")
    .find({
      authorId: userId,
      status: "completed",
    })
    .toArray();

  return jsonSuccess({
    reviewsToComplete,
    completedReviews,
    receivedReviews,
  });
});

export const POST = withErrorHandler(async (req) => {
  const { payload: decodedToken } = await requireRole(req, ["student"]);
  const reviewerId = decodedToken.uid;

  const body = await req.json();
  const { reviewId, inlineComments, rubricScores, overallFeedback } = body;

  if (!reviewId || !rubricScores || !overallFeedback) {
    return jsonError("Missing required fields", 400);
  }

  const db = await connectDb();

  const reviewDoc = await db
    .collection("peer_reviews")
    .findOne({ _id: reviewId, reviewerId });
  if (!reviewDoc) {
    return jsonError("Review assignment not found or unauthorized.", 404);
  }

  if (reviewDoc.status === "completed") {
    return jsonError("Review already completed.", 400);
  }

  // Calculate overall score from rubric (e.g. 1-5 for logic, readability, efficiency)
  const totalScore = Object.values(rubricScores).reduce(
    (acc, score) => acc + Number(score),
    0
  );
  const averageScore = totalScore / Object.keys(rubricScores).length;

  await db.collection("peer_reviews").updateOne(
    { _id: reviewId },
    {
      $set: {
        status: "completed",
        inlineComments: inlineComments || [],
        rubricScores,
        overallScore: averageScore,
        overallFeedback,
        completedAt: new Date(),
      },
    }
  );

  return jsonSuccess({ message: "Peer review submitted successfully!" });
});
