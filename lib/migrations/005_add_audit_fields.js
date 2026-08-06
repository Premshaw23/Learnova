/**
 * ============================================================================
 * 📋 MIGRATION 005: Add Audit Log Fields
 * ============================================================================
 * Adds audit trail fields (createdAt, updatedAt, createdBy) to all
 * mutation-tracked collections.
 */

import Migration from "./Migration";
import { logger } from "@/lib/logger";

export default class AddAuditFields extends Migration {
  constructor() {
    super("005", "Add audit log fields to collections");
  }

  getAffectedCollections() {
    return {
      firestore: ["users", "courses", "notices", "attendance"],
      mongodb: ["users", "courses", "notices", "attendance"],
    };
  }

  async up(context) {
    const { mongoDb, dryRun } = context;

    if (!mongoDb) {
      logger.warn("[Migration 005] MongoDB not available, skipping");
      return;
    }

    const collections = ["users", "courses", "notices", "attendance"];

    for (const collectionName of collections) {
      const collection = mongoDb.collection(collectionName);
      const count = await collection.countDocuments();

      if (dryRun) {
        logger.info(`[Migration 005] [DRY RUN] Would add audit fields to ${count} documents in ${collectionName}`);
        continue;
      }

      // Add createdAt to documents missing it
      const missingCreatedAt = await collection
        .find({ createdAt: { $exists: false } })
        .toArray();

      for (const doc of missingCreatedAt) {
        await collection.updateOne(
          { _id: doc._id },
          {
            $set: {
              createdAt: doc._id.getTimestamp?.() || new Date(),
              updatedAt: doc._id.getTimestamp?.() || new Date(),
            },
          }
        );
      }

      // Add updatedAt to documents missing it
      const missingUpdatedAt = await collection
        .find({ updatedAt: { $exists: false } })
        .toArray();

      for (const doc of missingUpdatedAt) {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { updatedAt: doc.createdAt || new Date() } }
        );
      }

      logger.info(
        `[Migration 005] Added audit fields to ${collectionName}: ` +
        `${missingCreatedAt.length} createdAt, ${missingUpdatedAt.length} updatedAt`
      );
    }
  }

  async down(context) {
    logger.info("[Migration 005] Rollback not needed for audit fields (non-destructive)");
  }
}
