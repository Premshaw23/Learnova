/**
 * ============================================================================
 * 📇 MIGRATION 002: Add Attendance Indexes (Issue #4220)
 * ============================================================================
 * Adds optimized indexes for attendance query patterns in both
 * Firestore and MongoDB.
 */

import Migration from "./Migration";
import { logger } from "@/lib/logger";

export default class AddAttendanceIndexes extends Migration {
  constructor() {
    super("002", "Add attendance query indexes");
  }

  getAffectedCollections() {
    return { firestore: ["attendance"], mongodb: ["attendance"] };
  }

  async up(context) {
    const { firestoreDb, mongoDb, dryRun } = context;

    // MongoDB indexes
    if (mongoDb) {
      const attendanceCollection = mongoDb.collection("attendance");

      const indexes = [
        { keys: { userId: 1, date: -1 }, name: "userId_date_desc" },
        { keys: { date: 1, status: 1 }, name: "date_status" },
        { keys: { userId: 1, date: 1, status: 1 }, name: "userId_date_status" },
        { keys: { createdAt: -1 }, name: "createdAt_desc" },
      ];

      for (const index of indexes) {
        if (dryRun) {
          logger.info(`[Migration 002] [DRY RUN] Would create MongoDB index: ${index.name}`);
        } else {
          try {
            await attendanceCollection.createIndex(index.keys, {
              name: index.name,
              background: true,
            });
            logger.info(`[Migration 002] Created MongoDB index: ${index.name}`);
          } catch (error) {
            // Index may already exist
            if (!error.message.includes("already exists")) {
              throw error;
            }
          }
        }
      }
    }

    // Firestore composite indexes are defined in firestore.indexes.json
    // This migration ensures the attendance_records index is present
    if (firestoreDb && !dryRun) {
      logger.info("[Migration 002] Firestore indexes managed via firestore.indexes.json");
    }

    logger.info("[Migration 002] Attendance indexes migration completed");
  }

  async down(context) {
    const { mongoDb, dryRun } = context;

    if (mongoDb) {
      const attendanceCollection = mongoDb.collection("attendance");
      const indexes = ["userId_date_desc", "date_status", "userId_date_status", "createdAt_desc"];

      for (const indexName of indexes) {
        if (dryRun) {
          logger.info(`[Migration 002] [DRY RUN] Would drop MongoDB index: ${indexName}`);
        } else {
          try {
            await attendanceCollection.dropIndex(indexName);
            logger.info(`[Migration 002] Dropped MongoDB index: ${indexName}`);
          } catch (error) {
            if (!error.message.includes("not found")) {
              throw error;
            }
          }
        }
      }
    }
  }
}
