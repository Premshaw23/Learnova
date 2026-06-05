import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (fn) => fn,
}));

vi.mock("@/lib/rbac", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  initializeFirebase: vi.fn(),
}));

vi.mock("firebase-admin", () => {
  const mockSet = vi.fn().mockResolvedValue({});
  const mockGet = vi.fn();
  const mockSetCustomUserClaims = vi.fn().mockResolvedValue({});
  const mockGetUser = vi.fn();

  const firestoreFn = vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: mockGet,
        set: mockSet,
      })),
    })),
  }));

  const authFn = vi.fn(() => ({
    setCustomUserClaims: mockSetCustomUserClaims,
    getUser: mockGetUser,
  }));

  return {
    default: {
      firestore: firestoreFn,
      auth: authFn,
    },
    firestore: firestoreFn,
    auth: authFn,
  };
});

vi.mock("@/lib/mongodb", () => {
  const mockUpdateOne = vi.fn().mockResolvedValue({ matchedCount: 1 });
  const mockFindOne = vi.fn();
  const mockCollection = vi.fn((name) => {
    return {
      updateOne: mockUpdateOne,
      findOne: mockFindOne,
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };
  });

  const mockMongoDb = {
    collection: mockCollection,
  };

  return {
    connectDb: vi.fn().mockResolvedValue(mockMongoDb),
  };
});

vi.mock("@/lib/transactionCoordinator", () => ({
  findStaleOperations: vi.fn().mockResolvedValue([]),
  cleanupOldOperations: vi.fn().mockResolvedValue({}),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

import { POST } from "../route";
import { requireAdmin } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";
import admin from "firebase-admin";

describe("POST /api/admin/reconcile", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({
      payload: { role: "admin", uid: "admin-1" },
    });
  });

  const createMockRequest = (body) => {
    return {
      json: async () => body,
      headers: {
        get: () => "127.0.0.1",
      },
    };
  };

  test("returns message when user is already perfectly in sync", async () => {
    admin.auth().getUser.mockResolvedValue({
      uid: "user-1",
      customClaims: { role: "student" },
    });
    admin
      .firestore()
      .collection()
      .doc()
      .get.mockResolvedValue({
        exists: true,
        data: () => ({
          email: "student@example.com",
          fullName: "Student",
          role: "student",
        }),
      });

    const db = await connectDb();
    db.collection().findOne.mockResolvedValue({
      firebaseUid: "user-1",
      email: "student@example.com",
      fullName: "Student",
      role: "student",
    });

    const response = await POST(createMockRequest({ uid: "user-1" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toContain("fully aligned");
    expect(body.data.actions).toEqual([]);
  });

  test("aligns details in mongo and custom claims when there is inconsistency", async () => {
    admin.auth().getUser.mockResolvedValue({
      uid: "user-2",
      customClaims: { role: "student" }, // Mismatched claim (Firestore says teacher)
    });
    admin
      .firestore()
      .collection()
      .doc()
      .get.mockResolvedValue({
        exists: true,
        data: () => ({
          email: "teacher@example.com",
          fullName: "Teacher Name",
          role: "teacher",
        }),
      });

    const db = await connectDb();
    db.collection().findOne.mockResolvedValue({
      firebaseUid: "user-2",
      email: "old-email@example.com", // Mismatched email
      fullName: "Old Name", // Mismatched name
      role: "student", // Mismatched role
    });

    const response = await POST(createMockRequest({ uid: "user-2" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toContain("reconciled and aligned successfully");
    expect(body.data.actions).toContain("aligned_mongo_details_with_firestore");
    expect(body.data.actions).toContain("aligned_custom_claims_with_firestore");

    expect(db.collection("users").updateOne).toHaveBeenCalledWith(
      { firebaseUid: "user-2" },
      expect.objectContaining({
        $set: {
          email: "teacher@example.com",
          name: "Teacher Name",
          fullName: "Teacher Name",
          role: "teacher",
        },
      })
    );

    expect(admin.auth().setCustomUserClaims).toHaveBeenCalledWith("user-2", {
      role: "teacher",
    });
  });
});
