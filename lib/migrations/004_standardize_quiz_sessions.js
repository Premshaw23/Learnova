/**
 * ============================================================================
 * 📝 MIGRATION 004: Standardize Quiz Session Schema
 * ============================================================================
 * Standardizes the quiz session schema across Firestore and MongoDB.
 * Adds missing fields and ensures consistent structure.
 */

import Migration from "./Migration";
import { logger } from "@/lib/logger";

export default class StandardizeQuizSessions extends Migration {
  constructor() {
    super("004", "Standardize quiz session schema");
  }

  getAffectedCollections() {
    return { firestore: ["quizzes"], mongodb: ["quizzes"] };
  }

  async up(context) {
    const { mongoDb, dryRun } = context;

    if (!mongoDb) {
      logger.warn("[Migration 004] MongoDB not available, skipping");
      return;
    }

    const quizzes = await mongoDb.collection("quizzes").find({}).toArray();
    logger.info(`[Migration 004] Processing ${quizzes.length} quiz sessions`);

    let updated = 0;

    for (const quiz of quizzes) {
      const updates = {};

      // Add status field if missing
      if (!quiz.status) {
        updates.status = quiz.completed ? "completed" : "in_progress";
      }

      // Add timestamps if missing
      if (!quiz.createdAt) {
        updates.createdAt = quiz._id.getTimestamp?.() || new Date();
      }
      if (!quiz.updatedAt) {
        updates.updatedAt = quiz._id.getTimestamp?.() || new Date();
      }

      // Normalize score field
      if (quiz.score !== undefined && quiz.percentage === undefined) {
        updates.percentage = quiz.score;
      }

      if (Object.keys(updates).length > 0) {
        if (dryRun) {
          logger.info(`[Migration 004] [DRY RUN] Would update quiz ${quiz._id} with: ${Object.keys(updates).join(", ")}`);
        } else {
          await mongoDb.collection("quizzes").updateOne(
            { _id: quiz._id },
            { $set: updates }
          );
        }
        updated++;
      }
    }

    logger.info(`[Migration 004] Standardized ${updated} quiz sessions`);
  }

  async down(context) {
    logger.info("[Migration 004] Rollback not needed for schema standardization");
  }
}
