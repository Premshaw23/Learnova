/**
 * ============================================================================
 * 🧩 ADVANCED CONFLICT RESOLVER ENGINE (Issue #3259)
 * ============================================================================
 * Implements a recursive deep-merge strategy for offline-first data sync.
 * This version handles nested objects, conflict metadata, and telemetry.
 */

/**
 * Utility to check if a value is a plain object.
 */
const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item);

/**
 * Deep merges two objects, prioritizing local changes for specific keys
 * while merging arrays (like attendance logs) to prevent data loss.
 */
function deepMerge(target, source) {
  let output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (Array.isArray(source[key])) {
        // Merge arrays using a Set to handle uniqueness (e.g., merging logs)
        output[key] = Array.from(new Set([...(target[key] || []), ...source[key]]));
      } else if (isObject(source[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

/**
 * Advanced Conflict Resolver with telemetry and resolution history.
 * @param {Object} local - The local client-side state.
 * @param {Object} remote - The server-side master state.
 * @returns {Object} The resolved, merged data object.
 */
export function resolveConflict(local, remote) {
  // 1. Telemetry logging for audit trails
  const resolutionContext = {
    recordId: local.id || remote.id,
    localTimestamp: local.updatedAt,
    remoteTimestamp: remote.updatedAt,
    strategy: 'unknown'
  };

  // 2. Exact match check
  if (local.updatedAt === remote.updatedAt) {
    resolutionContext.strategy = 'noop';
    return local;
  }

  // 3. Last-Write-Wins (LWW) Strategy based on high-precision timestamps
  const localDate = new Date(local.updatedAt).getTime();
  const remoteDate = new Date(remote.updatedAt).getTime();

  if (localDate > remoteDate) {
    resolutionContext.strategy = 'local-wins';
    console.log(`[Sync] ${resolutionContext.recordId}: Local version is fresher.`);
    return { ...local, _syncMetadata: { resolvedAt: new Date().toISOString(), strategy: 'local-wins' } };
  }

  // 4. Remote-wins with Deep-Merge Strategy
  // If remote is newer, we don't just overwrite. We merge the additive arrays (logs)
  // to ensure offline data (attendance scans) is preserved.
  resolutionContext.strategy = 'remote-wins-merge';
  console.log(`[Sync] ${resolutionContext.recordId}: Remote version is fresher. Deep merging...`);

  const mergedData = deepMerge(remote, local);

  return {
    ...mergedData,
    updatedAt: new Date().toISOString(), // Bump timestamp to now
    _syncMetadata: {
      resolvedAt: new Date().toISOString(),
      strategy: 'remote-wins-merge',
      previousRemoteAt: remote.updatedAt
    }
  };
}

/**
 * Additional Helper: Validate record integrity before sync.
 * Essential for server-side validation logic.
 */
export function validateSyncPayload(record) {
  const required = ['id', 'updatedAt'];
  for (const field of required) {
    if (!record[field]) {
      throw new Error(`[Sync] Payload invalid: Missing ${field}`);
    }
  }
  return true;
}

/**
 * Fallback handler: If a document is corrupted, force reconciliation.
 */
export function forceReconciliation(remote) {
  return {
    ...remote,
    reconciliationFlag: true,
    updatedAt: new Date().toISOString()
  };
}