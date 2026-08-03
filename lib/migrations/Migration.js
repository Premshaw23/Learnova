/**
 * ============================================================================
 * 📦 BASE MIGRATION CLASS (Issue #4225)
 * ============================================================================
 * Abstract base class for all database migrations.
 * Each migration must implement up() and down() methods.
 */

import { logger } from "@/lib/logger";

export default class Migration {
  /**
   * @param {string} id - Unique migration identifier (e.g., "001")
   * @param {string} name - Human-readable migration name
   */
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.startedAt = null;
    this.completedAt = null;
  }

  /**
   * Apply the migration. Must be implemented by subclasses.
   * @param {Object} context - { firestoreDb, mongoDb, dryRun }
   */
  async up(context) {
    throw new Error(`Migration ${this.id}: up() not implemented`);
  }

  /**
   * Rollback the migration. Must be implemented by subclasses.
   * @param {Object} context - { firestoreDb, mongoDb, dryRun }
   */
  async down(context) {
    throw new Error(`Migration ${this.id}: down() not implemented`);
  }

  /**
   * Validate that the migration can be applied.
   * Override in subclasses for pre-flight checks.
   * @returns {Promise<{ canApply: boolean, reason?: string }>}
   */
  async validate() {
    return { canApply: true };
  }

  /**
   * Get the collections affected by this migration.
   * Override in subclasses.
   * @returns {{ firestore: string[], mongodb: string[] }}
   */
  getAffectedCollections() {
    return { firestore: [], mongodb: [] };
  }

  /**
   * Execute the migration with timing and error handling.
   */
  async execute(context, direction = "up") {
    const method = direction === "up" ? "up" : "down";
    this.startedAt = new Date();

    logger.info(`[Migration] Starting ${direction}: ${this.id} - ${this.name}`);

    try {
      // Validate first
      const validation = await this.validate();
      if (!validation.canApply) {
        throw new Error(`Validation failed: ${validation.reason}`);
      }

      // Execute
      await this[method](context);

      this.completedAt = new Date();
      const duration = this.completedAt - this.startedAt;
      logger.info(`[Migration] Completed ${direction}: ${this.id} in ${duration}ms`);

      return { success: true, duration };
    } catch (error) {
      this.completedAt = new Date();
      logger.error(`[Migration] Failed ${direction}: ${this.id}`, { error: error.message });
      return { success: false, error: error.message };
    }
  }
}
