/**
 * SM-2 Algorithm Implementation
 * Calculates the next interval and ease factor for a flashcard.
 * @param {number} quality - User response (0-5). 5: perfect, 0: total blackout.
 * @param {number} repetitions - Previous number of successful repetitions.
 * @param {number} previousInterval - Previous interval in days.
 * @param {number} previousEaseFactor - Previous ease factor (default 2.5).
 */
export function calculateSRS(quality, repetitions, previousInterval, previousEaseFactor) {
  let nextInterval;
  let nextEaseFactor = previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  if (nextEaseFactor < 1.3) nextEaseFactor = 1.3;

  if (quality >= 3) {
    if (repetitions === 0) {
      nextInterval = 1;
    } else if (repetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(previousInterval * nextEaseFactor);
    }
    repetitions++;
  } else {
    repetitions = 0;
    nextInterval = 1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return {
    nextInterval,
    nextEaseFactor,
    repetitions,
    nextReviewDate: nextReviewDate.toISOString(),
  };
}