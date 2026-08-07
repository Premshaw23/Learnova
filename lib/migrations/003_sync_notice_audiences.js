/**
 * ============================================================================
 * 📢 MIGRATION 003: Sync Notice Board Audiences
 * ============================================================================
 * Synchronizes notice board audience targeting between Firestore and MongoDB.
 * Ensures both databases have consistent audience arrays.
 */

import Migration from "./Migration";
import { logger } from "@/lib/logger";

export default class SyncNoticeAudiences extends Migration {
  constructor() {
    super("003", "Sync notice board audience targeting");
  }

  getAffectedCollections() {
    return { firestore: ["notices"], mongodb: ["notices"] };
  }

  async up(context) {
    const { firestoreDb, mongoDb, dryRun } = context;

    if (!mongoDb) {
      logger.warn("[Migration 003] MongoDB not available, skipping");
      return;
    }

    const mongoNotices = await mongoDb.collection("notices").find({}).toArray();
    logger.info(`[Migration 003] Processing ${mongoNotices.length} notices`);

    let updated = 0;

    for (const notice of mongoNotices) {
      // Ensure targetAudience is an array (some old records may have string)
      let audience = notice.targetAudience || notice.audience || [];

      if (typeof audience === "string") {
        audience = [audience];
      }

      // Normalize: ensure lowercase, remove duplicates
      const normalized = [...new Set(audience.map((a) => a.toLowerCase()))];

      // Ensure at least one audience
      if (normalized.length === 0) {
        normalized.push("all");
      }

      if (JSON.stringify(normalized) !== JSON.stringify(audience)) {
        if (dryRun) {
          logger.info(`[Migration 003] [DRY RUN] Would normalize audience for notice ${notice._id}`);
        } else {
          await mongoDb.collection("notices").updateOne(
            { _id: notice._id },
            { $set: { targetAudience: normalized } }
          );
        }
        updated++;
      }
    }

    logger.info(`[Migration 003] Normalized ${updated} notice audiences`);
  }

  async down(context) {
    // No rollback needed - normalization is idempotent
    logger.info("[Migration 003] Rollback not needed for audience normalization");
  }
}
