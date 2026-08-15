"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function PeerReviewsPage() {
  const { token } = useAuth();
  const [reviewsToComplete, setReviewsToComplete] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Review State
  const [activeReview, setActiveReview] = useState(null);
  const [rubricScores, setRubricScores] = useState({
    logic: 3,
    readability: 3,
    efficiency: 3,
  });
  const [overallFeedback, setOverallFeedback] = useState("");
  const [inlineComments, setInlineComments] = useState(""); // Simplified to a text area for inline notes

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/peer-reviews", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setReviewsToComplete(data.reviewsToComplete || []);
        setReceivedReviews(data.receivedReviews || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load peer reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchReviews();
  }, [token]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!overallFeedback) {
      toast.error("Please provide overall feedback");
      return;
    }

    try {
      const res = await fetch("/api/peer-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reviewId: activeReview._id,
          inlineComments: inlineComments.split("\n").filter((l) => l.trim()),
          rubricScores,
          overallFeedback,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Review submitted successfully!");
        setActiveReview(null);
        setOverallFeedback("");
        setInlineComments("");
        fetchReviews(); // refresh lists
      } else {
        toast.error(data.error || "Failed to submit review");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  if (isLoading)
    return <div className="p-8 text-center">Loading Peer Reviews...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Peer-to-Peer Code Review</h1>

      {activeReview ? (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <button
            onClick={() => setActiveReview(null)}
            className="text-muted-foreground hover:text-primary mb-4 text-sm font-medium"
          >
            ← Back to Dashboard
          </button>

          <h2 className="text-2xl font-bold mb-2">
            Reviewing: {activeReview.assignmentTitle || "Code Assignment"}
          </h2>
          <p className="text-muted-foreground mb-6">
            Author is hidden for anonymous review
          </p>

          <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto mb-8 whitespace-pre-wrap">
            {activeReview.submittedCode || "// No code provided"}
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-3">Scoring Rubric (1-5)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["logic", "readability", "efficiency"].map((metric) => (
                  <div key={metric} className="bg-muted/50 p-4 rounded-lg">
                    <label className="block capitalize font-semibold mb-2">
                      {metric}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={rubricScores[metric]}
                      onChange={(e) =>
                        setRubricScores({
                          ...rubricScores,
                          [metric]: e.target.value,
                        })
                      }
                      className="w-full accent-primary"
                    />
                    <div className="text-center font-bold text-primary mt-1">
                      {rubricScores[metric]} / 5
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold mb-2">
                Inline Comments & Notes
              </label>
              <textarea
                className="w-full p-3 rounded-md border border-input bg-background min-h-[100px]"
                placeholder="e.g. Line 14: Consider using a map instead of a for loop..."
                value={inlineComments}
                onChange={(e) => setInlineComments(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold mb-2">
                Overall Feedback (Required)
              </label>
              <textarea
                className="w-full p-3 rounded-md border border-input bg-background min-h-[100px]"
                placeholder="Provide constructive overall feedback..."
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90"
            >
              Submit Review
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Actionable Reviews */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Assigned to You
            </h2>
            {reviewsToComplete.length === 0 ? (
              <p className="text-muted-foreground p-4 bg-muted/20 rounded-lg border border-dashed">
                You have no pending code reviews to complete.
              </p>
            ) : (
              <div className="space-y-4">
                {reviewsToComplete.map((review) => (
                  <div
                    key={review._id}
                    className="bg-card border border-border p-4 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-bold text-lg">
                      {review.assignmentTitle || "Code Assignment"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Assigned:{" "}
                      {new Date(
                        review.assignedAt || Date.now()
                      ).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => setActiveReview(review)}
                      className="px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded-md hover:opacity-90"
                    >
                      Start Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Received Feedback */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Feedback Received
            </h2>
            {receivedReviews.length === 0 ? (
              <p className="text-muted-foreground p-4 bg-muted/20 rounded-lg border border-dashed">
                No peer reviews received yet.
              </p>
            ) : (
              <div className="space-y-4">
                {receivedReviews.map((review) => (
                  <div
                    key={review._id}
                    className="bg-card border border-border p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold">
                        {review.assignmentTitle || "Code Assignment"}
                      </h3>
                      <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs font-bold">
                        Score: {review.overallScore?.toFixed(1)} / 5
                      </span>
                    </div>
                    <p className="text-sm italic mb-2">
                      "{review.overallFeedback}"
                    </p>
                    {review.inlineComments &&
                      review.inlineComments.length > 0 && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2">
                          <strong className="block mb-1">Notes:</strong>
                          <ul className="list-disc list-inside">
                            {review.inlineComments.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
