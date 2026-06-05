/**
 * lib/learning-path-validation.js
 *
 * Input and output validation for the learning path recommendation engine.
 * Ensures recommendations are accurate, appropriate, and follow educational
 * guidelines to prevent malicious input or algorithm manipulation.
 */

/**
 * Validate user learning profile before generating recommendations.
 * @param {Object} profile - User learning profile
 * @returns {Object} { isValid: boolean, errors?: string[] }
 */
export function validateLearningProfile(profile) {
  const errors = [];

  if (!profile || typeof profile !== "object") {
    return { isValid: false, errors: ["Invalid profile object"] };
  }

  // Validate performance score (0-100)
  const performanceScore = profile.performance_score ?? 50;
  if (
    typeof performanceScore !== "number" ||
    performanceScore < 0 ||
    performanceScore > 100
  ) {
    errors.push("Performance score must be between 0 and 100");
  }

  // Validate learning speed (0.5-2.0 multiplier)
  const learningSpeed = profile.learning_speed ?? 1.0;
  if (
    typeof learningSpeed !== "number" ||
    learningSpeed < 0.5 ||
    learningSpeed > 2.0
  ) {
    errors.push("Learning speed must be between 0.5 and 2.0");
  }

  // Validate completed courses array
  const completedCourses = profile.completed_courses;
  if (completedCourses !== undefined) {
    if (!Array.isArray(completedCourses)) {
      errors.push("Completed courses must be an array");
    } else {
      for (const courseId of completedCourses) {
        if (typeof courseId !== "string" || courseId.trim().length === 0) {
          errors.push("All course IDs must be non-empty strings");
          break;
        }
      }
    }
  }

  // Validate skill level (1-10)
  const skillLevel = profile.skill_level ?? 5;
  if (typeof skillLevel !== "number" || skillLevel < 1 || skillLevel > 10) {
    errors.push("Skill level must be between 1 and 10");
  }

  // Validate learning goals if provided
  const learningGoals = profile.learning_goals;
  if (learningGoals !== undefined) {
    if (!Array.isArray(learningGoals)) {
      errors.push("Learning goals must be an array");
    } else if (learningGoals.length > 10) {
      errors.push("Maximum 10 learning goals allowed");
    } else {
      for (const goal of learningGoals) {
        if (typeof goal !== "string" || goal.trim().length === 0) {
          errors.push("All learning goals must be non-empty strings");
          break;
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validate a single course recommendation.
 * @param {Object} recommendation - Course recommendation
 * @param {number} userSkillLevel - User's current skill level (1-10)
 * @returns {Object} { isValid: boolean, errors?: string[] }
 */
export function validateRecommendation(recommendation, userSkillLevel) {
  const errors = [];

  if (!recommendation || typeof recommendation !== "object") {
    return { isValid: false, errors: ["Invalid recommendation object"] };
  }

  // Validate course ID
  if (!recommendation.courseId || typeof recommendation.courseId !== "string") {
    errors.push("Course ID is required and must be a string");
  }

  // Validate difficulty (must be reasonable for user)
  const difficulty = recommendation.difficulty;
  if (typeof difficulty !== "number" || difficulty < 1 || difficulty > 10) {
    errors.push("Course difficulty must be between 1 and 10");
  } else if (difficulty > userSkillLevel + 2) {
    errors.push(
      `Course difficulty ${difficulty} is too high for skill level ${userSkillLevel}`
    );
  }

  // Validate estimated duration (in minutes)
  const duration = recommendation.estimatedDurationMinutes;
  if (duration !== undefined) {
    if (typeof duration !== "number" || duration < 5 || duration > 480) {
      errors.push("Estimated duration must be between 5 and 480 minutes");
    }
  }

  // Validate relevance score (0-1)
  const relevance = recommendation.relevanceScore;
  if (relevance !== undefined) {
    if (typeof relevance !== "number" || relevance < 0 || relevance > 1) {
      errors.push("Relevance score must be between 0 and 1");
    }
  }

  // Validate prerequisites if provided
  const prerequisites = recommendation.prerequisites;
  if (prerequisites !== undefined) {
    if (!Array.isArray(prerequisites)) {
      errors.push("Prerequisites must be an array");
    } else {
      for (const prereq of prerequisites) {
        if (typeof prereq !== "string" || prereq.trim().length === 0) {
          errors.push("All prerequisite IDs must be non-empty strings");
          break;
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validate all recommendations in a learning path.
 * @param {Array} recommendations - Array of course recommendations
 * @param {number} userSkillLevel - User's current skill level
 * @param {Array} completedCourses - Courses already completed by user
 * @returns {Object} { isValid: boolean, errors?: string[] }
 */
export function validateLearningPath(
  recommendations,
  userSkillLevel,
  completedCourses = []
) {
  const errors = [];

  if (!Array.isArray(recommendations)) {
    return { isValid: false, errors: ["Recommendations must be an array"] };
  }

  if (recommendations.length === 0) {
    return {
      isValid: false,
      errors: ["At least one recommendation is required"],
    };
  }

  if (recommendations.length > 20) {
    errors.push("Maximum 20 recommendations per learning path");
  }

  // Validate each recommendation
  for (let i = 0; i < recommendations.length; i++) {
    const rec = recommendations[i];
    const validation = validateRecommendation(rec, userSkillLevel);

    if (!validation.isValid) {
      errors.push(`Recommendation ${i}: ${validation.errors.join("; ")}`);
    }

    // Check for duplicates
    const previousIds = recommendations.slice(0, i).map((r) => r.courseId);
    if (previousIds.includes(rec.courseId)) {
      errors.push(`Recommendation ${i}: Duplicate course ${rec.courseId}`);
    }

    // Check if already completed
    if (completedCourses.includes(rec.courseId)) {
      errors.push(`Recommendation ${i}: Course already completed`);
    }
  }

  // Validate progression (difficulty should generally increase)
  for (let i = 1; i < recommendations.length; i++) {
    const prevDifficulty = recommendations[i - 1].difficulty || 0;
    const currDifficulty = recommendations[i].difficulty || 0;

    if (currDifficulty < prevDifficulty - 1) {
      // Allow slight difficulty decreases but flag large backward steps
      errors.push(
        `Recommendation ${i}: Significant difficulty drop from ${prevDifficulty} to ${currDifficulty}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Sanitize recommendation data to prevent injection or manipulation.
 * @param {Object} recommendation - Course recommendation to sanitize
 * @returns {Object} Sanitized recommendation
 */
export function sanitizeRecommendation(recommendation) {
  return {
    courseId: String(recommendation.courseId || "").trim(),
    difficulty: Math.min(
      10,
      Math.max(1, Number(recommendation.difficulty) || 5)
    ),
    relevanceScore: Math.min(
      1,
      Math.max(0, Number(recommendation.relevanceScore) || 0.5)
    ),
    estimatedDurationMinutes: Math.min(
      480,
      Math.max(5, Number(recommendation.estimatedDurationMinutes) || 60)
    ),
    prerequisites: Array.isArray(recommendation.prerequisites)
      ? recommendation.prerequisites
          .map((p) => String(p).trim())
          .filter((p) => p)
      : [],
  };
}

/**
 * Validate and sanitize entire learning path recommendation.
 * @param {Array} recommendations - Raw recommendations from algorithm
 * @param {Object} userProfile - User learning profile
 * @returns {Object} { isValid: boolean, sanitized?: Array, errors?: string[] }
 */
export function validateAndSanitizeRecommendations(
  recommendations,
  userProfile
) {
  // First validate the profile
  const profileValidation = validateLearningProfile(userProfile);
  if (!profileValidation.isValid) {
    return {
      isValid: false,
      errors: profileValidation.errors,
    };
  }

  // Then validate the learning path
  const pathValidation = validateLearningPath(
    recommendations,
    userProfile.skill_level || 5,
    userProfile.completed_courses || []
  );

  if (!pathValidation.isValid) {
    return {
      isValid: false,
      errors: pathValidation.errors,
    };
  }

  // Sanitize each recommendation
  const sanitized = recommendations.map(sanitizeRecommendation);

  return {
    isValid: true,
    sanitized,
  };
}
