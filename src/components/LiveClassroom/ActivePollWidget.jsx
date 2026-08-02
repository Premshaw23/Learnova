"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function ActivePollWidget() {
  const { userProfile, token } = useAuth();
  const [activePoll, setActivePoll] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchActivePolls = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/polls", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.polls && data.polls.length > 0) {
        setActivePoll(data.polls[0]); // Show the most recent active poll
      } else {
        setActivePoll(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActivePolls();

    // Listen to real-time updates via SSE
    const eventSource = new EventSource("/api/events/stream");

    eventSource.addEventListener("polls", (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.event === "POLL_CREATED" || parsed.event === "POLL_VOTED") {
        fetchActivePolls(); // Re-fetch to get updated state (like if they just voted, or if a new poll appeared)
      }
    });

    return () => {
      eventSource.close();
    };
  }, [token]);

  const submitVote = async (answerIndex) => {
    if (!activePoll || activePoll.hasAnswered) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/polls/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pollId: activePoll.id || activePoll._id,
          answerIndex,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.isCorrect) {
          toast.success(`Correct! +${data.xpEarned} XP`);
        } else {
          toast.error("Incorrect answer!");
        }
        fetchActivePolls();
      } else {
        toast.error(data.error || "Failed to submit answer");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userProfile?.role !== "student") return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 mt-4 shadow-sm">
      <h3 className="text-lg font-bold mb-4">Live Classroom Poll</h3>

      {activePoll ? (
        <div className="mb-2">
          <h4 className="font-semibold text-primary mb-4">
            {activePoll.question}
          </h4>

          <div className="space-y-3">
            {activePoll.options.map((opt, idx) => {
              const isSelected = activePoll.submittedAnswer === idx;

              return (
                <button
                  key={idx}
                  disabled={activePoll.hasAnswered || isSubmitting}
                  onClick={() => submitVote(idx)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    isSelected
                      ? "bg-primary/20 border-primary text-primary-foreground"
                      : "bg-background hover:bg-muted border-input"
                  } ${activePoll.hasAnswered ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <span className="font-medium">
                    {String.fromCharCode(65 + idx)}.
                  </span>{" "}
                  {opt}
                  {isSelected && (
                    <span className="float-right font-bold text-xs">
                      Your Answer
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {activePoll.hasAnswered && (
            <p className="mt-4 text-xs text-center text-muted-foreground">
              Waiting for teacher to end poll...
            </p>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          No active polls right now.
        </p>
      )}
    </div>
  );
}
