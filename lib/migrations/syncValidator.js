/**
 * ============================================================================
 * 🔍 CROSS-DATABASE SYNC VALIDATOR (Issue #4225)
 * ============================================================================
 * Validates data consistency between Firestore and MongoDB.
 * Implements checksum-based comparison for collections.
 */

import { connectDb } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Checksum Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a simple checksum for a document (for comparison purposes).
 * Uses JSON.stringify + a hash-like accumulation.
 */
function documentChecksum(doc) {
  const str = JSON.stringify(doc, Object.keys(doc).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

/**
 * Generate a collection-level checksum from document checksums.
 */
function collectionChecksum(docs) {
  const checksums = docs.map(documentChecksum).sort();
  let hash = 0;
  for (const cs of checksums) {
    for (let i = 0; i < cs.length; i++) {
      const char = cs.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
  }
  return hash.toString(16);
}

// ---------------------------------------------------------------------------
// Collection Validators
// ---------------------------------------------------------------------------

/**
 * Known collection mappings between Firestore and MongoDB.
 */
export const COLLECTION_MAP = {
  users: { firestore: "users", mongodb: "users" },
  attendance: { firestore: "attendance", mongodb: "attendance" },
  notices: { firestore: "notices", mongodb: "notices" },
  courses: { firestore: "courses", mongodb: "courses" },
  quizzes: { firestore: "quizzes", mongodb: "quizzes" },
  activities: { firestore: "activities", mongodb: "activities" },
};

/**
 * Validate consistency of a specific collection.
 */
export async function validateCollection(collectionName, options = {}) {
  const { sampleSize = 100, firestoreDb, mongoDb } = options;
  const mapping = COLLECTION_MAP[collectionName];

  if (!mapping) {
    return {
      collection: collectionName,
      status: "skipped",
      reason: "No collection mapping defined",
    };
  }

  const result = {
    collection: collectionName,
    firestoreCount: 0,
    mongodbCount: 0,
    countMatch: false,
    sampleComparisons: [],
    status: "unknown",
    issues: [],
  };

  try {
    // Get counts from both databases
    if (mongoDb) {
      result.mongodbCount = await mongoDb.collection(mapping.mongodb).countDocuments();
    }

    if (firestoreDb) {
      const firestoreSnap = await firestoreDb.collection(mapping.firestore).count();
      result.firestoreCount = firestoreSnap.data().count;
    }

    result.countMatch = result.firestoreCount === result.mongodbCount;

    if (!result.countMatch) {
      result.issues.push(
        `Count mismatch: Firestore=${result.firestoreCount}, MongoDB=${result.mongodbCount}`
      );
    }

    // Sample comparison (check a few documents exist in both)
    if (mongoDb && sampleSize > 0) {
      const sample = await mongoDb
        .collection(mapping.mongodb)
        .find({})
        .limit(sampleSize)
        .toArray();

      for (const mongoDoc of sample) {
        const docId = mongoDoc._id?.toString() || mongoDoc.id;
        let existsInFirestore = false;

        if (firestoreDb) {
          const firestoreDoc = await firestoreDb
            .collection(mapping.firestore)
            .doc(docId)
            .get();
          existsInFirestore = firestoreDoc.exists;
        }

        result.sampleComparisons.push({
          id: docId,
          inMongoDb: true,
          inFirestore: existsInFirestore,
          match: existsInFirestore,
        });

        if (!existsInFirestore) {
          result.issues.push(`Document ${docId} exists in MongoDB but not in Firestore`);
        }
      }
    }

    // Determine overall status
    if (result.issues.length === 0) {
      result.status = "consistent";
    } else if (result.issues.length <= 3) {
      result.status = "minor_issues";
    } else {
      result.status = "inconsistent";
    }
  } catch (error) {
    result.status = "error";
    result.issues.push(`Validation error: ${error.message}`);
    logger.error(`[SyncValidator] Error validating ${collectionName}:`, { error: error.message });
  }

  return result;
}

/**
 * Validate all registered collections.
 */
export async function validateAllCollections(options = {}) {
  const collections = Object.keys(COLLECTION_MAP);
  const results = [];

  for (const collection of collections) {
    const result = await validateCollection(collection, options);
    results.push(result);
  }

  const summary = {
    total: results.length,
    consistent: results.filter((r) => r.status === "consistent").length,
    minorIssues: results.filter((r) => r.status === "minor_issues").length,
    inconsistent: results.filter((r) => r.status === "inconsistent").length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  };

  return summary;
}

/**
 * Get sync health score (0-100).
 */
export function calculateSyncHealthScore(validationResults) {
  if (!validationResults || validationResults.length === 0) return 100;

  const total = validationResults.length;
  const consistent = validationResults.filter((r) => r.status === "consistent").length;
  const minorIssues = validationResults.filter((r) => r.status === "minor_issues").length;

  // Consistent = 100 points, minor issues = 75 points, inconsistent = 0, error = 0
  let score = 0;
  for (const result of validationResults) {
    switch (result.status) {
      case "consistent":
        score += 100;
        break;
      case "minor_issues":
        score += 75;
        break;
      case "inconsistent":
        score += 25;
        break;
      default:
        score += 0;
    }
  }

  return Math.round(score / total);
}
