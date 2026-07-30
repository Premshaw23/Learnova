/**
 * ============================================================================
 * 🚀 MIGRATION RUNNER (Issue #4225)
 * ============================================================================
 * Core migration execution engine. Manages the migration lifecycle:
 * discovery, validation, execution, rollback, and history tracking.
 */

import { connectDb } from "@/lib/mongodb";
import { getAdminDb } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import {
  getAppliedIds,
  recordMigration,
  getMigrationStatus,
} from "./MigrationHistory";

// ---------------------------------------------------------------------------
// Lock Management
// ---------------------------------------------------------------------------

const LOCK_COLLECTION = "migration_lock";
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

async function acquireLock(environment) {
  const db = await connectDb();
  const now = new Date();

  // Check for existing lock
  const existing = await db.collection(LOCK_COLLECTION).findOne({ environment });
  if (existing) {
    const lockAge = now - existing.lockedAt;
    if (lockAge < LOCK_TIMEOUT_MS) {
      return { acquired: false, lockedBy: existing.lockedBy, lockAge };
    }
    // Lock is stale, force release
    logger.warn(`[MigrationRunner] Releasing stale lock (age: ${lockAge}ms)`);
  }

  // Try to acquire
  const result = await db.collection(LOCK_COLLECTION).updateOne(
    { environment },
    {
      $set: {
        environment,
        lockedAt: now,
        lockedBy: `pid-${process.pid}`,
      },
    },
    { upsert: true }
  );

  return { acquired: true };
}

async function releaseLock(environment) {
  try {
    const db = await connectDb();
    await db.collection(LOCK_COLLECTION).deleteOne({ environment });
  } catch (error) {
    logger.error("[MigrationRunner] Failed to release lock:", { error: error.message });
  }
}

// ---------------------------------------------------------------------------
// Migration Registry
// ---------------------------------------------------------------------------

/**
 * Register all available migrations here.
 * Import them and add to the array in order.
 */
let registeredMigrations = [];

export function registerMigrations(migrations) {
  registeredMigrations = migrations;
}

export function getRegisteredMigrations() {
  return [...registeredMigrations];
}

// ---------------------------------------------------------------------------
// Core Runner
// ---------------------------------------------------------------------------

/**
 * Run all pending migrations.
 * @param {Object} options
 * @param {boolean} [options.dryRun=false] - Show what would be done without applying
 * @param {string} [options.environment='production']
 * @param {string} [options.direction='up'] - 'up' or 'down'
 */
export async function runMigrations(options = {}) {
  const {
    dryRun = false,
    environment = process.env.NODE_ENV || "production",
    direction = "up",
  } = options;

  logger.info(`[MigrationRunner] Starting migration run (${direction}) for ${environment}`);

  // Acquire lock
  const lock = await acquireLock(environment);
  if (!lock.acquired) {
    return {
      success: false,
      error: `Could not acquire migration lock (held by: ${lock.lockedBy})`,
    };
  }

  try {
    // Get applied migrations
    const appliedIds = await getAppliedIds(environment);

    // Filter migrations based on direction
    let pending;
    if (direction === "up") {
      pending = registeredMigrations.filter((m) => !appliedIds.has(m.id));
    } else {
      // For rollback, get applied in reverse order
      const appliedList = registeredMigrations.filter((m) => appliedIds.has(m.id));
      pending = appliedList.reverse();
    }

    if (pending.length === 0) {
      return { success: true, applied: [], skipped: [], message: "No pending migrations" };
    }

    logger.info(`[MigrationRunner] Found ${pending.length} pending migrations`);

    // Get database connections
    let firestoreDb = null;
    try {
      firestoreDb = getAdminDb();
    } catch (error) {
      logger.warn("[MigrationRunner] Firestore not available:", { error: error.message });
    }

    const mongoDb = await connectDb();
    const context = { firestoreDb, mongoDb, dryRun, environment };

    const results = { applied: [], failed: [], skipped: [] };

    for (const migration of pending) {
      if (dryRun) {
        const affected = migration.getAffectedCollections();
        results.applied.push({
          id: migration.id,
          name: migration.name,
          dryRun: true,
          affectedCollections: affected,
        });
        logger.info(`[MigrationRunner] [DRY RUN] Would apply: ${migration.id} - ${migration.name}`);
        continue;
      }

      const startTime = Date.now();
      const result = await migration.execute(context, direction);
      const duration = Date.now() - startTime;

      if (result.success) {
        const affected = migration.getAffectedCollections();
        await recordMigration({
          migrationId: migration.id,
          name: migration.name,
          environment,
          direction,
          duration,
          affectedCollections: affected,
          status: "success",
        });
        results.applied.push({ id: migration.id, name: migration.name, duration });
      } else {
        await recordMigration({
          migrationId: migration.id,
          name: migration.name,
          environment,
          direction,
          duration,
          affectedCollections: [],
          status: "failed",
          error: result.error,
        });
        results.failed.push({ id: migration.id, name: migration.name, error: result.error });

        // Stop on failure (no auto-rollback to avoid cascading issues)
        logger.error(`[MigrationRunner] Stopping due to failure at ${migration.id}`);
        break;
      }
    }

    return {
      success: results.failed.length === 0,
      ...results,
    };
  } finally {
    await releaseLock(environment);
  }
}

/**
 * Rollback the last N migrations.
 */
export async function rollbackMigrations(count = 1, environment = "production") {
  const status = await getMigrationStatus(environment);
  const applied = status.migrations.filter((m) => m.status === "success");

  if (applied.length === 0) {
    return { success: true, message: "No migrations to rollback" };
  }

  const toRollback = applied.slice(-count);
  const migrationIds = toRollback.map((m) => m.migrationId);

  // Temporarily override registeredMigrations to only include rollback targets
  const originalRegistered = [...registeredMigrations];
  const rollbackList = registeredMigrations.filter((m) =>
    migrationIds.includes(m.id)
  );

  if (rollbackList.length === 0) {
    return { success: false, error: "Could not find migration objects for rollback" };
  }

  // Override to only rollback specific migrations
  registeredMigrations.length = 0;
  registeredMigrations.push(...rollbackList);

  try {
    return await runMigrations({
      dryRun: false,
      environment,
      direction: "down",
    });
  } finally {
    // Restore original registrations
    registeredMigrations.length = 0;
    registeredMigrations.push(...originalRegistered);
  }
}

/**
 * Get current migration status.
 */
export async function getMigrationRunnerStatus(environment = "production") {
  const status = await getMigrationStatus(environment);
  const allIds = registeredMigrations.map((m) => m.id);
  const appliedIds = status.migrations
    .filter((m) => m.status === "success")
    .map((m) => m.migrationId);

  const pending = registeredMigrations.filter((m) => !appliedIds.includes(m.id));

  return {
    ...status,
    totalRegistered: registeredMigrations.length,
    pending: pending.map((m) => ({ id: m.id, name: m.name })),
  };
}
