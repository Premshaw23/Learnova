import React, { useState } from "react";
import {
  calculateHmacSignature,
  serializeDeterministic,
} from "../../../pages/api/quiz/submit.js";
import { useFocusTracking } from "../../../hooks/useFocusTracking";

/**
 * QuizPlayer Component
 * Handles client-side answer selection, generates anti-tampering HMAC signatures,
 * and sends raw answers to the server API route for server-side score calculation.
 * Correct answer keys are stripped from client-side state.
 */
export function QuizPlayer({
  quizId,
  title,
  questions = [],
  hmacSecret = "learnova-quiz-secret-key",
  onQuizSubmitted,
}) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Initialize focus tracking for this quiz session
  useFocusTracking(quizId, "quiz");

  const handleSelectOption = (questionId, option) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const dataToSign = `${quizId}:${serializeDeterministic(selectedAnswers)}:${timestamp}`;
      const signature = calculateHmacSignature(dataToSign, hmacSecret);

      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId,
          answers: selectedAnswers,
          timestamp,
          signature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit quiz");
      }

      setResult(data);
      if (onQuizSubmitted) onQuizSubmitted(data);
    } catch (err) {
      setError(err.message || "Error submitting quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="quiz-result-card p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Quiz Results: {title}</h2>
        <div className="result-stats flex flex-col gap-2">
          <p className="text-lg">
            Score: <span className="font-semibold">{result.score}</span> /{" "}
            {result.totalQuestions}
          </p>
          <p className="text-lg">
            Percentage:{" "}
            <span className="font-semibold">{result.percentage}%</span>
          </p>
          <p
            className={`text-lg font-bold ${result.passed ? "text-green-600" : "text-red-600"}`}
          >
            Status: {result.passed ? "PASSED" : "FAILED"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-player border rounded-lg p-6 bg-white shadow-sm">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>
      )}
      <div className="questions-list flex flex-col gap-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="question-block">
            <h3 className="font-semibold mb-2">
              {idx + 1}. {q.text}
            </h3>
            <div className="options-group flex flex-col gap-2">
              {q.options &&
                q.options.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-gray-50 ${
                      selectedAnswers[q.id] === opt
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={opt}
                      checked={selectedAnswers[q.id] === opt}
                      onChange={() => handleSelectOption(q.id, opt)}
                      className="form-radio"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmitQuiz}
        disabled={isSubmitting}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit Quiz"}
      </button>
    </div>
  );
}

export default QuizPlayer;
