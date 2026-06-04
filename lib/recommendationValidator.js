/**
 * Validation for learning path recommendations
 * CRITICAL: All recommendations must be validated before presenting to users
 */

export function validateLearningProfile(profile) {
  const errors = [];

  if (!profile) {
    errors.push("Learning profile is missing");
    return { valid: false, errors };
  }

  // Performance score must be realistic
  const perfScore = profile.performanceScore ?? 50;
  if (typeof perfScore !== "number" || perfScore < 0 || perfScore > 100) {
    errors.push("Invalid performance score: must be 0-100");
  }

  // Learning speed must be reasonable
  const speed = profile.learningSpeed ?? 1.0;
  if (typeof speed !== "number" || speed < 0.5 || speed > 2.0) {
    errors.push("Invalid learning speed: must be 0.5-2.0");
  }

  // Completed courses must be array of valid IDs
  const completed = profile.completedCourses || [];
  if (!Array.isArray(completed)) {
    errors.push("Completed courses must be an array");
  } else if (!completed.every(c => typeof c === "string" && c.length > 0)) {
    errors.push("Invalid course IDs in completed courses");
  }

  // Current level must be realistic
  const level = profile.currentLevel ?? 1;
  if (typeof level !== "number" || level < 1 || level > 10) {
    errors.push("Current level must be 1-10");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateRecommendations(recommendations, userLevel, completedCourses) {
  const errors = [];

  if (!Array.isArray(recommendations)) {
    errors.push("Recommendations must be an array");
    return { valid: false, errors };
  }

  if (recommendations.length === 0) {
    errors.push("No recommendations generated");
    return { valid: false, errors };
  }

  const completedSet = new Set(completedCourses || []);

  for (let i = 0; i < recommendations.length; i++) {
    const rec = recommendations[i];

    // Validate recommendation structure
    if (!rec.id) {
      errors.push(`Recommendation ${i}: missing course ID`);
      continue;
    }

    // Cannot recommend already-completed courses
    if (completedSet.has(rec.id)) {
      errors.push(`Recommendation ${i}: course already completed`);
    }

    // Difficulty should match user level (allow ±1 level)
    const difficulty = rec.difficulty || 1;
    if (Math.abs(difficulty - userLevel) > 1) {
      errors.push(`Recommendation ${i}: difficulty ${difficulty} too far from user level ${userLevel}`);
    }

    // Validate prerequisites if specified
    if (rec.prerequisites && Array.isArray(rec.prerequisites)) {
      const unmetPrereqs = rec.prerequisites.filter(p => !completedSet.has(p));
      if (unmetPrereqs.length > 0) {
        errors.push(`Recommendation ${i}: prerequisites not met: ${unmetPrereqs.join(", ")}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize and validate recommendation for safe presentation
 */
export function sanitizeRecommendation(rec) {
  if (!rec || typeof rec !== "object") {
    return null;
  }

  return {
    id: String(rec.id || "").trim(),
    title: String(rec.title || "Untitled").trim(),
    description: String(rec.description || "").trim(),
    difficulty: Math.max(1, Math.min(10, rec.difficulty || 1)),
    estimatedHours: Math.max(0, rec.estimatedHours || 0),
    prerequisites: Array.isArray(rec.prerequisites) ? rec.prerequisites.map(String) : [],
    reason: String(rec.reason || "").trim(),
  };
}
