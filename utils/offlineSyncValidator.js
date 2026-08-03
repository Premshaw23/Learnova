/**
 * ============================================================================
 * 🔒 OFFLINE SYNC VALIDATOR (Updated for Issue #4224)
 * ============================================================================
 * Updated to work with the unified offline storage schema.
 * Validates records against the new OfflineRecord structure while
 * maintaining backward compatibility with legacy validation.
 *
 * Key improvements:
 *   - Schema validation for unified OfflineRecord format
 *   - Vector clock validation
 *   - Enhanced fraud detection
 *   - Integration with CRDT conflict resolver
 */

import logger from "./logger";

// ---------------------------------------------------------------------------
// Unified Record Schema Validation
// ---------------------------------------------------------------------------

/**
 * Validate a unified OfflineRecord against the expected schema.
 */
export function validateUnifiedRecord(record) {
  const errors = [];

  if (!record || typeof record !== "object") {
    return { isValid: false, errors: ["Record must be an object"] };
  }

  // Required fields
  if (!record.id || typeof record.id !== "string") {
    errors.push("Missing or invalid 'id' (must be a UUID string)");
  }

  const validTypes = [
    "attendance",
    "quiz",
    "activity",
    "complaint",
    "general",
  ];
  if (!record.type || !validTypes.includes(record.type)) {
    errors.push(`Invalid 'type'. Must be one of: ${validTypes.join(", ")}`);
  }

  if (!record.collection || typeof record.collection !== "string") {
    errors.push("Missing or invalid 'collection'");
  }

  if (!record.data || typeof record.data !== "object") {
    errors.push("Missing or invalid 'data' object");
  }

  if (typeof record.version !== "number" || record.version < 1) {
    errors.push("Missing or invalid 'version' (must be a positive integer)");
  }

  if (!record.vectorClock || typeof record.vectorClock !== "object") {
    errors.push("Missing or invalid 'vectorClock'");
  }

  if (typeof record.updatedAt !== "number") {
    errors.push("Missing or invalid 'updatedAt' (must be epoch ms)");
  }

  if (!record.deviceId || typeof record.deviceId !== "string") {
    errors.push("Missing or invalid 'deviceId'");
  }

  // Validate vector clock structure
  if (record.vectorClock) {
    for (const [node, counter] of Object.entries(record.vectorClock)) {
      if (typeof counter !== "number" || counter < 0) {
        errors.push(`Invalid vector clock counter for node '${node}'`);
      }
    }
  }

  // Validate status
  const validStatuses = [
    "pending",
    "syncing",
    "synced",
    "conflict",
    "failed",
  ];
  if (record.status && !validStatuses.includes(record.status)) {
    errors.push(`Invalid 'status'. Must be one of: ${validStatuses.join(", ")}`);
  }

  // Validate priority
  if (record.priority !== undefined) {
    if (typeof record.priority !== "number" || record.priority < 1) {
      errors.push("Invalid 'priority' (must be a positive integer)");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Legacy Validation (Backward Compatible)
// ---------------------------------------------------------------------------

export class OfflineSyncValidator {
  /**
   * Validate attendance record structure and values (legacy format).
   */
  static validateAttendanceRecord(record) {
    if (!record || typeof record !== "object") {
      return {
        isValid: false,
        reason: "Record must be an object",
      };
    }

    // Handle unified format
    if (record.type === "attendance" && record.data) {
      return this.validateAttendanceRecord(record.data);
    }

    // Validate date format (ISO string)
    if (!record.date || typeof record.date !== "string") {
      return {
        isValid: false,
        reason: "Record must have a valid date field",
      };
    }

    const dateObj = new Date(record.date);
    if (isNaN(dateObj.getTime())) {
      return {
        isValid: false,
        reason: "Date is not a valid ISO format",
      };
    }

    // Date should not be in the future
    if (dateObj > new Date()) {
      return {
        isValid: false,
        reason: "Attendance date cannot be in the future",
      };
    }

    // Validate time format (HH:MM)
    if (record.time) {
      if (
        typeof record.time !== "string" ||
        !/^\d{2}:\d{2}$/.test(record.time)
      ) {
        return {
          isValid: false,
          reason: "Time must be in HH:MM format",
        };
      }
    }

    // Validate status if present
    if (
      record.status &&
      !["present", "absent", "late"].includes(record.status.toLowerCase())
    ) {
      return {
        isValid: false,
        reason: "Status must be present, absent, or late",
      };
    }

    return {
      isValid: true,
      reason: "Attendance record is valid",
    };
  }

  /**
   * Validate progress data consistency.
   */
  static validateProgressConsistency(currentServerData, offlineChanges) {
    if (!currentServerData || typeof currentServerData !== "object") {
      return {
        isValid: false,
        reason: "Server data must be provided for validation",
      };
    }

    if (!Array.isArray(offlineChanges)) {
      return {
        isValid: false,
        reason: "Offline changes must be an array",
      };
    }

    // Validate each change
    for (const change of offlineChanges) {
      if (!change.type || !["add", "update", "delete"].includes(change.type)) {
        return {
          isValid: false,
          reason: "Change type must be add, update, or delete",
          invalidChange: change,
        };
      }

      if (!change.data || typeof change.data !== "object") {
        return {
          isValid: false,
          reason: "Change must have valid data object",
          invalidChange: change,
        };
      }
    }

    // Check for conflicting changes
    const conflictCheck = this.checkForConflicts(
      currentServerData,
      offlineChanges
    );
    if (!conflictCheck.isValid) {
      return conflictCheck;
    }

    return {
      isValid: true,
      reason: "Progress data is consistent",
    };
  }

  /**
   * Detect conflicting or suspicious offline changes.
   */
  static checkForConflicts(serverData, offlineChanges) {
    const suspiciousPatterns = {
      massiveXpGain: false,
      impossibleProgressJump: false,
      timestampTampering: false,
      duplicateChanges: false,
      vectorClockAnomaly: false,
    };

    // Check for duplicate changes
    const changeKeys = new Set();
    for (const change of offlineChanges) {
      const key = `${change.type}:${change.data.id || change.data.date}`;
      if (changeKeys.has(key)) {
        suspiciousPatterns.duplicateChanges = true;
      }
      changeKeys.add(key);
    }

    // Check for massive XP gain
    let totalXpGained = 0;
    const xpChanges = offlineChanges.filter(
      (c) => c.data.xp || (c.data?.data?.xp)
    );
    for (const change of xpChanges) {
      const xp = change.data.xp || change.data?.data?.xp;
      if (typeof xp === "number") {
        totalXpGained += xp;
      }
    }

    if (totalXpGained > 1000) {
      suspiciousPatterns.massiveXpGain = true;
    }

    // Check for impossible progress jumps
    if (
      serverData.level &&
      offlineChanges.some(
        (c) =>
          (c.data.level && c.data.level > serverData.level + 5) ||
          (c.data?.data?.level && c.data.data.level > serverData.level + 5)
      )
    ) {
      suspiciousPatterns.impossibleProgressJump = true;
    }

    // Check for timestamp tampering
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const change of offlineChanges) {
      const date = change.data.date || change.data?.data?.date;
      if (date) {
        const changeDate = new Date(date);
        if (changeDate < thirtyDaysAgo) {
          suspiciousPatterns.timestampTampering = true;
          break;
        }
      }
    }

    // Check for vector clock anomalies
    for (const change of offlineChanges) {
      const vc = change.vectorClock || change.data?.vectorClock;
      if (vc && typeof vc === "object") {
        const counters = Object.values(vc);
        if (counters.some((c) => typeof c !== "number" || c < 0)) {
          suspiciousPatterns.vectorClockAnomaly = true;
          break;
        }
      }
    }

    const hasSuspiciousPatterns = Object.values(suspiciousPatterns).some(
      (v) => v
    );

    if (hasSuspiciousPatterns) {
      return {
        isValid: false,
        reason: "Suspicious patterns detected in offline changes",
        suspiciousPatterns,
      };
    }

    return {
      isValid: true,
      reason: "No conflicts or suspicious patterns detected",
    };
  }

  /**
   * Validate entire offline sync payload (legacy format).
   */
  static validateOfflineSyncPayload(payload, currentServerData) {
    if (!payload || typeof payload !== "object") {
      return {
        isValid: false,
        reason: "Payload must be an object",
        fraudScore: 100,
      };
    }

    // Handle unified record format
    if (payload.type && payload.data) {
      const schemaValidation = validateUnifiedRecord(payload);
      if (!schemaValidation.isValid) {
        return {
          isValid: false,
          reason: schemaValidation.errors.join("; "),
          fraudScore: 75,
        };
      }
    }

    const { userId, timestamp, changes, signature } = payload;

    // Validate required fields
    if (!userId || typeof userId !== "string") {
      return {
        isValid: false,
        reason: "Payload must include valid userId",
        fraudScore: 80,
      };
    }

    if (!timestamp || typeof timestamp !== "string") {
      return {
        isValid: false,
        reason: "Payload must include timestamp",
        fraudScore: 80,
      };
    }

    const payloadTime = new Date(timestamp);
    if (isNaN(payloadTime.getTime())) {
      return {
        isValid: false,
        reason: "Timestamp must be valid ISO format",
        fraudScore: 80,
      };
    }

    // Timestamp should be recent (within last 24 hours)
    const now = new Date();
    const hoursSinceSync = (now - payloadTime) / (1000 * 60 * 60);
    if (hoursSinceSync < 0 || hoursSinceSync > 24) {
      return {
        isValid: false,
        reason: "Sync timestamp is outside acceptable range",
        fraudScore: 70,
        hoursSinceSync,
      };
    }

    // Validate changes array
    if (!Array.isArray(changes) || changes.length === 0) {
      return {
        isValid: false,
        reason: "Payload must include at least one change",
        fraudScore: 60,
      };
    }

    // Validate each change
    for (const change of changes) {
      const validation = this.validateAttendanceRecord(change.data);
      if (!validation.isValid && change.type !== "delete") {
        return {
          isValid: false,
          reason: "Invalid change data",
          fraudScore: 75,
          invalidChange: change,
        };
      }
    }

    // Check for conflicts
    const conflictCheck = this.checkForConflicts(
      currentServerData || {},
      changes
    );
    if (!conflictCheck.isValid) {
      return {
        isValid: false,
        reason: conflictCheck.reason,
        fraudScore: 65,
        suspiciousPatterns: conflictCheck.suspiciousPatterns,
      };
    }

    return {
      isValid: true,
      reason: "Offline sync payload is valid",
      fraudScore: 0,
    };
  }

  /**
   * Generate fraud score (0-100) for offline sync.
   */
  static calculateFraudScore(payload, serverData) {
    let score = 0;

    if (!payload || typeof payload !== "object") score += 100;
    if (!payload.userId) score += 20;
    if (!payload.timestamp) score += 15;
    if (!Array.isArray(payload.changes)) score += 25;

    // Check changes for suspicious patterns
    if (payload.changes) {
      const validation = this.checkForConflicts(
        serverData || {},
        payload.changes
      );
      if (!validation.isValid) {
        if (validation.suspiciousPatterns?.massiveXpGain) score += 30;
        if (validation.suspiciousPatterns?.impossibleProgressJump) score += 35;
        if (validation.suspiciousPatterns?.timestampTampering) score += 40;
        if (validation.suspiciousPatterns?.duplicateChanges) score += 25;
        if (validation.suspiciousPatterns?.vectorClockAnomaly) score += 30;
      }
    }

    return Math.min(100, score);
  }
}

// ---------------------------------------------------------------------------
// Safe Offline Sync Wrapper
// ---------------------------------------------------------------------------

/**
 * Safe offline sync wrapper with validation.
 */
export async function validateAndSyncOfflineProgress(
  payload,
  currentServerData,
  applyChanges
) {
  const validation = OfflineSyncValidator.validateOfflineSyncPayload(
    payload,
    currentServerData
  );
  const fraudScore = OfflineSyncValidator.calculateFraudScore(
    payload,
    currentServerData
  );

  if (!validation.isValid) {
    logger.error("Invalid offline sync attempt", {
      userId: payload?.userId,
      reason: validation.reason,
      fraudScore,
    });

    return {
      success: false,
      reason: validation.reason,
      fraudScore,
      changes: [],
    };
  }

  if (fraudScore > 50) {
    logger.warn("High fraud score for offline sync", {
      userId: payload.userId,
      fraudScore,
      patterns: validation.suspiciousPatterns,
    });
  }

  // Apply validated changes
  if (applyChanges && typeof applyChanges === "function") {
    try {
      const appliedChanges = await applyChanges(payload.changes);

      logger.info("Offline sync successful", {
        userId: payload.userId,
        changesApplied: appliedChanges.length,
        fraudScore,
      });

      return {
        success: true,
        changes: appliedChanges,
        fraudScore,
      };
    } catch (error) {
      logger.error("Error applying offline sync changes", {
        userId: payload.userId,
        error: error.message,
      });

      return {
        success: false,
        reason: "Failed to apply changes",
        fraudScore,
        changes: [],
      };
    }
  }

  return {
    success: true,
    validated: true,
    fraudScore,
    changes: payload.changes,
  };
}

export default {
  validateUnifiedRecord,
  OfflineSyncValidator,
  validateAndSyncOfflineProgress,
};
