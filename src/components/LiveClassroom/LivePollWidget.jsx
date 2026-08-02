"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function LivePollWidget({ roomId }) {
  const { userProfile, token } = useAuth();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [activePoll, setActivePoll] = useState(null);
  const [error, setError] = useState("");

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!question || options.length < 2 || options.some((opt) => !opt)) {
      setError("Please fill out the question and at least 2 options.");
      return;
    }

    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
          options,
          correctAnswerIndex,
          xpReward: 10,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setQuestion("");
        setOptions(["", ""]);
        setCorrectAnswerIndex(0);
        setError("");
        fetchActivePolls(); // Refresh
      } else {
        setError(data.error || "Failed to create poll");
      }
    } catch (err) {
      setError(err.message);
    }
  };

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
        fetchActivePolls();
      }
    });

    return () => {
      eventSource.close();
    };
  }, [token]);

  return (
    <div className="bg-card border border-border rounded-xl p-4 mt-4 shadow-sm">
      <h3 className="text-lg font-bold mb-4">Live Classroom Polls</h3>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {activePoll ? (
        <div className="mb-6">
          <h4 className="font-semibold text-primary mb-2">
            Active Poll: {activePoll.question}
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            Total Responses: {activePoll.totalResponses || 0}
          </p>
          <div className="space-y-2">
            {activePoll.options.map((opt, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-2 rounded bg-muted/50"
              >
                <span className="flex-1">{opt}</span>
                {idx === activePoll.correctAnswerIndex && (
                  <span className="text-green-500 text-xs font-semibold px-2 py-1 bg-green-500/10 rounded">
                    Correct
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm mb-6">No active polls.</p>
      )}

      {userProfile?.role === "teacher" && (
        <form
          onSubmit={handleCreatePoll}
          className="space-y-4 pt-4 border-t border-border"
        >
          <h4 className="font-semibold text-sm">Launch New Poll</h4>
          <input
            type="text"
            placeholder="Poll Question"
            className="w-full p-2 rounded-md border border-input bg-background"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Option ${i + 1}`}
                className="flex-1 p-2 rounded-md border border-input bg-background text-sm"
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[i] = e.target.value;
                  setOptions(newOpts);
                }}
              />
              <input
                type="radio"
                name="correctAnswer"
                checked={correctAnswerIndex === i}
                onChange={() => setCorrectAnswerIndex(i)}
                title="Mark as correct answer"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1 text-xs border border-border rounded-md hover:bg-muted"
              onClick={() => setOptions([...options, ""])}
            >
              + Add Option
            </button>
            <button
              type="submit"
              className="ml-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 font-medium"
            >
              Launch Poll
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
