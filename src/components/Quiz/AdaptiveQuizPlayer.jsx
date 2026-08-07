import React, { useState, useEffect } from "react";
import { useFocusTracking } from "../../../hooks/useFocusTracking";

/**
 * AdaptiveQuizPlayer Component
 * 
 * Implements an adaptive testing engine where the difficulty of the next question
 * dynamically adjusts based on the correctness of the previous answer, using a simplified
 * Item Response Theory (IRT) model.
 * 
 * Questions must have a `difficulty` property (e.g., -3.0 to 3.0 scale).
 * 
 * @param {string} quizId - The unique identifier of the quiz.
 * @param {string} title - Quiz title.
 * @param {Array} questions - Pool of questions with `id`, `text`, `options`, `correctAnswer`, and `difficulty`.
 * @param {number} maxQuestions - Total number of questions to present before ending the quiz.
 */
export function AdaptiveQuizPlayer({
  quizId,
  title,
  questions = [],
  maxQuestions = 10,
  onQuizSubmitted,
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [presentedQuestions, setPresentedQuestions] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [estimatedAbility, setEstimatedAbility] = useState(0.0); // Theta in IRT
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  // Initialize focus tracking for this quiz session
  useFocusTracking(quizId, "adaptive-quiz");

  // Select the first question based on initial ability (0.0)
  useEffect(() => {
    if (questions.length > 0 && presentedQuestions.length === 0) {
      const firstQ = selectNextQuestion(0.0, []);
      if (firstQ) setPresentedQuestions([firstQ]);
    }
  }, [questions]);

  const selectNextQuestion = (ability, usedQuestions) => {
    const available = questions.filter(
      (q) => !usedQuestions.find((uq) => uq.id === q.id)
    );
    
    if (available.length === 0) return null;

    // Find the question whose difficulty is closest to the user's estimated ability
    let bestMatch = available[0];
    let minDiff = Math.abs(available[0].difficulty - ability);

    for (let i = 1; i < available.length; i++) {
      const diff = Math.abs(available[i].difficulty - ability);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = available[i];
      }
    }
    return bestMatch;
  };

  const handleNext = () => {
    if (!selectedOption) return;

    const currentQ = presentedQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQ.correctAnswer;
    
    // Update score
    if (isCorrect) setScore((prev) => prev + 1);

    // Update IRT ability estimate (Simplified Rasch Model Update)
    // If correct, ability goes up. If incorrect, ability goes down.
    // The change is proportional to the difference between ability and difficulty.
    const probCorrect = 1 / (1 + Math.exp(-(estimatedAbility - currentQ.difficulty)));
    const actualScore = isCorrect ? 1 : 0;
    
    // Learning rate/adjustment factor
    const adjustment = 1.0 * (actualScore - probCorrect);
    const newAbility = estimatedAbility + adjustment;
    setEstimatedAbility(newAbility);

    // Check if quiz is finished
    if (presentedQuestions.length >= maxQuestions || presentedQuestions.length >= questions.length) {
      setIsFinished(true);
      if (onQuizSubmitted) {
        onQuizSubmitted({
          quizId,
          score: score + (isCorrect ? 1 : 0),
          totalQuestions: presentedQuestions.length,
          finalAbility: newAbility,
        });
      }
      return;
    }

    // Select next question
    const nextQ = selectNextQuestion(newAbility, presentedQuestions);
    if (nextQ) {
      setPresentedQuestions([...presentedQuestions, nextQ]);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption("");
    } else {
      // No more questions available
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="adaptive-quiz-result p-6 bg-white rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto mt-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Quiz Completed: {title}</h2>
        <div className="flex flex-col gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-600 uppercase text-sm font-bold tracking-wider mb-1">Final Score</p>
            <p className="text-4xl font-extrabold text-blue-600">{score} / {presentedQuestions.length}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-gray-600 uppercase text-sm font-bold tracking-wider mb-1">Estimated Proficiency (IRT)</p>
            <p className="text-2xl font-bold text-purple-700">{estimatedAbility.toFixed(2)}</p>
            <p className="text-xs text-purple-600 mt-2">Scale typically ranges from -3.0 (Beginner) to +3.0 (Advanced)</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = presentedQuestions[currentQuestionIndex];
  if (!currentQ) return <div className="p-6 text-center text-gray-500">Loading questions...</div>;

  return (
    <div className="adaptive-quiz-player bg-white rounded-xl shadow-md border border-gray-100 p-8 max-w-3xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            Question {currentQuestionIndex + 1} of {Math.min(maxQuestions, questions.length)}
          </span>
          <span className="text-xs text-gray-500">
            Difficulty: {currentQ.difficulty.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-6 leading-relaxed">
          {currentQ.text}
        </h3>
        <div className="flex flex-col gap-3">
          {currentQ.options && currentQ.options.map((opt, idx) => (
            <label
              key={idx}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedOption === opt
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQ.id}`}
                value={opt}
                checked={selectedOption === opt}
                onChange={() => setSelectedOption(opt)}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-4"
              />
              <span className="text-gray-800 font-medium text-lg">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!selectedOption}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentQuestionIndex + 1 >= maxQuestions || currentQuestionIndex + 1 >= questions.length
            ? "Finish Quiz"
            : "Next Question"}
        </button>
      </div>
    </div>
  );
}

export default AdaptiveQuizPlayer;
