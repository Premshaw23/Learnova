/**
 * ============================================================================
 * 🧪 MIGRATION FRAMEWORK TESTS (Issue #4225)
 * ============================================================================
 * Tests for the migration runner, history tracker, and sync validator.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCollection = {
  countDocuments: vi.fn(async () => 10),
  find: vi.fn(() => ({
    sort: vi.fn(() => ({
      toArray: vi.fn(async () => []),
    })),
    limit: vi.fn(() => ({
      toArray: vi.fn(async () => []),
    })),
    toArray: vi.fn(async () => []),
  })),
  updateOne: vi.fn(async () => ({})),
  updateMany: vi.fn(async () => ({})),
  findOne: vi.fn(async () => null),
  insertOne: vi.fn(async () => ({})),
  deleteOne: vi.fn(async () => ({})),
  deleteMany: vi.fn(async () => ({ deletedCount: 5 })),
  createIndex: vi.fn(async () => ({})),
  dropIndex: vi.fn(async () => ({})),
  count: vi.fn(async () => ({ data: () => ({ count: 10 }) })),
};

const mockMongoDb = {
  collection: vi.fn(() => mockCollection),
  command: vi.fn(async () => ({ ok: 1 })),
};

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(async () => mockMongoDb),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      count: vi.fn(async () => ({ data: () => ({ count: 10 }) })),
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({
          exists: true,
          data: () => ({ id: "test" }),
        })),
      })),
      where: vi.fn(() => ({
        get: vi.fn(async () => ({
          docs: [],
          empty: true,
        })),
      })),
    })),
  })),
}));

// ---------------------------------------------------------------------------
// Migration Base Class Tests
// ---------------------------------------------------------------------------

describe("Migration Base Class", () => {
  let Migration;

  beforeEach(async () => {
    const mod = await import("@/lib/migrations/Migration.js");
    Migration = mod.default;
  });

  it("should create a migration with id and name", () => {
    const m = new Migration("001", "Test Migration");
    expect(m.id).toBe("001");
    expect(m.name).toBe("Test Migration");
  });

  it("should throw error when up() is not implemented", async () => {
    const m = new Migration("001", "Test");
    await expect(m.up({})).rejects.toThrow("up() not implemented");
  });

  it("should throw error when down() is not implemented", async () => {
    const m = new Migration("001", "Test");
    await expect(m.down({})).rejects.toThrow("down() not implemented");
  });

  it("should return canApply: true by default from validate()", async () => {
    const m = new Migration("001", "Test");
    const result = await m.validate();
    expect(result.canApply).toBe(true);
  });

  it("should return empty collections by default from getAffectedCollections()", () => {
    const m = new Migration("001", "Test");
    const collections = m.getAffectedCollections();
    expect(collections.firestore).toEqual([]);
    expect(collections.mongodb).toEqual([]);
  });

  it("should execute up method and return success", async () => {
    const m = new Migration("001", "Test");
    m.up = vi.fn(async () => {});
    const result = await m.execute({}, "up");
    expect(result.success).toBe(true);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("should execute down method and return success", async () => {
    const m = new Migration("001", "Test");
    m.down = vi.fn(async () => {});
    const result = await m.execute({}, "down");
    expect(result.success).toBe(true);
  });

  it("should return failure when execute throws", async () => {
    const m = new Migration("001", "Test");
    m.up = vi.fn(async () => {
      throw new Error("Test error");
    });
    const result = await m.execute({}, "up");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Test error");
  });
});

// ---------------------------------------------------------------------------
// Migration Registry Tests
// ---------------------------------------------------------------------------

describe("Migration Registry", () => {
  let registerMigrations, getRegisteredMigrations;

  beforeEach(async () => {
    const mod = await import("@/lib/migrations/migrationRunner.js");
    registerMigrations = mod.registerMigrations;
    getRegisteredMigrations = mod.getRegisteredMigrations;
  });

  it("should register and retrieve migrations", () => {
    const testMigrations = [
      { id: "001", name: "Test 1" },
      { id: "002", name: "Test 2" },
    ];
    registerMigrations(testMigrations);
    const registered = getRegisteredMigrations();
    expect(registered).toHaveLength(2);
    expect(registered[0].id).toBe("001");
  });
});

// ---------------------------------------------------------------------------
// Migration Runner Tests
// ---------------------------------------------------------------------------

describe("Migration Runner", () => {
  let runMigrations, getMigrationRunnerStatus, registerMigrations;

  beforeEach(async () => {
    const mod = await import("@/lib/migrations/migrationRunner.js");
    runMigrations = mod.runMigrations;
    getMigrationRunnerStatus = mod.getMigrationRunnerStatus;
    registerMigrations = mod.registerMigrations;
  });

  it("should return no pending migrations when none registered", async () => {
    registerMigrations([]);
    const result = await runMigrations({ dryRun: true, environment: "test" });
    expect(result.success).toBe(true);
    expect(result.message).toContain("No pending");
  });

  it("should show status with registered migrations", async () => {
    registerMigrations([{ id: "001", name: "Test" }]);
    const status = await getMigrationRunnerStatus("test");
    expect(status.totalRegistered).toBe(1);
    expect(status.pending).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Sync Validator Tests
// ---------------------------------------------------------------------------

describe("Sync Validator", () => {
  let validateCollection, calculateSyncHealthScore;

  beforeEach(async () => {
    const mod = await import("@/lib/migrations/syncValidator.js");
    validateCollection = mod.validateCollection;
    calculateSyncHealthScore = mod.calculateSyncHealthScore;
  });

  it("should return skipped for unknown collection", async () => {
    const result = await validateCollection("unknown_collection");
    expect(result.status).toBe("skipped");
  });

  it("should calculate health score for consistent results", () => {
    const results = [
      { status: "consistent" },
      { status: "consistent" },
      { status: "consistent" },
    ];
    const score = calculateSyncHealthScore(results);
    expect(score).toBe(100);
  });

  it("should calculate health score with minor issues", () => {
    const results = [
      { status: "consistent" },
      { status: "minor_issues" },
      { status: "consistent" },
    ];
    const score = calculateSyncHealthScore(results);
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(100);
  });

  it("should return 100 for empty results", () => {
    const score = calculateSyncHealthScore([]);
    expect(score).toBe(100);
  });

  it("should return 100 for null results", () => {
    const score = calculateSyncHealthScore(null);
    expect(score).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Individual Migration Tests
// ---------------------------------------------------------------------------

describe("Individual Migrations", () => {
  let EncryptFaceDescriptors, AddAttendanceIndexes, SyncNoticeAudiences;
  let StandardizeQuizSessions, AddAuditFields;

  beforeEach(async () => {
    const m1 = await import("@/lib/migrations/001_encrypt_face_descriptors.js");
    const m2 = await import("@/lib/migrations/002_add_attendance_indexes.js");
    const m3 = await import("@/lib/migrations/003_sync_notice_audiences.js");
    const m4 = await import("@/lib/migrations/004_standardize_quiz_sessions.js");
    const m5 = await import("@/lib/migrations/005_add_audit_fields.js");
    EncryptFaceDescriptors = m1.default;
    AddAttendanceIndexes = m2.default;
    SyncNoticeAudiences = m3.default;
    StandardizeQuizSessions = m4.default;
    AddAuditFields = m5.default;
  });

  it("migration 001 should have correct id and name", () => {
    const m = new EncryptFaceDescriptors();
    expect(m.id).toBe("001");
    expect(m.name).toContain("face descriptors");
  });

  it("migration 002 should have correct id and name", () => {
    const m = new AddAttendanceIndexes();
    expect(m.id).toBe("002");
    expect(m.name).toContain("attendance");
  });

  it("migration 003 should have correct id and name", () => {
    const m = new SyncNoticeAudiences();
    expect(m.id).toBe("003");
    expect(m.name).toContain("notice");
  });

  it("migration 004 should have correct id and name", () => {
    const m = new StandardizeQuizSessions();
    expect(m.id).toBe("004");
    expect(m.name).toContain("quiz");
  });

  it("migration 005 should have correct id and name", () => {
    const m = new AddAuditFields();
    expect(m.id).toBe("005");
    expect(m.name).toContain("audit");
  });

  it("all migrations should implement up() and down()", async () => {
    const migrationClasses = [
      EncryptFaceDescriptors,
      AddAttendanceIndexes,
      SyncNoticeAudiences,
      StandardizeQuizSessions,
      AddAuditFields,
    ];

    for (const MigrationClass of migrationClasses) {
      const m = new MigrationClass();
      const context = {
        mongoDb: mockMongoDb,
        firestoreDb: null,
        dryRun: true,
        environment: "test",
      };

      // Should not throw
      await expect(m.up(context)).resolves.not.toThrow;
      await expect(m.down(context)).resolves.not.toThrow;
    }
  });
});
