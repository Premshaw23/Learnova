/**
 * Compensation Registry
 *
 * Maps `operationType:compensateKey` → a compensation handler that can undo a
 * committed saga step from persisted state alone (e.g., re-deriving the target
 * record from the idempotency key). The reconciliation job uses this registry
 * to dispatch compensation for steps that were committed before a crash.
 *
 * Compensation handlers are registered at module load by the owner of each
 * operation type (e.g. lib/compensationHandlers.js) so they are available in
 * any process that runs the reconciliation job.
 */

const registry = new Map();

/**
 * Registers a compensation handler for a saga step.
 * @param {string} operationType - Saga operation type (e.g., "attendance_record")
 * @param {string} compensateKey - Key declared on the saga step (e.g., "attendance_firestore")
 * @param {(ctx: { operationId: string, op: Object }) => Promise<void>} handler
 */
export function registerCompensation(operationType, compensateKey, handler) {
  if (typeof handler !== "function") return;
  registry.set(`${operationType}:${compensateKey}`, handler);
}

/**
 * Looks up a registered compensation handler, or null.
 * @param {string} operationType
 * @param {string} compensateKey
 */
export function getCompensation(operationType, compensateKey) {
  return registry.get(`${operationType}:${compensateKey}`) || null;
}
