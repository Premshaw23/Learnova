import { describe, it, expect, vi, beforeEach } from "vitest";
import { connectDb } from "@/lib/mongodb";
import {
  generateIdempotencyKey,
  executeSaga,
  findExistingOperation,
  markIdempotent,
  findStaleOperations,
  cleanupOldOperations,
} from "@/lib/transactionCoordinator";

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  initializeFirebase: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("TransactionCoordinator", () => {
  let mockCollection;
  let mockDb;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-id" }),
      updateOne: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 }),
      findOne: vi.fn().mockResolvedValue(null),
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
        limit: vi.fn().mockReturnThis(),
      }),
    };

    mockDb = {
      collection: vi.fn().mockReturnValue(mockCollection),
    };

    connectDb.mockResolvedValue(mockDb);
  });

  describe("generateIdempotencyKey", () => {
    it("generates a unique key with prefix and uid", () => {
      const key1 = generateIdempotencyKey("set_role", "user-123");
      const key2 = generateIdempotencyKey("set_role", "user-123");
      expect(key1).toContain("set_role_user-123_");
      expect(key1).not.toBe(key2);
    });

    it("generates keys with correct format", () => {
      const key = generateIdempotencyKey("bulk_import", "uid-456");
      expect(key.match(/^bulk_import_uid-456_[a-z0-9]+_[a-z0-9]+$/)).toBeTruthy();
    });
  });

  describe("executeSaga", () => {
    it("executes all steps successfully and returns success", async () => {
      const step1 = vi.fn().mockResolvedValue();
      const step2 = vi.fn().mockResolvedValue();

      const result = await executeSaga({
        operationType: "test_op",
        uid: "user-1",
        steps: [
          { name: "step1", execute: step1, compensate: vi.fn() },
          { name: "step2", execute: step2, compensate: vi.fn() },
        ],
      });

      expect(result.success).toBe(true);
      expect(step1).toHaveBeenCalled();
      expect(step2).toHaveBeenCalled();
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it("compensates completed steps when a later step fails", async () => {
      const compensate1 = vi.fn().mockResolvedValue();
      const compensate2 = vi.fn().mockResolvedValue();
      const step3 = vi.fn().mockRejectedValue(new Error("step3 failed"));

      const result = await executeSaga({
        operationType: "test_op",
        uid: "user-1",
        steps: [
          { name: "step1", execute: vi.fn().mockResolvedValue(), compensate: compensate1 },
          { name: "step2", execute: vi.fn().mockResolvedValue(), compensate: compensate2 },
          { name: "step3", execute: step3, compensate: vi.fn() },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.failedStep).toBe("step3");
      expect(compensate2).toHaveBeenCalled();
      expect(compensate1).toHaveBeenCalled();
    });

    it("returns fullyCompensated: true when all compensations succeed", async () => {
      const result = await executeSaga({
        operationType: "test_op",
        uid: "user-1",
        steps: [
          {
            name: "step1",
            execute: vi.fn().mockResolvedValue(),
            compensate: vi.fn().mockResolvedValue(),
          },
          {
            name: "step2",
            execute: vi.fn().mockRejectedValue(new Error("fail")),
            compensate: vi.fn().mockResolvedValue(),
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.fullyCompensated).toBe(true);
    });

    it("returns fullyCompensated: false when compensation fails", async () => {
      const result = await executeSaga({
        operationType: "test_op",
        uid: "user-1",
        steps: [
          {
            name: "step1",
            execute: vi.fn().mockResolvedValue(),
            compensate: vi.fn().mockRejectedValue(new Error("compensation failed")),
          },
          {
            name: "step2",
            execute: vi.fn().mockRejectedValue(new Error("fail")),
            compensate: vi.fn(),
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.fullyCompensated).toBe(false);
    });

    it("retries compensation up to MAX_COMPENSATION_RETRIES times", async () => {
      let callCount = 0;
      const flakyCompensate = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error("transient failure"));
        }
        return Promise.resolve();
      });

      const result = await executeSaga({
        operationType: "test_op",
        uid: "user-1",
        steps: [
          {
            name: "step1",
            execute: vi.fn().mockResolvedValue(),
            compensate: flakyCompensate,
          },
          {
            name: "step2",
            execute: vi.fn().mockRejectedValue(new Error("fail")),
            compensate: vi.fn(),
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(flakyCompensate).toHaveBeenCalledTimes(3);
    });

    it("handles steps without compensators gracefully", async () => {
      const result = await executeSaga({
        operationType: "test_op",
        uid: "user-1",
        steps: [
          { name: "step1", execute: vi.fn().mockResolvedValue(), compensate: null },
          {
            name: "step2",
            execute: vi.fn().mockRejectedValue(new Error("fail")),
            compensate: null,
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.compensationResults).toEqual([]);
    });

    it("records pending operation in MongoDB", async () => {
      await executeSaga({
        operationType: "test_op",
        uid: "user-1",
        steps: [
          { name: "step1", execute: vi.fn().mockResolvedValue(), compensate: vi.fn() },
        ],
      });

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          operationType: "test_op",
          uid: "user-1",
          status: "in_progress",
          steps: expect.arrayContaining([
            expect.objectContaining({ name: "step1", status: "pending" }),
          ]),
        })
      );
    });

    it("updates pending operation to completed on success", async () => {
      await executeSaga({
        operationType: "test_op",
        uid: "user-1",
        steps: [
          { name: "step1", execute: vi.fn().mockResolvedValue(), compensate: vi.fn() },
        ],
      });

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          $set: expect.objectContaining({ status: "completed" }),
        })
      );
    });
  });

  describe("findExistingOperation", () => {
    it("returns the existing operation if found", async () => {
      const mockOp = { operationId: "op-123", status: "completed" };
      mockCollection.findOne.mockResolvedValue(mockOp);

      const result = await findExistingOperation("op-123");
      expect(result).toEqual(mockOp);
    });

    it("returns null if no operation found", async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await findExistingOperation("op-123");
      expect(result).toBeNull();
    });

    it("returns null on database error", async () => {
      mockCollection.findOne.mockRejectedValue(new Error("DB error"));

      const result = await findExistingOperation("op-123");
      expect(result).toBeNull();
    });
  });

  describe("markIdempotent", () => {
    it("upserts an idempotent record with the result", async () => {
      await markIdempotent("op-123", { success: true, data: "test" });

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { operationId: "op-123" },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: "idempotent",
            idempotentResult: { success: true, data: "test" },
          }),
        }),
        { upsert: true }
      );
    });
  });

  describe("findStaleOperations", () => {
    it("returns stale operations older than the timeout", async () => {
      const staleOps = [
        { operationId: "op-1", status: "in_progress" },
        { operationId: "op-2", status: "compensating" },
      ];
      const mockCursor = {
        toArray: vi.fn().mockResolvedValue(staleOps),
      };
      mockCollection.find.mockReturnValue(mockCursor);

      const result = await findStaleOperations(60000);
      expect(result).toEqual(staleOps);
    });

    it("returns empty array on error", async () => {
      const mockCursor = {
        toArray: vi.fn().mockRejectedValue(new Error("DB error")),
      };
      mockCollection.find.mockReturnValue(mockCursor);

      const result = await findStaleOperations();
      expect(result).toEqual([]);
    });
  });

  describe("cleanupOldOperations", () => {
    it("deletes old completed/idempotent/failed operations", async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 5 });

      await cleanupOldOperations();

      expect(mockCollection.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          status: { $in: ["completed", "idempotent", "failed"] },
        })
      );
    });
  });
});
