/**
 * ============================================================================
 * 📜 MIGRATION HISTORY TRACKER (Issue #4225)
 * ============================================================================
 * Tracks which migrations have been applied per environment.
 * Stored in MongoDB `migration_history` collection.
 */

import { connectDb } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

const COLLECTION = "migration_history";

/**
 * Get all applied migrations for the current environment.
 */
export async function getAppliedMigrations(environment = "production") {
  try {
    const db = await connectDb();
    const records = await db
      .collection(COLLECTION)
      .find({ environment })
      .sort({ appliedAt: 1 })
      .toArray();
    return records;
  } catch (error) {
    logger.error("[MigrationHistory] Failed to get applied migrations:", { error: error.message });
    return [];
  }
}

/**
 * Get the set of applied migration IDs for the current environment.
 */
export async function getAppliedIds(environment = "production") {
  const records = await getAppliedMigrations(environment);
  return new Set(records.map((r) => r.migrationId));
}

/**
 * Record that a migration has been applied.
 */
export async function recordMigration({
  migrationId,
  name,
  environment = "production",
  direction = "up",
  duration,
  affectedCollections,
  status = "success",
  error,
}) {
  try {
    const db = await connectDb();

    if (direction === "up") {
      await db.collection(COLLECTION).insertOne({
        migrationId,
        name,
        environment,
        direction,
        duration,
        affectedCollections,
        status,
        error: error || null,
        appliedAt: new Date(),
      });
    } else {
      // For rollback, remove the record
      await db.collection(COLLECTION).deleteOne({
        migrationId,
        environment,
      });
    }

    logger.info(`[MigrationHistory] Recorded ${direction} for ${migrationId} (${status})`);
  } catch (error) {
    logger.error("[MigrationHistory] Failed to record migration:", { error: error.message });
    throw error;
  }
}

/**
 * Get migration status summary.
 */
export async function getMigrationStatus(environment = "production") {
  try {
    const db = await connectDb();
    const records = await db
      .collection(COLLECTION)
      .find({ environment })
      .sort({ appliedAt: 1 })
      .toArray();

    const applied = records.filter((r) => r.status === "success");
    const failed = records.filter((r) => r.status === "failed");

    return {
      environment,
      totalApplied: applied.length,
      totalFailed: failed.length,
      lastMigration: applied[applied.length - 1] || null,
      migrations: records,
    };
  } catch (error) {
    logger.error("[MigrationHistory] Failed to get status:", { error: error.message });
    return { environment, totalApplied: 0, totalFailed: 0, lastMigration: null, migrations: [] };
  }
}

/**
 * Clear migration history (use with caution).
 */
export async function clearHistory(environment = "production") {
  try {
    const db = await connectDb();
    const result = await db.collection(COLLECTION).deleteMany({ environment });
    logger.warn(`[MigrationHistory] Cleared ${result.deletedCount} records for ${environment}`);
    return result.deletedCount;
  } catch (error) {
    logger.error("[MigrationHistory] Failed to clear history:", { error: error.message });
    throw error;
  }
}
