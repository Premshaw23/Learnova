import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (fn) => fn,
}));

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  initializeFirebase: vi.fn(),
  getAdminDb: vi.fn(),
}));

vi.mock("firebase-admin", () => {
  const firestoreFn = vi.fn(() => ({
    collection: vi.fn(() => ({
      limit: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
      })),
    })),
  }));
  return {
    default: { firestore: firestoreFn },
    firestore: firestoreFn,
  };
});

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/lib/compensationHandlers", () => ({}));

vi.mock("@/lib/transactionCoordinator", () => ({
  findStaleOperations: vi.fn(),
  cleanupOldOperations: vi.fn().mockResolvedValue({}),
  reconcileStuckOperation: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => {
  const collections = new Map();
  const mockFindCursor = {
    toArray: vi.fn().mockResolvedValue([]),
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    project: vi.fn().mockReturnThis(),
  };
  const mockCollection = vi.fn((name) => {
    if (!collections.has(name)) {
      collections.set(name, {
        find: vi.fn().mockReturnValue(mockFindCursor),
        updateOne: vi.fn().mockResolvedValue({ matchedCount: 1 }),
        bulkWrite: vi.fn().mockResolvedValue({
          upsertedCount: 0,
          modifiedCount: 0,
        }),
        deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 }),
      });
    }
    return collections.get(name);
  });
  return {
    connectDb: vi.fn().mockResolvedValue({ collection: mockCollection }),
  };
});

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

import { POST } from "./route";
import { requireAuth } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";
import {
  findStaleOperations,
  cleanupOldOperations,
  reconcileStuckOperation,
} from "@/lib/transactionCoordinator";

describe("POST /api/admin/reconciliation-job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({ uid: "admin-1", role: "admin" });
    findStaleOperations.mockResolvedValue([]);
  });

  const createMockRequest = () => ({
    headers: { get: () => "127.0.0.1" },
  });

  test("resolves stale in_progress operations via reconcileStuckOperation", async () => {
    const stuckOp = {
      operationId: "attendance:user-1:2026-08-05",
      operationType: "attendance_record",
      uid: "user-1",
      status: "in_progress",
      updatedAt: new Date(Date.now() - 10 * 60 * 1000),
      steps: [{ name: "write_firestore", status: "completed" }],
    };
    findStaleOperations.mockResolvedValue([stuckOp]);
    reconcileStuckOperation.mockResolvedValue({
      operationId: stuckOp.operationId,
      status: "failed",
      needs_review: true,
      fullyCompensated: true,
      compensationResults: [],
    });

    const response = await POST(createMockRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(reconcileStuckOperation).toHaveBeenCalledWith(stuckOp);
    expect(body.data.results.staleOperationsReviewed).toBe(1);
    expect(body.data.results.stuckOperationsReconciled).toBe(1);
  });

  test("leaves fully compensated compensating operations resolved_by_reconciliation", async () => {
    const op = {
      operationId: "op-c",
      operationType: "set_role",
      uid: "user-1",
      status: "compensating",
      fullyCompensated: true,
      updatedAt: new Date(Date.now() - 10 * 60 * 1000),
      steps: [],
    };
    findStaleOperations.mockResolvedValue([op]);

    const response = await POST(createMockRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(reconcileStuckOperation).not.toHaveBeenCalled();
    expect(body.data.results.stuckOperationsReconciled).toBe(0);

    const db = await connectDb();
    expect(db.collection("pending_operations").updateOne).toHaveBeenCalledWith(
      { operationId: "op-c" },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "resolved_by_reconciliation",
        }),
      })
    );
  });

  test("records an error when stuck operation reconciliation fails", async () => {
    const stuckOp = {
      operationId: "op-x",
      operationType: "attendance_record",
      uid: "user-1",
      status: "in_progress",
      steps: [],
    };
    findStaleOperations.mockResolvedValue([stuckOp]);
    reconcileStuckOperation.mockRejectedValue(
      new Error("compensation exploded")
    );

    const response = await POST(createMockRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.results.errors).toContain(
      "Stale operations review failed: compensation exploded"
    );
  });

  test("calls cleanupOldOperations for old completed operations", async () => {
    const response = await POST(createMockRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(cleanupOldOperations).toHaveBeenCalled();
    expect(body.data.results.errors).toEqual([]);
  });
});
