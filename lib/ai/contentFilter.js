/**
 * AI Content Filter & Sentiment Analysis Utility
 *
 * This module provides lightweight toxicity detection and sentiment analysis.
 * In a full production environment, this would interface with a pre-trained
 * TensorFlow.js model (e.g. @tensorflow-models/toxicity) or a dedicated API.
 * For this implementation, we use a robust dictionary-based heuristic model.
 */

// A sample list of toxic/inappropriate keywords (mocking a toxicity model's training data)
const TOXIC_KEYWORDS = [
  "hate",
  "stupid",
  "idiot",
  "kill",
  "dumb",
  "ugly",
  "loser",
  "moron",
  "shut up",
  "trash",
];

/**
 * Analyzes the text for toxicity and inappropriate language.
 * @param {string} text - The input text from the user.
 * @returns {Object} Analysis result containing toxicity flag, score, and flagged words.
 */
export async function analyzeContent(text) {
  if (!text) return { isToxic: false, score: 0, flaggedWords: [] };

  const normalizedText = text.toLowerCase();
  const flaggedWords = [];

  // Mocking TensorFlow.js toxicity detection logic
  for (const word of TOXIC_KEYWORDS) {
    // Regex ensures we match whole words only to prevent false positives (e.g., "shutup")
    const regex = new RegExp(`\\b${word}\\b`, "g");
    if (regex.test(normalizedText)) {
      flaggedWords.push(word);
    }
  }

  // Calculate a mock "toxicity score" based on severity and frequency
  const score = Math.min(1.0, flaggedWords.length * 0.35);

  // Flag as toxic if score exceeds the threshold (e.g., 0.5)
  const isToxic = score >= 0.5 || flaggedWords.length > 0;

  return {
    isToxic,
    score,
    flaggedWords,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Filter middleware function. Throws an error if content is toxic.
 * Useful for catching bad content in API route handlers before insertion to DB.
 */
export async function enforceContentPolicy(text) {
  const analysis = await analyzeContent(text);

  if (analysis.isToxic) {
    throw new Error(
      `Content violates community guidelines. Inappropriate language detected.`
    );
  }

  return true;
}
