import { connectDb } from "@/lib/mongodb";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { logger } from "@/lib/logger";

/**
 * TransactionCoordinator
 *
 * Implements the saga pattern for cross-database writes across Firebase Auth,
 * Firestore, and MongoDB. Each multi-database operation is broken into steps
 * with compensating actions. If any step fails, compensating actions execute
 * in reverse order with exponential-backoff retries.
 *
 * Tracks in-flight operations in a `pending_operations` MongoDB collection
 * so a background reconciliation job can detect and repair orphaned states.
 */

const MAX_COMPENSATION_RETRIES = 3;
const COMPENSATION_BASE_DELAY_MS = 500;

/**
 * Generates a unique idempotency key for an operation.
 * @param {string} prefix - Operation type prefix (e.g., "set_role", "bulk_import")
 * @param {string} uid - User identifier
 * @returns {string} Unique idempotency key
 */
export function generateIdempotencyKey(prefix, uid) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${uid}_${timestamp}_${random}`;
}

/**
 * Records a pending operation in MongoDB for tracking.
 * @param {Object} params
 * @param {string} params.operationId - Unique operation identifier
 * @param {string} params.operationType - Type of operation (e.g., "set_role", "register")
 * @param {string} params.uid - Firebase UID of the user
 * @param {Array<Object>} params.steps - Planned steps for the operation
 */
async function recordPendingOperation({ operationId, operationType, uid, steps }) {
  try {
    const db = await connectDb();
    await db.collection("pending_operations").updateOne(
      { operationId },
      {
        $set: {
          operationType,
          uid,
          status: "in_progress",
          steps: steps.map((s) => ({ ...s, status: "pending" })),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    logger.error("[TransactionCoordinator] Failed to record pending operation:", {
      operationId,
      error: err.message,
    });
  }
}

/**
 * Updates the status of a pending operation.
 * @param {string} operationId
 * @param {string} status - "completed", "failed", "compensating"
 * @param {Object} [metadata] - Additional metadata to store
 */
async function updatePendingOperation(operationId, status, metadata = {}) {
  try {
    const db = await connectDb();
    await db.collection("pending_operations").updateOne(
      { operationId },
      {
        $set: { status, updatedAt: new Date(), ...metadata },
      }
    );
  } catch (err) {
    logger.error("[TransactionCoordinator] Failed to update pending operation:", {
      operationId,
      error: err.message,
    });
  }
}

/**
 * Marks a specific step within a pending operation as completed.
 * @param {string} operationId
 * @param {number} stepIndex
 */
async function markStepCompleted(operationId, stepIndex) {
  try {
    const db = await connectDb();
    await db.collection("pending_operations").updateOne(
      { operationId },
      {
        $set: {
          [`steps.${stepIndex}.status`]: "completed",
          updatedAt: new Date(),
        },
      }
    );
  } catch (err) {
    logger.error("[TransactionCoordinator] Failed to mark step completed:", {
      operationId,
      stepIndex,
      error: err.message,
    });
  }
}

/**
 * Executes a compensating action with retries.
 * @param {Function} compensator - The compensating function to execute
 * @param {string} description - Human-readable description for logging
 * @param {string} operationId
 * @returns {Promise<boolean>} Whether compensation succeeded
 */
async function executeCompensation(compensator, description, operationId) {
  for (let attempt = 1; attempt <= MAX_COMPENSATION_RETRIES; attempt++) {
    try {
      await compensator();
      logger.info(`[TransactionCoordinator] Compensation succeeded: ${description}`, {
        operationId,
        attempt,
      });
      return true;
    } catch (err) {
      logger.error(`[TransactionCoordinator] Compensation failed (attempt ${attempt}/${MAX_COMPENSATION_RETRIES}): ${description}`, {
        operationId,
        error: err.message,
      });
      if (attempt < MAX_COMPENSATION_RETRIES) {
        const delay = COMPENSATION_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error(`[TransactionCoordinator] Compensation FAILED after ${MAX_COMPENSATION_RETRIES} attempts: ${description}`, {
    operationId,
  });
  return false;
}

/**
 * Executes a multi-database saga with compensating transactions.
 *
 * Each step receives a shared `context` object that persists across steps,
 * allowing steps to pass data to later steps (e.g., a blob URL created in
 * step 1 used by step 2). Callers store cross-step state on `ctx` instead
 * of referencing the saga's return value (which is not yet assigned when
 * steps execute).
 *
 * @param {Object} params
 * @param {string} params.operationType - Type of operation for tracking
 * @param {string} params.uid - Firebase UID
 * @param {Array<Object>} params.steps - Ordered list of steps to execute.
 *   Each step: { name: string, execute: (ctx) => Promise, compensate: (ctx) => Promise }
 * @returns {Promise<Object>} Result of the saga execution, with `context` attached
 *
 * @example
 * const result = await executeSaga({
 *   operationType: "register",
 *   uid: decodedToken.uid,
 *   steps: [
 *     {
 *       name: "upload_blob",
 *       execute: async (ctx) => {
 *         const blob = await put(fileName, buffer, { ... });
 *         ctx.blobUrl = blob.url;
 *       },
 *       compensate: async (ctx) => {
 *         if (ctx.blobUrl) await del(ctx.blobUrl);
 *       },
 *     },
 *     {
 *       name: "write_mongodb",
 *       execute: async (ctx) => {
 *         await db.collection("users").insertOne({ image: ctx.blobUrl, ... });
 *       },
 *       compensate: async (ctx) => {
 *         if (ctx.insertedId) await db.collection("users").deleteOne({ _id: ctx.insertedId });
 *       },
 *     },
 *   ],
 * });
 * // result.context contains the shared context object
 */
export async function executeSaga({ operationType, uid, steps, idempotencyKey }) {
  const operationId = idempotencyKey || generateIdempotencyKey(operationType, uid);

  if (idempotencyKey) {
    try {
      const db = await connectDb();
      const existingOp = await db.collection("pending_operations").findOne({ operationId });
      if (existingOp) {
        if (existingOp.status === "in_progress" || existingOp.status === "compensating") {
          const { AppError } = await import("@/lib/errors");
          throw new AppError("Operation already in progress.", 409);
        }
        if (existingOp.status === "completed" || existingOp.status === "idempotent") {
          return {
            success: true,
            operationId,
            context: existingOp.idempotentResult || existingOp.context || {},
          };
        }
      }
    } catch (err) {
      if (err.statusCode === 409) throw err;
      logger.error("[TransactionCoordinator] Error checking existing operation:", {
        operationId,
        error: err.message,
      });
    }
  }

  await recordPendingOperation({
    operationId,
    operationType,
    uid,
    steps: steps.map((s) => ({ name: s.name })),
  });

  const completedSteps = [];
  const context = {};

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        await step.execute(context);
        completedSteps.push(i);
        await markStepCompleted(operationId, i);
      } catch (stepError) {
        logger.error(`[TransactionCoordinator] Step "${step.name}" failed:`, {
          operationId,
          stepIndex: i,
          error: stepError.message,
        });

        // Execute compensating actions in reverse order
        await updatePendingOperation(operationId, "compensating");
        const compensationResults = [];

        for (let j = completedSteps.length - 1; j >= 0; j--) {
          const completedStepIndex = completedSteps[j];
          const compensator = steps[completedStepIndex].compensate;
          if (compensator) {
            const succeeded = await executeCompensation(
              () => compensator(context),
              steps[completedStepIndex].name,
              operationId
            );
            compensationResults.push({
              step: steps[completedStepIndex].name,
              succeeded,
            });
          }
        }

        const allCompensated = compensationResults.every((r) => r.succeeded);
        await updatePendingOperation(operationId, "failed", {
          failedStep: step.name,
          error: stepError.message,
          compensationResults,
          fullyCompensated: allCompensated,
        });

        return {
          success: false,
          operationId,
          failedStep: step.name,
          error: stepError.message,
          compensationResults,
          fullyCompensated: allCompensated,
          context,
        };
      }
    }

    await updatePendingOperation(operationId, "completed");
    return { success: true, operationId, context };
  } catch (sagaError) {
    logger.error("[TransactionCoordinator] Unexpected saga error:", {
      operationId,
      error: sagaError.message,
    });
    await updatePendingOperation(operationId, "failed", {
      error: sagaError.message,
    });
    throw sagaError;
  }
}

/**
 * Checks for an existing completed operation with the given idempotency key.
 * Prevents duplicate side-effects from retried requests.
 *
 * @param {string} idempotencyKey
 * @returns {Promise<Object|null>} The existing operation record, or null
 */
export async function findExistingOperation(idempotencyKey) {
  try {
    const db = await connectDb();
    return await db.collection("pending_operations").findOne({
      operationId: idempotencyKey,
      status: { $in: ["completed", "idempotent"] },
    });
  } catch {
    return null;
  }
}

/**
 * Marks an operation as idempotent-completed (for dedup on retry).
 * @param {string} idempotencyKey
 * @param {Object} result - The original result to return on duplicate
 */
export async function markIdempotent(idempotencyKey, result) {
  try {
    const db = await connectDb();
    await db.collection("pending_operations").updateOne(
      { operationId: idempotencyKey },
      {
        $set: {
          status: "idempotent",
          idempotentResult: result,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    logger.error("[TransactionCoordinator] Failed to mark idempotent:", {
      idempotencyKey,
      error: err.message,
    });
  }
}

/**
 * Retrieves pending operations that have been stuck in "in_progress" or
 * "compensating" status beyond the timeout threshold.
 *
 * @param {number} [timeoutMs=300000] - Max age before an operation is considered stuck
 * @returns {Promise<Array>} List of stale pending operations
 */
export async function findStaleOperations(timeoutMs = 300000) {
  try {
    const db = await connectDb();
    const cutoff = new Date(Date.now() - timeoutMs);
    return await db
      .collection("pending_operations")
      .find({
        status: { $in: ["in_progress", "compensating"] },
        updatedAt: { $lt: cutoff },
      })
      .toArray();
  } catch {
    return [];
  }
}

/**
 * Cleans up old pending operations to prevent unbounded collection growth.
 * @param {number} [maxAgeMs=7 * 24 * 60 * 60 * 1000] - Max age (default 7 days)
 */
export async function cleanupOldOperations(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  try {
    const db = await connectDb();
    const cutoff = new Date(Date.now() - maxAgeMs);
    const result = await db
      .collection("pending_operations")
      .deleteMany({
        createdAt: { $lt: cutoff },
        status: { $in: ["completed", "idempotent", "failed"] },
      });
    if (result.deletedCount > 0) {
      logger.info(`[TransactionCoordinator] Cleaned up ${result.deletedCount} old pending operations`);
    }
  } catch (err) {
    logger.error("[TransactionCoordinator] Failed to cleanup old operations:", {
      error: err.message,
    });
  }
}
